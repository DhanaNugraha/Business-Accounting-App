import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

// This component is no longer needed as we're using the main Toaster in App.tsx
export const ExportReminderToast = () => null;

export const showExportReminder = () => {
  toast(
    (t) => (
      <div className="relative pr-6">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="absolute top-1 right-1 p-1 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex flex-col gap-2 pr-4">
          <div className="font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h.01a1 1 0 100-2H10V9z" clipRule="evenodd" />
            </svg>
            Jangan lupa untuk mengekspor perubahan Anda!
          </div>
          <div className="text-sm text-gray-600">
            Perubahan Anda hanya disimpan di browser ini. Silakan ekspor untuk menyimpannya ke file.
          </div>
        </div>
      </div>
    ),
    {
      id: 'export-reminder',
      duration: 10000,
      position: 'top-center',
      style: {
        background: '#FFFFFF',
        color: '#1F2937',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        border: '1px solid #E5E7EB',
      },
      className: 'toast-notification',
    }
  );
};

export const useExportReminder = (intervalMs: number) => {
  const timerRef = useRef<NodeJS.Timeout>();
  const [isActive, setIsActive] = useState(false);
  
  const showReminder = useCallback(() => {
    console.log('Showing export reminder');
    showExportReminder();
  }, []);

  const startReminder = useCallback(() => {
    console.log('Starting export reminder with interval:', intervalMs, 'ms');
    
    // Clear any existing timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Show first reminder immediately
    showReminder();
    
    // Set up recurring reminders
    timerRef.current = setInterval(() => {
      showReminder();
    }, intervalMs);
    
    setIsActive(true);
    
    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [intervalMs, showReminder]);

  const stopReminder = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      clearInterval(timerRef.current);
      timerRef.current = undefined;
      setIsActive(false);
      console.log('Stopped export reminder');
    }
  }, []);

  // Update reminder when interval changes
  useEffect(() => {
    if (isActive) {
      stopReminder();
      startReminder();
    }
    return stopReminder;
  }, [intervalMs, isActive, startReminder, stopReminder]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopReminder();
    };
  }, [stopReminder]);

  return { startReminder, stopReminder, isActive };
};
