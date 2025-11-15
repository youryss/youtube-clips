# Backend Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt /app/backend/
COPY requirements.txt /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ /app/backend/
COPY src/ /app/src/
COPY criteria/ /app/criteria/

# Create directories for data
RUN mkdir -p /app/output /app/temp

# Set Python path
ENV PYTHONPATH=/app

# Expose port
EXPOSE 5000

# Set working directory to backend
WORKDIR /app/backend

# Run migrations and start server
CMD ["python", "app.py"]

