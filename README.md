# YouTube Viral Clipper

An AI-powered application that automatically identifies and creates viral-worthy clips from YouTube videos. The app uses AI to analyze videos, find the best moments, and generate short-form content ready for social media.

<img width="1491" height="815" alt="Screenshot 2025-12-18 at 08 58 05" src="https://github.com/user-attachments/assets/d911cf63-f972-4e34-aa6a-07278febea1b" />

## What It Does

- Downloads YouTube videos
- Transcribes audio with timestamps
- Uses AI to identify viral moments (hooks, emotional peaks, value bombs, humor)
- Automatically creates video clips from the best segments
- Provides a web interface to manage and upload clips

## Prerequisites

- Python 3.11+
- Node.js 20+
- Docker and Docker Compose
- ffmpeg
- OpenAI API key

## Setup

### 1. Environment Variables

Create a `.env` file in the project root:

```bash
OPENAI_API_KEY=your_openai_api_key_here
SECRET_KEY=your_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_WS_URL=ws://localhost:5001
```

### 2. Build the Application

#### Backend

```bash
# Install Python dependencies
pip install -r backend/requirements.txt
pip install -r requirements.txt
```

#### Frontend

```bash
cd frontend
npm install
npm run build
```

### 3. Docker Setup

Build and run all services with Docker Compose:

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

This will start:

- **PostgreSQL** database on port `5432`
- **Backend API** on port `5001`
- **Frontend** on port `3001`

To stop the services:

```bash
docker-compose down
```

Running app locally with auto reload

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build postgres backend frontend-dev
```

### 4. Storybook Setup

Storybook is used for developing and testing UI components in isolation.

```bash
cd frontend
npm run storybook
```

This will start Storybook on `http://localhost:6006`

To build Storybook for production:

```bash
npm run build-storybook
```

## Development

### Running Backend Locally

```bash
# Set up virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
pip install -r requirements.txt

# Run the backend
cd backend
python app.py
```

### Running Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Project Structure

```
├── backend/          # Flask API backend
│   ├── services/     # Backend services (video processing, transcription, analyzer, slicer)
│   ├── api/          # API routes
│   └── models/       # Database models
├── frontend/         # Next.js frontend
├── criteria/         # AI analysis criteria files
├── output/           # Generated video clips
└── docker-compose.yml # Docker configuration
```

## License

MIT License
