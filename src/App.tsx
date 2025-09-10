import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import ReportsPage from './pages/Reports';
import AccountsPage from './pages/Accounts';
import TransactionsPage from './pages/Transactions';
import SettingsPage from './pages/Settings';

// Navigation link component that shows active state
const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        isActive 
          ? 'bg-blue-50 text-blue-700 font-semibold' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {children}
    </Link>
  );
};

export default function App() {
  // Set document title
  useEffect(() => {
    document.title = 'Business Accounting App';
  }, []);

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h1 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">📊</span>
              <span>Accounting</span>
            </h1>
          </div>
          
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <NavLink to="/accounts">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                <i className="text-lg">📊</i>
              </span>
              <span>Accounts</span>
            </NavLink>
            <NavLink to="/transactions">
              <span className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mr-3">
                <i className="text-lg">💳</i>
              </span>
              <span>Transactions</span>
            </NavLink>
            <NavLink to="/reports">
              <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mr-3">
                <i className="text-lg">📈</i>
              </span>
              <span>Reports</span>
            </NavLink>
            <div className="h-px bg-gray-100 my-2"></div>
            <NavLink to="/settings">
              <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center mr-3">
                <i className="text-lg">⚙️</i>
              </span>
              <span>Settings</span>
            </NavLink>
          </nav>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50 transition-all duration-200">
          <div className="p-6 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/reports" replace />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h2>
                <p className="text-gray-600 mb-4">The page you're looking for doesn't exist or has been moved.</p>
                <Link 
                  to="/" 
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}
