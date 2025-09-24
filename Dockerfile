# ===========================================
# Production stage - Backend Only
# ===========================================
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=10000

# Install system dependencies and locales
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    locales \
    && echo "id_ID.UTF-8 UTF-8" > /etc/locale.gen \
    && locale-gen \
    && rm -rf /var/lib/apt/lists/*

# Set default locale
ENV LANG=id_ID.UTF-8 \
    LC_ALL=id_ID.UTF-8

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Make the entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Expose the port the app runs on
EXPOSE $PORT

# Set the entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]
