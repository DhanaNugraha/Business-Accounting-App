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
import Layout from './components/Layout';
import UploadPage from './pages/UploadPage';
import EditorPage from './pages/EditorPage';
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Toaster position="top-center" />
        <RouterProvider router={router} />
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;
