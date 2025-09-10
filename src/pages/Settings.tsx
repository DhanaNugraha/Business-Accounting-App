import { useState } from 'react';

type SettingSection = 'general' | 'appearance' | 'backup' | 'about';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingSection>('general');
  const [formData, setFormData] = useState({
    companyName: 'My Business',
    currency: 'USD',
    fiscalYearStart: '2025-01-01',
    theme: 'system',
    autoBackup: true,
    backupFrequency: 'weekly',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">General Settings</h3>
              <p className="text-sm text-gray-500 mt-1">Manage your business information and preferences</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                  <option value="JPY">Japanese Yen (JPY)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year Start</label>
                <input
                  type="date"
                  name="fiscalYearStart"
                  value={formData.fiscalYearStart}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        );
        
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Appearance</h3>
              <p className="text-sm text-gray-500 mt-1">Customize the look and feel of the application</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                <select
                  name="theme"
                  value={formData.theme}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="system">System Default</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>
        );
        
      case 'backup':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Backup & Restore</h3>
              <p className="text-sm text-gray-500 mt-1">Manage your data backup settings</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoBackup"
                  name="autoBackup"
                  checked={formData.autoBackup}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoBackup" className="ml-2 block text-sm text-gray-700">
                  Enable automatic backups
                </label>
              </div>
              
              {formData.autoBackup && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Backup Frequency</label>
                  <select
                    name="backupFrequency"
                    value={formData.backupFrequency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
              
              <div className="pt-4 space-x-3">
                <button className="btn btn-primary">
                  Create Backup Now
                </button>
                <button className="btn bg-gray-200 text-gray-800 hover:bg-gray-300">
                  Restore from Backup
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'about':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">About</h3>
              <p className="text-sm text-gray-500 mt-1">Application information and support</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800">Business Accounting App</h4>
                <p className="text-sm text-blue-700 mt-1">Version 1.0.0</p>
                <p className="text-xs text-blue-600 mt-2">© 2025 Business Accounting App. All rights reserved.</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Support</h4>
                <p className="text-sm text-gray-600">
                  For support, please email: 
                  <a href="mailto:support@businessaccountingapp.com" className="text-blue-600 hover:underline">
                    support@businessaccountingapp.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-48 border-r border-gray-200 p-4">
        <nav className="space-y-1">
          <button
            onClick={() => setActiveSection('general')}
            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
              activeSection === 'general' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveSection('appearance')}
            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
              activeSection === 'appearance' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            Appearance
          </button>
          <button
            onClick={() => setActiveSection('backup')}
            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
              activeSection === 'backup' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            Backup & Restore
          </button>
          <button
            onClick={() => setActiveSection('about')}
            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
              activeSection === 'about' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            About
          </button>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
