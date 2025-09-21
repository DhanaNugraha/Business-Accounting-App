import { 
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
  Navigate
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from './contexts/AppContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Layout from './components/Layout';
import UploadPage from './pages/UploadPage';
import EditorPage from './pages/EditorPage';
import ReportsPage from './pages/ReportsPage';
import BackendStatus from './components/BackendStatus';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Create the router instance
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route path="/" element={<Navigate to="/upload" replace />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/editor" element={<EditorPage />} />
      <Route path="/reports" element={<ReportsPage />} />
    </Route>
  ),
  {
    // Configure future flags to prevent deprecation warnings
    future: {
      v7_relativeSplatPath: true, // Enable the future flag to ensure compatibility
    },
  }
);

// Common toast options
const toastOptions = {
  position: 'top-center' as const,
  style: {
    background: '#1F2937', // gray-800
    color: '#F9FAFB', // gray-50
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    fontSize: '14px',
    maxWidth: '500px',
  },
  duration: 3000,
  success: {
    duration: 3000,
    iconTheme: {
      primary: '#10B981', // emerald-500
      secondary: '#F9FAFB', // gray-50
    },
  },
  error: {
    duration: 5000,
    iconTheme: {
      primary: '#EF4444', // red-500
      secondary: '#F9FAFB', // gray-50
    },
  },
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <AppProvider>
          <Toaster {...toastOptions} />
          <BackendStatus />
          <RouterProvider router={router} />
        </AppProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
};

export default App;
