import { useState } from 'react';
import { useSettings, REMINDER_INTERVALS } from '../../contexts/SettingsContext';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

const ReminderSettings = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    reminderInterval,
    setReminderInterval,
    isReminderActive,
    toggleReminder,
  } = useSettings();

  const formatInterval = (ms: number) => {
    if (ms < 60000) return `${ms / 1000} detik`;
    if (ms < 3600000) return `${ms / 60000} menit`;
    return `${ms / 3600000} jam`;
  };

  return (
    <div className="border-t border-gray-200 pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        <div className="flex items-center">
          <Cog6ToothIcon className="h-5 w-5 mr-2 text-gray-500" />
          <span>Reminder Settings</span>
        </div>
        <svg
          className={`h-5 w-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Aktifkan Pengingat</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isReminderActive}
                onChange={(e) => toggleReminder(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {isReminderActive && (
            <div className="space-y-2">
              <label 
                htmlFor="reminder-interval" 
                className="block text-sm font-medium text-gray-700"
              >
                Interval Pengingat
              </label>
              <select
                id="reminder-interval"
                value={reminderInterval}
                onChange={(e) => setReminderInterval(Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                {REMINDER_INTERVALS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Pengingat berikutnya dalam: {formatInterval(reminderInterval)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReminderSettings;
