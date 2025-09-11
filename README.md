# Business Accounting App

A modern web application for managing business accounting tasks, generating financial reports, and analyzing financial data.

## Features

- **Template Generation**: Download Excel templates for data entry
- **File Processing**: Upload and process accounting data
- **Financial Reports**: Generate Balance Sheet, Income Statement, and Cash Flow Statement
- **Data Visualization**: Interactive charts for better financial insights
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- Python 3.11+
- FastAPI
- Pandas
- Uvicorn

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- React Query

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- npm or yarn

### Backend Setup

1. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   # or
   source .venv/bin/activate  # macOS/Linux
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the backend server:
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

## API Documentation

Once the backend is running, access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
Business-Accounting-App/
├── frontend/               # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── App.tsx         # Main App component
│   │   └── main.tsx        # Entry point
│   ├── public/             # Static files
│   └── package.json        # Frontend dependencies
│
├── .venv/                  # Python virtual environment
├── main.py                 # Backend API server
├── generate_template.py     # Template generation logic
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
