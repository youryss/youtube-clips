# Backend Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies including Node.js for JavaScript runtime
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    postgresql-client \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
    libvulkan1 \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Verify Node.js installation and add to PATH if needed
RUN node --version || (echo "Node.js not found, checking installation..." && which nodejs && ln -s /usr/bin/nodejs /usr/local/bin/node || true)
ENV PATH="/usr/bin:${PATH}"

# Copy requirements first for better caching
COPY backend/requirements.txt /app/backend/
COPY requirements.txt /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Ensure yt-dlp is installed with JavaScript runtime support (yt-dlp-ejs)
RUN pip install --no-cache-dir --upgrade yt-dlp[default]

# Install Playwright for cookie generation (optional - can be skipped if low on disk space)
# Note: Cookie generation is handled by the cookie-refresh container, so this is optional here
RUN pip install --no-cache-dir playwright || echo "Warning: Playwright installation failed, continuing without it"
RUN playwright install chromium || echo "Warning: Chromium installation failed, continuing without it"
RUN playwright install-deps chromium || echo "Warning: Chromium deps installation failed, continuing without it"

# Copy application code
COPY backend/ /app/backend/
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


