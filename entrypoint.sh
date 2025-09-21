#!/bin/sh

# Use the PORT environment variable if set, otherwise default to 10000
PORT=${PORT:-10000}

# Start the application
exec uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
