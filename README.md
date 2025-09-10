# Business Accounting App

A modern, cross-platform desktop application for managing business finances, built with Tauri, React, TypeScript, and SQLite.

## Features

- 💼 **Account Management**: Create and manage financial accounts with different types (Asset, Liability, Equity, Income, Expense)
- 💰 **Transaction Tracking**: Record and categorize financial transactions
- 📊 **Financial Reports**: Generate reports to analyze your business finances
- 🖥️ **Cross-Platform**: Works on Windows, macOS, and Linux
- 🔒 **Local-First**: Your data stays on your machine with SQLite database
- 🎨 **Modern UI**: Clean, responsive interface built with Tailwind CSS

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Tauri 2.0 (Rust)
- **Database**: SQLite with rusqlite
- **State Management**: React Hooks & Context API
- **Build Tool**: Vite

## Prerequisites

- Node.js 18+ and npm
- Rust (latest stable version)
- [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites) for your platform

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/business-accounting-app.git
   cd business-accounting-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run tauri dev
   ```

4. **Build the application**
   ```bash
   npm run tauri build
   ```

## Project Structure

```
.
├── src/                    # Frontend React application
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Application pages
│   └── App.tsx            # Main application component
├── src-tauri/             # Tauri backend
│   ├── src/
│   │   ├── commands/      # Tauri command handlers
│   │   └── main.rs        # Tauri application entry point
│   └── Cargo.toml         # Rust dependencies
└── db/                    # Database migrations and schema
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run tauri dev` - Start Tauri in development mode
- `npm run build` - Build the production bundle
- `npm run tauri build` - Build the desktop application
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Database

The application uses SQLite for data storage. The database is automatically created in the user's app data directory when the application first runs.

### Database Schema

- **accounts**: Stores financial accounts
- **transactions**: Records financial transactions between accounts

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository.

---
