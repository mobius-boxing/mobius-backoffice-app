import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Companies from './pages/Companies';
import StoreBoxes from './pages/StoreBoxes';
import StoreRolls from './pages/StoreRolls';
import StoreUsers from './pages/StoreUsers';
import './i18n/config';

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />

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
              path="/users"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Layout>
                    <Users />
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
              path="/store/boxes"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Layout>
                    <StoreBoxes />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/store/rolls"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Layout>
                    <StoreRolls />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/store/users"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Layout>
                    <StoreUsers />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
        </Router>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
