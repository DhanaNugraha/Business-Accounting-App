# ===========================================
# Build stage - Frontend
# ===========================================
FROM node:18 AS frontend-builder

WORKDIR /app/frontend

# Copy package files first for better caching
COPY frontend/package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the frontend files
COPY frontend/ .

# Set environment for production build
ENV NODE_ENV=production
VITE_API_BASE_URL=https://business-accounting-app.onrender.com

# Build the frontend
RUN npm run build

# ===========================================
# Production stage - Backend + Frontend
# ===========================================
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=10000 \
    NODE_ENV=production

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy frontend build from builder stage
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Copy built frontend files
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose the port the app runs on
EXPOSE $PORT

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
