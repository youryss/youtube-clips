## YouTube Viral Clipper – Architecture Overview

This document describes the high‑level architecture of the YouTube Viral Clipper application: what we use for the backend and frontend, how the main flows work (jobs, transcription, analysis, clipping), and how components talk to each other. It is intentionally code‑free and focused on concepts.

---

## High‑Level System Diagram

At a high level, the system looks like this:

```text
┌───────────────────────────────┐
│          Frontend             │
│  (Next.js React dashboard)    │
│                               │
│  - Auth pages (login/register)│
│  - Dashboard / Jobs / Clips   │
│  - Settings, YouTube connect  │
│  - Real‑time job progress     │
└──────────────┬────────────────┘
               │ HTTP (REST) + WebSocket (Socket.IO)
               ▼
┌───────────────────────────────┐
│           Backend             │
│        (Flask API)           │
│                               │
│  - Auth / Users / Settings    │
│  - Jobs / Clips APIs          │
│  - YouTube OAuth + metadata   │
│  - WebSocket events           │
└──────────────┬────────────────┘
               │
               │ uses
               ▼
┌───────────────────────────────┐
│       Services Layer          │
│  - Job Manager + Workers      │
│  - Video download (yt‑dlp)    │
│  - Transcription (Whisper)    │
│  - Analysis (OpenAI)          │
│  - Video slicing & thumbnails │
└──────────────┬────────────────┘
               │
               │ persists to
               ▼
┌───────────────────────────────┐
│        PostgreSQL DB          │
│  - Users / Settings           │
│  - YouTube accounts           │
│  - Jobs / Clips               │
└───────────────────────────────┘
```

---

## Backend Architecture

**Tech stack**

- **Framework**: `Flask` (REST API) + `Flask‑SocketIO` (real‑time WebSocket events).
- **Auth**: `flask-jwt-extended` (JWT based) + `flask-bcrypt` for password hashing.
- **Database & migrations**: `Flask‑SQLAlchemy`, `psycopg2-binary` (PostgreSQL), `Flask‑Migrate`.
- **Background / async**: Custom **Job Manager** built on Python threads + a queue.
- **Video & audio**: `yt-dlp` for download, `ffmpeg/ffprobe` for media handling.
- **Transcription**: `faster-whisper` for Whisper transcription.
- **AI analysis**: `openai` for GPT‑based viral‑clip analysis.
- **Google / YouTube**: `google-auth`, `google-api-python-client` for OAuth and YouTube API.

**Main entrypoint**

- `backend/app.py` exposes a `create_app` factory which:
  - Configures Flask from `config.py` and the environment.
  - Initializes database, JWT, CORS, Socket.IO, and migrations.
  - Registers API blueprints: `auth`, `jobs`, `clips`, `settings`, `youtube`.
  - Registers WebSocket handlers from `api.websocket`.
  - Exposes a health endpoint (`/health`) and a root API info endpoint (`/`).
- When run directly, it:
  - Creates DB tables if they don't exist.
  - Starts the global **Job Manager**.
  - Reloads any **pending** jobs from the database back into the queue.
  - Runs the app via `socketio.run(..., async_mode="eventlet")`.

### Domain model (conceptual)

The main conceptual models in `backend/models` are:

- **User**: authentication identity; owns Jobs, Settings, YouTube accounts.
- **YouTubeAccount**: link between a user and YouTube OAuth credentials.
- **Settings**: user‑level processing preferences (e.g., criteria, clip limits).
- **Job**:
  - Identified by an ID and **owned by a User**.
  - Stores the input `video_url` and processing state:
    - `status` (e.g., pending, downloading, transcribing, analyzing, slicing, completed, failed, cancelled).
    - `current_step`, `progress` (0–100), `error_message`.
    - Paths to downloaded video, audio, transcript, generated clips.
  - Has many **Clips**.
- **Clip**:
  - Belongs to a Job.
  - Stores start/end timestamps, viral score, title, reasoning, thumbnail path and output video path.

