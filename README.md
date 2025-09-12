# Business Accounting App

A modern web application for managing business accounting tasks, generating financial reports, and analyzing financial data. This application provides a user-friendly interface for uploading financial data, generating reports, and visualizing financial metrics.

## ✨ Features

- **Template Generation**: Download pre-formatted Excel templates for standardized data entry
- **Secure File Upload**: Upload and validate financial data with comprehensive error checking
- **Comprehensive Reports**: Generate detailed financial reports including:
  - Balance Sheet
  - Income Statement
  - Cash Flow Statement
- **Interactive Visualizations**: Dynamic charts and graphs for better financial insights
- **Responsive Design**: Fully responsive interface that works on all device sizes
- **Data Validation**: Client and server-side validation for data integrity
- **Error Handling**: Comprehensive error messages and validation feedback

## 🚀 Tech Stack

### Backend
- **Python 3.11+**: Core programming language
- **FastAPI**: Modern, fast web framework for building APIs
- **Pandas**: Data manipulation and analysis
- **Uvicorn**: ASGI server for running FastAPI
- **Pydantic**: Data validation and settings management

### Frontend
- **React 18**: Frontend library for building user interfaces
- **TypeScript**: Type-safe JavaScript
- **Vite**: Next-generation frontend tooling
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Composable charting library
- **React Query**: Data fetching and state management
- **React Hook Form**: Form handling and validation
- **Framer Motion**: Animation library for smooth UI interactions
- **React Hot Toast**: Beautiful and accessible notifications

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **npm** (comes with Node.js) or **yarn** (recommended)
- **Git** - [Download](https://git-scm.com/)

### 🛠️ Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/business-accounting-app.git
   cd business-accounting-app
   ```

2. **Set up Python virtual environment**
   ```bash
   # Windows
   python -m venv .venv
   .venv\Scripts\activate
   
   # macOS/Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Environment Variables**
   Create a `.env` file in the project root:
   ```env
   # Server Configuration
   PORT=8000
   HOST=0.0.0.0
   
   # Development Settings
   DEBUG=true
   
   # CORS (Comma-separated origins)
   CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```

5. **Start the backend server**
   ```bash
   python main.py
   ```
   - API Documentation: `http://localhost:8000/docs`
   - API Base URL: `http://localhost:8000`

### 💻 Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   # Using npm
   npm install
   
   # Or using yarn (recommended)
   yarn install
   ```

3. **Environment Variables**
   Create a `.env` file in the `frontend` directory:
   ```env
   # API Configuration
   VITE_API_BASE_URL=http://localhost:8000
   
   # App Configuration
   VITE_APP_NAME="Business Accounting App"
   VITE_APP_VERSION=1.0.0
   
   # Feature Flags
   VITE_ENABLE_ANALYTICS=false
   ```

4. **Start the development server**
   ```bash
   # Using npm
   npm run dev
   
   # Or using yarn
   yarn dev
   ```
   - Application: `http://localhost:3000`
   - Vite Dev Server: `http://localhost:3000`

5. **Build for Production**
   ```bash
   # Build the app
   npm run build
   
   # Preview the production build
   npm run preview
   ```

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Available Endpoints

- `GET /download-template` - Download Excel template
- `POST /upload` - Upload financial data file
- `POST /download-updated` - Download processed reports
- `GET /reports/balance-sheet` - Get balance sheet data
- `GET /reports/income-statement` - Get income statement data
- `GET /reports/cash-flow` - Get cash flow data

## 🏗️ Project Structure

```
Business-Accounting-App/
├── frontend/               # Frontend React application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── assets/         # Images, fonts, etc.
│   │   ├── components/     # Reusable UI components
│   │   │   ├── common/     # Common components (buttons, inputs, etc.)
│   │   │   ├── layout/     # Layout components
│   │   │   └── reports/    # Report-specific components
│   │   ├── pages/          # Page components
│   │   │   ├── UploadPage/   # File upload page
│   │   │   └── ReportsPage/  # Reports display page
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   ├── App.tsx         # Main App component
│   │   └── main.tsx        # Application entry point
│   ├── .env                # Environment variables
│   ├── index.html          # HTML template
│   ├── package.json        # Dependencies and scripts
│   ├── tsconfig.json       # TypeScript config
│   └── vite.config.ts      # Vite configuration
│
├── .venv/                  # Python virtual environment
├── .env                    # Environment variables
├── main.py                 # FastAPI application
├── generate_template.py     # Excel template generation
├── requirements.txt         # Python dependencies
├── README.md               # This file
└── .gitignore              # Git ignore file
```

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
pytest

# Run tests with coverage
pytest --cov=.
```

### Frontend Tests
```bash
# Run unit tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 🚀 Deployment

### Backend Deployment
1. Set up a production server (e.g., Nginx, Gunicorn)
2. Configure environment variables for production
3. Set up process management (PM2, Systemd)

### Frontend Deployment
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder to a static file server (Netlify, Vercel, S3, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
