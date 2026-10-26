import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AccessDenied from './pages/AccessDenied';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import SuperAdmins from './pages/SuperAdmins';
import './i18n/config';

const DefaultRedirect: React.FC = () => {
  const { user, isLoading, accessDenied } = useAuth();

  if (isLoading) return null;
  if (accessDenied) return <AccessDenied />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRoles={['superAdmin']}>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/companies"
              element={
                <ProtectedRoute requiredRoles={['superAdmin']}>
                  <Layout>
                    <Companies />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/super-admins"
              element={
                <ProtectedRoute requiredRoles={['superAdmin']}>
                  <Layout>
                    <SuperAdmins />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<DefaultRedirect />} />

            <Route path="*" element={<DefaultRedirect />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