---

## API Layer

The API layer is implemented as Flask blueprints in `backend/api`:

- **Auth API (`auth.py`)**

  - Handles register/login and issues JWTs.
  - JWTs are required for all job and clip operations.

- **Jobs API (`jobs.py`)**

  - **List jobs** for the current user with pagination.
  - **Create job**: accept a YouTube video URL and create a `Job` with status `pending`.
    - Immediately enqueues the job into the **Job Manager** queue.
  - **Get job**: fetch a single job and its fields.
  - **Delete job**: remove a job.
  - **Cancel job**: move a job to `cancelled` (if still in a cancellable status).
  - **Job logs**: return a summary of status, error message, progress, and timestamps.
  - **Job transcript**:
    - Loads the transcript JSON (produced by the transcription service).
    - Returns a concatenated full‑text transcript for UI display.
  - **Job thumbnail**:
    - Prefer YouTube thumbnail (constructed from the video ID).
    - Fallback to the first generated clip’s local thumbnail.

- **Clips API (`clips.py`)**

  - Exposes endpoints to list clips per job, download/export clip files, etc.

- **Settings API (`settings.py`)**

  - Allows a user to update processing preferences (criteria, limits, etc.).

- **YouTube API (`youtube.py`)**

  - Handles OAuth flows using `client_secrets.json` and `youtube_token.json`.
  - Manages linking a YouTube account to a user and possibly publishing clips.

- **WebSocket (`websocket.py`)**
  - Registers `Socket.IO` event handlers.
  - Pushes real‑time updates on job progress and status changes to connected clients.

---

## Services Layer

The **services layer** under `backend/services` implements the core processing pipeline and encapsulates external integrations.

### Job Manager

`job_manager.py` defines `JobManager`:

- Internally uses:
  - A `queue.Queue` to hold `(job_id, user_id)` work items.
  - A configurable pool of worker threads (`max_workers`).
  - A dictionary of `active_jobs` mapping job IDs to `VideoProcessor` instances.
- Workflow:
  1. API creates a Job and calls `get_job_manager().add_job(job_id, user_id)`.
  2. A worker thread takes the job from the queue and constructs a `VideoProcessor(job_id, user_id)`.
  3. It calls `processor.process()`, which runs the full pipeline (download → transcription → analysis → slicing).
  4. On completion or failure, the worker removes the job from `active_jobs` and marks the queue item done.
- Jobs can be:
  - **Cancelled** by asking the active `VideoProcessor` to cancel.
  - **Re‑queued** on app restart by scanning for Jobs with `status='pending'` in `app.py`.

### Video processing pipeline

The pipeline is orchestrated by `processor.py` (conceptually, the **VideoProcessor**):

1. **Download service (`video_download_service.py`)**

   - Uses `yt-dlp` to download the YouTube video to temporary storage.
   - Normalizes filenames and stores the path on the Job.
   - Updates Job status to `downloading` and progress via DB + WebSocket.

2. **Transcription service (`transcription_service.py`)**

   - Steps:
     1. **Download audio** from the video URL (or re‑use an existing local audio file).
     2. Use `ffprobe` to compute audio duration.
     3. Load `faster-whisper` **WhisperModel** (configured via `processing_config.py` – model name, device, compute type).
     4. Call `model.transcribe()` to stream segments.
     5. For each segment:
        - Create an entry with `start`, `end`, `text`, and **formatted timestamps**.
        - Compute an estimated progress % based on `segment.end / audio_duration`.
        - Optionally invoke a callback, which the `VideoProcessor` uses to:
          - Update the Job’s `progress` field in DB.
          - Emit WebSocket events for UI updates.
     6. Cache the transcript JSON on disk (to avoid re‑transcribing).
   - Stores the transcript path on the Job and sets status to `transcribing` → `analyzing`.

