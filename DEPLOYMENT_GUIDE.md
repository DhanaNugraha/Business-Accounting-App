# Deployment Guide

This guide explains how to deploy the application with the frontend on Vercel and the backend on PythonAnywhere.

## Table of Contents
1. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
2. [Backend Deployment (PythonAnywhere)](#backend-deployment-pythonanywhere)
3. [Connecting Frontend to Backend](#connecting-frontend-to-backend)
4. [Troubleshooting](#troubleshooting)

## Frontend Deployment (Vercel)

1. **Push your code to a GitHub repository** (if not already done)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_REPOSITORY_URL
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com) and sign in with your GitHub account
   - Click "Add New..." > "Project"
   - Import your repository
   - In the project settings:
     - Set the root directory to `frontend`
     - Set the build command to `npm run build`
     - Set the output directory to `dist`
   - Add the following environment variables:
     - `VITE_API_BASE_URL`: Your PythonAnywhere backend URL (e.g., `https://yourusername.pythonanywhere.com`)
   - Click "Deploy"

## Backend Deployment (PythonAnywhere)

1. **Create a PythonAnywhere account**
   - Go to [PythonAnywhere](https://www.pythonanywhere.com/)
   - Create a free account (or log in if you already have one)

2. **Set up a new web app**
   - Go to the "Web" tab
   - Click "Add a new web app"
   - Choose "Manual Configuration" (not "Flask" or "Django")
   - Select Python 3.10 (or the version you're using)
   - Click "Next"

3. **Upload your code**
   - In the "Files" tab, navigate to `/home/yourusername/`
   - Upload your project files or clone your repository:
     ```bash
     git clone YOUR_REPOSITORY_URL
     ```

4. **Set up a virtual environment**
   - In the "Consoles" tab, open a new Bash console
   - Navigate to your project directory
   - Create a virtual environment:
     ```bash
     python -m venv venv
     source venv/bin/activate
     pip install -r requirements.txt
     ```

5. **Configure the WSGI file**
   - In the "Web" tab, click on the WSGI configuration file link
   - Replace the contents with:
     ```python
     import sys
     import os
     
     # Add your project directory to the Python path
     project_home = '/home/yourusername/your-project-directory'
     if project_home not in sys.path:
         sys.path.append(project_home)
     
     # Set environment variables
     os.environ['PYTHONUNBUFFERED'] = '1'
     
     # Import your FastAPI app
     from main import app as application  # noqa
     ```
   - Save the file

6. **Configure static files**
   - In the "Web" tab, scroll down to "Static files"
   - Add a new mapping:
     - URL: `/static`
     - Directory: `/home/yourusername/your-project-directory/static`

7. **Start the web app**
   - In the "Web" tab, click the green "Reload" button
   - Your app should now be running at `https://yourusername.pythonanywhere.com`

## Connecting Frontend to Backend

1. **Update CORS in your FastAPI app**
   Make sure your `main.py` has CORS middleware configured to accept requests from your Vercel domain:
   ```python
   from fastapi.middleware.cors import CORSMiddleware
   
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
