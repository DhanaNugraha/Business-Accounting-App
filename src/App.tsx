import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import ReportsPage from './pages/Reports';
import AccountsPage from './pages/Accounts';
import TransactionsPage from './pages/Transactions';
import SettingsPage from './pages/Settings';

export default function App() {
  return (
    <Router>
      <div className="flex h-screen">
        <nav className="w-56 bg-gray-100 p-4 flex flex-col space-y-2 shadow-md">
          <Link className="font-bold text-lg mb-4" to="/">Accounting App</Link>
          <Link to="/accounts" className="hover:underline">Accounts</Link>
          <Link to="/transactions" className="hover:underline">Transactions</Link>
          <Link to="/reports" className="hover:underline">Reports</Link>
          <Link to="/settings" className="hover:underline">Settings</Link>
        </nav>
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/reports" replace />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