3. **Analyzer service (`analyzer_service.py`)**

   - Reads **criteria** from the `criteria/` folder (`emotional_peaks.txt`, `viral_hooks.txt`, etc.) via `processing_config`.
   - Builds a long, structured **prompt** containing:
     - The full transcript with timestamps.
     - The viral criteria text.
     - A precise JSON schema for the expected output.
   - Calls the **OpenAI Chat Completions API** with:
     - A system message enforcing “no hallucination / only literal transcript content”.
     - User message containing the prompt.
   - Parses the JSON response:
     - Extracts candidate clips with start/end times, viral score, criteria matched, reasoning, title, key quote.
     - Converts timestamp strings to seconds.
     - Enforces min/max duration and min viral score.
     - Sorts clips by score and returns the top N (configured in `processing_config`).
   - The resulting segments become the basis for clip slicing.

4. **Video slicing & thumbnails (`video_slicer_service.py`)**

   - Uses `ffmpeg` to cut the original video into short clips for the selected segments.
   - Saves per‑clip video files and optional thumbnails.
   - Updates corresponding `Clip` records and the Job status to `slicing` → `completed`.

5. **YouTube publishing (conceptual)**
   - Using `youtube_service.py`, clips can be uploaded back to YouTube Shorts or other endpoints if configured:
     - Uses the stored YouTube OAuth tokens.
     - Applies titles/descriptions derived from the analysis metadata.

Throughout the pipeline, `VideoProcessor`:

- Maintains the Job’s `status` and `current_step`.
- Updates `progress` using a coarse mapping, e.g.:
  - Download: 0–20%
  - Transcription: 20–60%
  - Analysis: 60–80%
  - Slicing: 80–100%
- Emits WebSocket events so the UI remains real‑time.

---

## Frontend Architecture

**Tech stack**

- **Framework**: `Next.js` (App Router) with React.
- **Language**: TypeScript.
- **Styling**: Tailwind CSS (v4) + utility helpers (`clsx`, `tailwind-merge`).
- **UI primitives**: Radix UI + custom components (buttons, inputs, tables, etc.).
- **State management**: `zustand` for global app state (e.g., auth, jobs).
- **HTTP client**: `axios` for API calls to the Flask backend.
- **Real‑time**: `socket.io-client` for receiving job progress updates.
- **Feedback / toasts**: `react-hot-toast` and `sonner`.
- **Testing / Storybook**:
  - `vitest`, React Testing Library for tests.
  - Storybook for isolated UI development.

**Routing structure (`frontend/src/app`)**

- `(auth)/login` & `(auth)/register`:
  - Public routes for sign‑in and account creation.
  - On success, store JWT and redirect to the dashboard.
- `(dashboard)/layout.tsx`:
  - Auth‑protected shell containing header, sidebar, and global providers.
  - Wraps nested routes with access to auth state and Socket.IO connection.
- `(dashboard)/dashboard`:
  - Overview of user activity and recent jobs.
- `(dashboard)/jobs`:
  - Jobs table + filters + pagination.
  - Each row shows status, progress, created time, and actions (view, cancel, delete).
- `(dashboard)/clips`:
  - List of clips generated across jobs with preview, thumbnail, and download/export.
- `(dashboard)/settings`:
  - Lets the user adjust criteria, maybe toggle which clip types to prioritize, etc.
- `youtube/callback`:
  - Handles the redirect back from YouTube OAuth and finalizes account linking.

**Frontend data flow**

```text
User action (paste URL, click "Create job")
        │
        ▼
Next.js page calls Jobs API (Axios → /api/jobs POST)
        │
        ▼
Backend creates Job, enqueues it, returns Job JSON
        │
        ▼
Zustand store updates jobs list + UI shows "pending"
        │
        ▼
Socket.IO client listens for job progress events
        │
        ▼
UI updates status/progress bars in real‑time
```

---

## Job Lifecycle & State Diagram

### State machine

Conceptually, each Job moves through these states:

