import { useEffect, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { startHealthChecks } from '../services/api';

export const BackendStatus = () => {
  const { state, dispatch } = useAppContext();
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const cleanup = startHealthChecks((status) => {
      const isReady = status === 'ok';
      dispatch({ type: 'SET_BACKEND_READY', payload: isReady });
      
      // Show notification when status changes
      if (isReady) {
        setIsVisible(true);
        const timer = setTimeout(() => setIsVisible(false), 5000);
        return () => clearTimeout(timer);
      } else {
        setIsVisible(true);
      }
    });

    // Clean up on component unmount
    return cleanup;
  }, [state.isBackendReady]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`p-4 rounded-lg shadow-lg max-w-sm ${
          state.isBackendReady 
            ? 'bg-green-100 border-l-4 border-green-500 text-green-700' 
            : 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700'
        }`}
        role="alert"
      >
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold">
              {state.isBackendReady ? 'Backend Terhubung' : 'Backend Mulai'}
            </p>
            <p className="text-sm">
              {state.isBackendReady 
                ? 'Sistem siap digunakan.' 
                : 'Sistem sedang memulai. Mengimpor dan mengekspor data akan memakan waktu lebih lama.'}
            </p>
            {!state.isBackendReady && (
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs mt-1 text-yellow-700 hover:underline"
              >
                {showDetails ? 'Sembunyikan' : 'Mengapa ini terjadi?'}
              </button>
            )}
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className="ml-4 text-gray-500 hover:text-gray-700"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>
        
        {showDetails && !state.isBackendReady && (
          <div className="mt-2 text-xs text-yellow-800 bg-yellow-50 p-2 rounded">
            <p className="mb-1">Server backend sedang memulai. Mengimpor dan mengekspor data akan memakan waktu lebih lama.</p>
<p>Fitur akan tersedia segera setelah backend siap.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackendStatus;
