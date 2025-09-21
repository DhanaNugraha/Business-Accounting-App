# Deployment Guide for Render

This guide explains how to deploy the full-stack application on Render.com with both frontend and backend in a single service.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Deployment Steps](#deployment-steps)
3. [Environment Variables](#environment-variables)
4. [Troubleshooting](#troubleshooting)
5. [Scaling](#scaling)

## Prerequisites

1. A GitHub account with your code pushed to a repository
2. A Render.com account (free tier available)
3. Python 3.10+ and Node.js 18+ installed locally for development

## Deployment Steps

1. **Prepare Your Repository**
   - Make sure your code is pushed to a GitHub repository
   - Ensure you have the following files in your repository:
     - `Dockerfile` (already configured)
     - `render.yaml` (already configured)
     - `requirements.txt` (Python dependencies)
     - `frontend/package.json` (Frontend dependencies)

2. **Deploy to Render**
   - Log in to your [Render](https://render.com) account
   - Click "New" and select "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - Name: `business-accounting-app` (or your preferred name)
     - Region: Choose the one closest to your users
     - Branch: `main` (or your default branch)
     - Root Directory: `.` (root of the repository)
     - Build Command: `cd frontend && npm install && npm run build`
     - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1`
   - Click "Create Web Service"

3. **Configure Environment Variables**
   - In your Render dashboard, go to the "Environment" tab
   - Add the following environment variables:
     - `PYTHONUNBUFFERED`: `1`
     - `PYTHONDONTWRITEBYTECODE`: `1`
     - `NODE_ENV`: `production`
     - `PORT`: `10000` (this will be overridden by Render)
   - Click "Save Changes"

4. **Deploy**
   - Render will automatically start building and deploying your application
   - You can monitor the build logs in the "Logs" tab
   - Once deployed, your app will be available at `https://your-app-name.onrender.com`

## Environment Variables

Here are the important environment variables used by the application:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Port the server listens on | `10000` | Yes |
| `NODE_ENV` | Environment mode (`development` or `production`) | `production` | No |
| `PYTHONUNBUFFERED` | Enable unbuffered Python output | `1` | No |
| `PYTHONDONTWRITEBYTECODE` | Prevent Python from writing .pyc files | `1` | No |

## Troubleshooting

1. **Build Fails**
   - Check the build logs in the Render dashboard
   - Common issues:
     - Missing dependencies in `requirements.txt` or `package.json`
     - Build timeout (free tier has a 15-minute limit)
     - Insufficient memory (upgrade to a paid plan if needed)

2. **Application Crashes**
   - Check the application logs in the Render dashboard
   - Common issues:
     - Port binding issues (make sure to use `$PORT` environment variable)
     - Missing environment variables
     - Database connection issues (if using a database in the future)

3. **CORS Errors**
   - The application is configured to allow requests from common origins
   - If you need to add more origins, update the `origins` list in `main.py`

## Scaling

1. **Free Tier**
   - 512 MB RAM
   - Shared CPU
   - Automatic sleep after 15 minutes of inactivity

2. **Paid Plans**
   - More RAM and CPU options
   - Always-on instances
   - Auto-scaling
   - Custom domains with SSL
   
   app = FastAPI()
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://your-vercel-app.vercel.app"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **Update frontend environment variables**
   - In your Vercel project settings, update the `VITE_API_BASE_URL` to point to your PythonAnywhere backend:
     ```
     VITE_API_BASE_URL=https://yourusername.pythonanywhere.com
     ```

## Troubleshooting

### Backend Issues
- **Module not found errors**: Make sure all dependencies are installed in your virtual environment
- **Application errors**: Check the PythonAnywhere error logs in the "Web" tab
- **Static files not loading**: Verify the static files configuration and file permissions

### Frontend Issues
- **CORS errors**: Double-check your CORS configuration in the FastAPI app
- **API connection issues**: Verify the `VITE_API_BASE_URL` is correct and the backend is running

### General Tips
- Always check the logs in both Vercel and PythonAnywhere for error messages
- Make sure your Python version matches between development and production
- For free PythonAnywhere accounts, your app will sleep after a period of inactivity