```text
            ┌────────────┐
            │  pending   │  (created, queued)
            └─────┬──────┘
                  │ picked by worker
                  ▼
           ┌───────────────┐
           │  downloading  │  (video/audio)
           └──────┬────────┘
                  │ download OK
                  ▼
           ┌───────────────┐
           │ transcribing  │  (Whisper)
           └──────┬────────┘
                  │ transcript OK
                  ▼
           ┌───────────────┐
           │  analyzing    │  (OpenAI)
           └──────┬────────┘
                  │ viral segments found
                  ▼
           ┌───────────────┐
           │   slicing     │  (ffmpeg cuts)
           └──────┬────────┘
                  │ clips created
                  ▼
            ┌────────────┐
            │ completed  │
            └────────────┘
```

From most states there are also failure paths:

- On any error, the Job can move to **failed** with `error_message` set.
- On user request (from pending/downloading/transcribing/analyzing/slicing), the Job can move to **cancelled**.

---

## Transcription & Analysis Flow

This section focuses on the part that turns a long YouTube video into a set of candidate viral clips.

```text
YouTube URL
   │
   ▼
Download audio (yt‑dlp)
   │
   ▼
Generate timestamped transcript (faster‑whisper)
   │
   ▼
Read criteria files (emotional_peaks, viral_hooks, etc.)
   │
   ▼
Build GPT prompt (transcript + criteria + schema)
   │
   ▼
OpenAI ChatCompletion → JSON with segments
   │
   ▼
Filter/validate segments (duration + score)
   │
   ▼
Create Clip records → slice video with ffmpeg
```

**Key ideas**

- We always ground the AI analysis in:
  - Exact transcript text with timestamps.
  - Explicit criteria stored in version‑controlled text files.
- The OpenAI call is structured to return **JSON only**, which is validated before storing.
- This separation allows us to:
  - Swap out criteria files without backend code changes.
  - Swap models or prompt structure while keeping the rest of the pipeline intact.

---

## Real‑Time Updates (WebSockets)

Real‑time UX is provided via **Socket.IO**:

- On the backend:
  - `Flask‑SocketIO` is initialized in `app.py` with CORS configured for the frontend origin.
  - The `VideoProcessor` / services call helper functions to:
    - Emit events like `job_status_changed`, `job_progress`, `job_completed`, `job_failed`.
    - Include job ID, new status, progress, and brief messages in payloads.
- On the frontend:
  - `socket.io-client` connects when an authenticated user loads the dashboard.
  - Listeners subscribe to job events and update the zustand store.
  - UI components (e.g., Jobs table, progress bars, toasts) react to store changes.

This gives the user immediate visual feedback while long‑running transcription and analysis tasks are executing.

---

## Deployment & Runtime

**Docker**

- The repo includes a `Dockerfile` for the backend and one for the frontend, plus `docker-compose.yml` at the root.
- Typical deployment:
  - **Backend container**: runs Flask + Socket.IO with `eventlet`, connects to PostgreSQL.
  - **Frontend container**: runs `next start` in production mode, serving the React app.
  - **Database**: PostgreSQL service (local or managed).
  - Shared volumes for:
    - Temporary media (downloads, audio, transcripts, clips).
    - Logs if desired.

**Configuration**

- Environment variables control:
  - DB connection string.
  - JWT secret, CORS origins, Socket.IO allowed origins.
  - OpenAI API key and model name.
  - Whisper model/device/compute type.
  - Paths for temp storage and output.
  - Google/YouTube OAuth credentials (client ID/secret).

---

## How to Use This Document

- **New contributors**: start here to understand how the pieces fit together, then dive into:
  - `backend/app.py` for app initialization.
  - `backend/services/processor.py` for the pipeline orchestrator.
  - `backend/services/transcription_service.py` and `analyzer_service.py` for the core AI logic.
  - `frontend/src/app/(dashboard)` for the main UI.
- **Architectural changes**: when you change flows (e.g., new criteria, new queue mechanism, or a different transcription engine), update this file so the doc stays in sync with reality.

