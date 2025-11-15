# Deployment Fix Guide

## Issue
The frontend is trying to connect to `http://localhost:5001` instead of your server IP.

## Solution

### Option 1: Using Docker Compose (Recommended)

1. **Create a `.env` file in the root directory** with your server configuration:

```bash
# Frontend API URL (where your backend is accessible)
REACT_APP_API_URL=http://164.90.193.41:5001
REACT_APP_WS_URL=ws://164.90.193.41:5001

# Backend CORS (where your frontend is accessible)
CORS_ORIGINS=http://164.90.193.41:3001,http://localhost:3001

# Backend secrets (change these!)
SECRET_KEY=your-secret-key-here-change-this
JWT_SECRET_KEY=your-jwt-secret-here-change-this
OPENAI_API_KEY=your-openai-api-key
```

2. **Rebuild and restart the services**:

```bash
# Rebuild the frontend with the new environment variables
docker-compose build frontend

# Restart all services
docker-compose up -d
```

### Option 2: Manual Frontend Build

If you're not using Docker Compose, you need to:

1. **Create a `.env` file in the `frontend/` directory**:

```bash
cd frontend
cat > .env << 'EOF'
REACT_APP_API_URL=http://164.90.193.41:5001
REACT_APP_WS_URL=ws://164.90.193.41:5001
EOF
```

2. **Rebuild the frontend**:

```bash
npm run build
```

3. **Update backend CORS** - Set the `CORS_ORIGINS` environment variable to include your frontend URL:

```bash
export CORS_ORIGINS=http://164.90.193.41:3001,http://localhost:3001
```

## Verification

After applying the fix:

1. Check that the frontend is making requests to the correct URL:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try to register/login
   - Verify the request goes to `http://164.90.193.41:5001/api/auth/register` (not localhost)

2. Check backend CORS:
   - The backend should accept requests from `http://164.90.193.41:3001`
   - Check backend logs for CORS errors

## Important Notes

- **React environment variables** (REACT_APP_*) must be set **at build time**, not runtime
- If you change the API URL, you **must rebuild** the frontend
- The backend CORS configuration must allow your frontend origin
- Both services need to be accessible on the ports you've configured (3001 for frontend, 5001 for backend)

