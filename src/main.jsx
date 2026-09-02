import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Public website (completely unchanged)
import App from './App.jsx';

// Admin panel
import './admin/admin.css';
import { AuthProvider } from './admin/context/AuthContext.jsx';
import ProtectedRoute   from './admin/components/ProtectedRoute.jsx';
import AdminLayout      from './admin/components/AdminLayout.jsx';
import LoginPage        from './admin/pages/LoginPage.jsx';
import DashboardPage    from './admin/pages/DashboardPage.jsx';
import EnquiriesPage    from './admin/pages/EnquiriesPage.jsx';
import EnquiryDetailPage from './admin/pages/EnquiryDetailPage.jsx';
import AdminManagementPage from './admin/pages/AdminManagementPage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/*
         * PUBLIC WEBSITE
         * path="/*" catches everything so App handles its own
         * scroll-based single-page navigation exactly as before.
         * App.jsx, App.css, and all hooks are completely unchanged.
         */}
        <Route path="/*" element={<App />} />

        {/*
         * ADMIN — LOGIN (PUBLIC, never wrapped by ProtectedRoute)
         */}
        <Route
          path="/admin/login"
          element={
            <AuthProvider>
              <LoginPage />
            </AuthProvider>
          }
        />

        {/*
         * ADMIN — PROTECTED ROUTES
         * ProtectedRoute gates access; redirects to /admin/login if unauthenticated.
         */}
        <Route
          path="/admin"
          element={
            <AuthProvider>
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            </AuthProvider>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="enquiries" element={<EnquiriesPage />} />
          <Route path="enquiries/:id" element={<EnquiryDetailPage />} />
          <Route path="admins" element={<AdminManagementPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
