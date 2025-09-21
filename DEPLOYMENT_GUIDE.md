# Deployment Guide: Vercel (Frontend) + Render (Backend)

This guide explains how to deploy the application with the frontend on Vercel and the backend on Render for optimal performance and scalability.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Deployment Steps](#deployment-steps)
3. [Environment Variables](#environment-variables)
4. [Troubleshooting](#troubleshooting)
5. [Scaling](#scaling)

## Prerequisites

1. A GitHub account with your code pushed to a repository
2. A Vercel account (free tier available) for frontend hosting
3. A Render.com account (free tier available) for backend hosting
4. Python 3.10+ and Node.js 18+ installed locally for development

## Backend Deployment (Render)

1. **Deploy Backend to Render**
   - Log in to your [Render](https://render.com) account
   - Click "New" and select "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - Name: `business-accounting-backend` (or your preferred name)
     - Region: Choose the one closest to your users
     - Branch: `main` (or your default branch)
     - Root Directory: `.` (root of the repository)
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1`
   - Click "Create Web Service"

2. **Configure Backend Environment Variables**
   - In your Render dashboard, go to the "Environment" tab
   - Add the following environment variables:
     - `PYTHONUNBUFFERED`: `1`
     - `PYTHONDONTWRITEBYTECODE`: `1`
     - `PORT`: `10000` (this will be overridden by Render)
   - Click "Save Changes"

3. **Get Backend URL**
   - After deployment, note your backend URL (e.g., `https://your-app-backend.onrender.com`)
   - Update the following files with your backend URL:
     - `frontend/src/services/api.ts`
     - `frontend/vite.config.ts` (in the preview.proxy section)

## Frontend Deployment (Vercel)

1. **Deploy Frontend to Vercel**
   - Log in to your [Vercel](https://vercel.com) account
   - Click "Add New..." > "Project"
   - Import your GitHub repository
   - In the project settings:
     - Root Directory: `frontend`
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`
   - Add the following environment variable:
     - `VITE_API_BASE_URL`: `https://your-app-backend.onrender.com` (use your actual backend URL)
   - Click "Deploy"

2. **Configure Custom Domain (Optional)**
   - In your Vercel dashboard, go to the "Domains" section
   - Add your custom domain if desired
   - Update the CORS settings in your backend to include this domain

## Environment Variables

### Backend (Render)
| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Port the server listens on | Yes |
| `PYTHONUNBUFFERED` | Enable unbuffered Python output | No |
| `PYTHONDONTWRITEBYTECODE` | Prevent Python from writing .pyc files | No |

### Frontend (Vercel)
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Base URL of your Render backend | Yes |
| `NODE_ENV` | Environment mode (`development` or `production`) | No |

## Troubleshooting

### Backend Issues
1. **Build Fails on Render**
   - Check the build logs in the Render dashboard
   - Common issues:
     - Missing dependencies in `requirements.txt`
     - Build timeout (free tier has a 15-minute limit)
     - Python version mismatch (ensure it matches your local environment)

2. **Backend Crashes**
   - Check the logs in the Render dashboard
   - Common issues:
     - Port binding issues (ensure using `$PORT` environment variable)
     - Missing environment variables
     - CORS errors (check allowed origins in `main.py`)

### Frontend Issues
1. **Build Fails on Vercel**
   - Check the build logs in the Vercel dashboard
   - Common issues:
     - Missing dependencies in `package.json`
     - Build timeout (increase build timeout in Vercel settings if needed)

2. **API Connection Issues**
   - Verify `VITE_API_BASE_URL` is correctly set in Vercel environment variables
   - Check browser's developer console for CORS errors
   - Ensure the backend URL is accessible from the browser

## Scaling

### Backend (Render)
1. **Free Tier**
   - 512 MB RAM
   - Shared CPU
   - Automatic sleep after 15 minutes of inactivity
   - Limited to 750 hours/month

2. **Paid Plans**
   - More RAM and CPU options
   - Always-on instances
   - Auto-scaling
   - Custom domains with SSL

### Frontend (Vercel)
1. **Free Tier**
   - Automatic HTTPS
   - Global CDN
   - Automatic deployments from Git
   - Custom domains

2. **Pro Plan**
   - More build minutes
   - More bandwidth
   - Team features
   - Advanced analytics
   
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
