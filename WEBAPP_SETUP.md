# Web App Setup Guide

## 🎉 What's Been Created

A modern web application infrastructure with:

- ✅ **Flask Backend** with PostgreSQL
- ✅ **JWT Authentication** (register/login)
- ✅ **REST API** endpoints
- ✅ **WebSocket** support for real-time updates
- ✅ **Database Models** (Users, YouTube Accounts, Jobs, Clips, Settings)
- ✅ **Job Processing** with queue management
- ✅ **Docker** configuration
- ⏳ **React Frontend** (needs to be initialized)

## 📁 Project Structure

```
youtube-viral-clipper/
├── backend/                    # Flask Backend ✅
│   ├── api/                    # API endpoints
│   │   ├── auth.py            # Authentication
│   │   ├── jobs.py            # Job management
│   │   ├── clips.py           # Clips management
│   │   ├── settings.py        # User settings
│   │   ├── youtube.py         # YouTube OAuth
│   │   └── websocket.py       # Real-time updates
│   ├── models/                # Database models
│   │   ├── user.py
│   │   ├── youtube_account.py
│   │   ├── job.py
│   │   ├── clip.py
│   │   └── settings.py
│   ├── services/              # Business logic
│   │   ├── job_manager.py    # Job queue
│   │   └── processor.py      # Video processing
│   ├── app.py                 # Main Flask app
│   ├── config.py              # Configuration
│   └── requirements.txt       # Python dependencies
├── frontend/                  # React Frontend ⏳ (to be created)
├── src/                       # Existing CLI code ✅
├── Dockerfile                 # Backend container ✅
└── docker-compose.yml         # Full stack ✅
```

## 🚀 Quick Start

### Option 1: Docker (Recommended)

1. **Set environment variables**:

```bash
# Create .env file
cat > .env << 'EOF'
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
OPENAI_API_KEY=your-openai-api-key
EOF
```

2. **Start services**:

```bash
docker-compose up -d
```

3. **Access the API**:
- Backend: http://localhost:5000
- Database: localhost:5432

### Option 2: Local Development

1. **Setup PostgreSQL**:

```bash
# Install PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb viral_clipper
```

2. **Install backend dependencies**:

```bash
cd backend
pip install -r requirements.txt
```

3. **Run database migrations**:

```bash
# Initialize migrations
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

4. **Start backend**:

```bash
python app.py
```

Backend will run at http://localhost:5000

## 📡 API Endpoints

### Authentication

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","username":"user","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get current user
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Jobs

```bash
# Create job
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"video_url":"https://youtube.com/watch?v=VIDEO_ID"}'

# List jobs
curl http://localhost:5000/api/jobs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get job details
curl http://localhost:5000/api/jobs/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Cancel job
curl -X POST http://localhost:5000/api/jobs/1/cancel \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Clips

```bash
# List clips
curl http://localhost:5000/api/clips \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Download clip
curl http://localhost:5000/api/clips/1/download \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -O

# Get thumbnail
curl http://localhost:5000/api/clips/1/thumbnail \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -O
```

### Settings

```bash
# Get settings
curl http://localhost:5000/api/settings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Update settings
curl -X PUT http://localhost:5000/api/settings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"min_viral_score":8.0,"thumbnail_mode":"advanced"}'
```

## 🔌 WebSocket Events

Connect to `ws://localhost:5000` and join a job room to receive real-time updates:

```javascript
const socket = io('http://localhost:5000');

// Join job room
socket.emit('join', { room: 'job_1' });

// Listen for updates
socket.on('progress', (data) => {
  console.log(`Job ${data.job_id}: ${data.progress}% - ${data.step}`);
});

socket.on('log', (data) => {
  console.log(`[${data.level}] ${data.message}`);
});

socket.on('complete', (data) => {
  console.log(`Job complete! Created ${data.clips_created} clips`);
});
```

## ⚛️ Frontend Setup (Next Steps)

The backend is ready! Now create the React frontend:

### 1. Initialize React App

```bash
npx create-react-app frontend --template typescript
cd frontend
```

### 2. Install Dependencies

```bash
npm install \
  react-router-dom \
  axios \
  socket.io-client \
  @headlessui/react \
  react-icons \
  zustand

npm install -D \
  tailwindcss \
  postcss \
  autoprefixer \
  @types/react-router-dom

npx tailwindcss init -p
```

### 3. Key Components to Create

```
frontend/src/
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Jobs.tsx
│   ├── Clips.tsx
│   └── Settings.tsx
├── components/
│   ├── Navigation.tsx
│   ├── VideoInput.tsx
│   ├── JobCard.tsx
│   ├── ProgressBar.tsx
│   └── ClipCard.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── WebSocketContext.tsx
├── services/
│   ├── api.ts
│   └── websocket.ts
└── App.tsx
```

### 4. Example API Service

```typescript
// frontend/src/services/api.ts
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const jobsAPI = {
  list: (params?: any) => api.get('/jobs', { params }),
  get: (id: number) => api.get(`/jobs/${id}`),
  create: (data: any) => api.post('/jobs', data),
  cancel: (id: number) => api.post(`/jobs/${id}/cancel`),
  delete: (id: number) => api.delete(`/jobs/${id}`),
};

export const clipsAPI = {
  list: (params?: any) => api.get('/clips', { params }),
  get: (id: number) => api.get(`/clips/${id}`),
  download: (id: number) => `${API_URL}/api/clips/${id}/download`,
  thumbnail: (id: number) => `${API_URL}/api/clips/${id}/thumbnail`,
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
};
```

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
pg_isready

# If using Docker
docker-compose logs postgres
```

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill it
kill -9 <PID>
```

### Migration Issues

```bash
# Reset database (WARNING: deletes all data)
flask db downgrade base
flask db upgrade
```

## 🔐 Security Notes

⚠️ **Before Production**:

1. Change `SECRET_KEY` and `JWT_SECRET_KEY` in `.env`
2. Use strong database password
3. Enable HTTPS
4. Set `DEBUG=False`
5. Configure proper CORS origins
6. Add rate limiting
7. Implement refresh token rotation

## 📚 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Flask-SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com/)
- [Flask-SocketIO](https://flask-socketio.readthedocs.io/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🎯 What's Next?

See [NEXT_STEPS.md](NEXT_STEPS.md) for detailed implementation guide for:
- React frontend
- YouTube OAuth flow
- Real-time UI updates
- File upload/download
- Advanced features

---

**Need help?** Check the troubleshooting section or open an issue!

