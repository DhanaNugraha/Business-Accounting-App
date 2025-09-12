import * as React from 'react';
import { 
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
  Navigate
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import UploadPage from './pages/UploadPage';
import ReportsPage from './pages/ReportsPage';

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

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </div>
    </QueryClientProvider>
  );
};

export default App;
