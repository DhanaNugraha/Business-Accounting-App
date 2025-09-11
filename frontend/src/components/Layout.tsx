import React, { ReactNode } from 'react';
import { Link, Outlet, NavLink as RouterNavLink } from 'react-router-dom';

interface LayoutProps {
  children?: ReactNode;
}

const NavLink: React.FC<{ to: string; children: ReactNode }> = ({ to, children }) => (
  <RouterNavLink 
    to={to}
    className={({ isActive }: { isActive: boolean }) => 
      `px-3 py-2 rounded-md text-sm font-medium ${
        isActive 
          ? 'bg-primary-100 text-primary-700' 
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      }`
    }
  >
    {children}
  </RouterNavLink>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              <Link to="/" className="hover:text-primary-600 transition-colors">
                Accounting Helper
              </Link>
            </h1>
            <nav className="flex space-x-6">
              <NavLink to="/upload">Upload</NavLink>
              <NavLink to="/reports">Reports</NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children || <Outlet />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Accounting Helper. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
