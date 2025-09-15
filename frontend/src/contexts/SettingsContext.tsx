import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type SettingsContextType = {
  reminderInterval: number;
  setReminderInterval: (interval: number) => void;
  isReminderActive: boolean;
  toggleReminder: (active: boolean) => void;
};

const defaultSettings = {
  reminderInterval: 300000, // 5 minutes in milliseconds
  isReminderActive: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    // Load settings from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    }
    return defaultSettings;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-settings', JSON.stringify(settings));
    }
  }, [settings]);

  const setReminderInterval = (interval: number) => {
    setSettings((prev: any) => ({
      ...prev,
      reminderInterval: interval,
    }));
  };

  const toggleReminder = (isActive: boolean) => {
    setSettings((prev: any) => ({
      ...prev,
      isReminderActive: isActive,
    }));
  };

  return (
    <SettingsContext.Provider
      value={{
        reminderInterval: settings.reminderInterval,
        setReminderInterval,
        isReminderActive: settings.isReminderActive,
        toggleReminder,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Export available intervals in milliseconds
export const REMINDER_INTERVALS = [
  { value: 5000, label: '5 detik (untuk testing)' },
  { value: 60000, label: '1 menit' },
  { value: 300000, label: '5 menit' },
  { value: 900000, label: '15 menit' },
  { value: 1800000, label: '30 menit' },
  { value: 3600000, label: '1 jam' },
];
