import React, { useState, ReactNode } from 'react';
import { Outlet, NavLink as RouterNavLink } from 'react-router-dom';
import { 
  Bars3Icon as MenuIcon, 
  XMarkIcon as XIcon, 
  ChartBarIcon, 
  ArrowUpTrayIcon as UploadIcon
} from '@heroicons/react/24/outline';

// Icon size classes using Tailwind spacing
const iconClass = 'w-icon-sm h-icon-sm';
const navIconClass = 'w-icon-sm h-icon-sm flex-shrink-0';
const mobileMenuIconClass = 'w-icon-sm h-icon-sm';
interface LayoutProps {
  children?: ReactNode;
}

const NavLink: React.FC<{ to: string; children: ReactNode; icon?: ReactNode }> = ({ 
  to, 
  children, 
  icon 
}) => (
  <RouterNavLink 
    to={to}
    className={({ isActive }) => 
      `group flex items-center px-4 py-3 rounded-lg transition-colors text-sm ${
        isActive 
          ? 'bg-primary-50 text-primary-700 font-medium' 
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
      }`
    }
  >
    {icon && <span className="mr-3 text-current">{React.cloneElement(icon as React.ReactElement, { className: navIconClass })}</span>}
    {children}
  </RouterNavLink>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Upload', to: '/', icon: <UploadIcon className={iconClass} /> },
    { name: 'Reports', to: '/reports', icon: <ChartBarIcon className={iconClass} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile menu */}
      <div className={`lg:hidden fixed inset-0 z-40 ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div 
          className="fixed inset-0 bg-gray-600/75 transition-opacity" 
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        ></div>
        <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl transform transition-transform ease-in-out duration-300">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-500 hover:text-gray-600 focus:outline-none"
              >
                <XIcon className={mobileMenuIconClass} />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => (
                <NavLink key={item.name} to={item.to} icon={item.icon}>
                  {item.name}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-200">
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 lg:fixed lg:inset-y-0 lg:z-50">
        <div className="flex flex-col w-64 h-full border-r border-gray-200 bg-white shadow-sm">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-6">
              <h1 className="text-2xl font-bold text-primary-600">Accounting Pro</h1>
            </div>
            <nav className="mt-8 flex-1 px-4 space-y-2">
              {navigation.map((item) => (
                <NavLink key={item.name} to={item.to} icon={item.icon}>
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Mobile header */}
        <div className="lg:hidden">
          <div className="bg-white shadow-sm">
            <div className="px-4 py-3 flex items-center justify-between">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="text-gray-500 hover:text-gray-600 focus:outline-none"
              >
                <MenuIcon className={mobileMenuIconClass} />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Accounting Pro</h1>
              <div className="w-6"></div> {/* Spacer for alignment */}
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children || <Outlet />}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Accounting Pro. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-500 hover:text-gray-600 text-sm">
                  Privacy
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-600 text-sm">
                  Terms
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-600 text-sm">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;