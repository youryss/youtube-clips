# Multi-stage build for React app
FROM node:20-alpine as build

WORKDIR /app

# Accept build arguments for environment variables
ARG REACT_APP_API_URL=http://localhost:5001
ARG REACT_APP_WS_URL=ws://localhost:5001

# Set environment variables for build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --silent --legacy-peer-deps

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check (install wget for healthcheck)
RUN apk add --no-cache wget

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]

