import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { usePermissions } from './hooks/usePermissions';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Companies from './pages/Companies';
import Devices from './pages/Devices';
import { COMPANY_PERMISSION_NAV, COMPANY_PERMISSION_NAV_ORDER } from './config/companyPermissionNav';
import './i18n/config';

/**
 * A company actor's `role` string can be `'member'` even when their
 * permission codes grant real access, so a hardcoded `/dashboard` default
 * would land some sessions on a page they can't see. Walks
 * `COMPANY_PERMISSION_NAV_ORDER` so a new entry needs no change here.
 */
const DefaultRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { has } = usePermissions();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'admin' || user.role === 'superAdmin') {
    return <Navigate to="/dashboard" replace />;
  }
  for (const id of COMPANY_PERMISSION_NAV_ORDER) {
    const entry = COMPANY_PERMISSION_NAV[id];
    if (has(entry.code, { allowReadOnly: entry.allowReadOnly })) {
      return <Navigate to={entry.path} replace />;
    }
  }
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
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path={COMPANY_PERMISSION_NAV.users.path}
              element={
                <ProtectedRoute requiredPermission={COMPANY_PERMISSION_NAV.users.code}>
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path={COMPANY_PERMISSION_NAV.roles.path}
              element={
                <ProtectedRoute requiredPermission={COMPANY_PERMISSION_NAV.roles.code}>
                  <Layout>
                    <Roles />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/devices"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Layout>
                    <Devices />
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

            <Route path="/" element={<DefaultRedirect />} />

            <Route path="*" element={<DefaultRedirect />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
