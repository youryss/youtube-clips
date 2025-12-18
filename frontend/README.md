## Frontend (Next.js App)

This is the frontend for **YouTube Viral Clipper**, built with Next.js (App Router), TypeScript, and Tailwind CSS.

### Commands

- **Install deps**

```bash
npm install
```

- **Run dev server**

```bash
npm run dev
```

Then open `http://localhost:3000`.

### Structure (quick peek)

- `src/app` – routes (auth, dashboard, clips, jobs, settings)
- `src/components` – UI and feature components
- `src/hooks` – data-fetching and state hooks
- `src/services` – API / WebSocket clients

The app expects the backend from the repo root to be running for API and WebSocket calls.
