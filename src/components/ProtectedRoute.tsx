import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions, HasPermissionOptions } from '../hooks/usePermissions';
import { clearToken } from '../utils/session';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Role-based gate — for pages restricted by the legacy `role` string. */
  requiredRoles?: string[];
  /**
   * Permission-code gate, checked with `allowReadOnly` so a `.readonly`
   * holder can view — write actions inside the page gate themselves on the
   * full code.
   */
  requiredPermission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  requiredPermission,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { has } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const readOnlyOpts: HasPermissionOptions = { allowReadOnly: true };
  const roleAllows = !requiredRoles || (!!user && requiredRoles.includes(user.role));
  const permissionAllows = !requiredPermission || has(requiredPermission, readOnlyOpts);

  // Both gates are AND'd: a route with only `requiredRoles` behaves exactly as
  // before, a route with only `requiredPermission` is permission-driven, and a
  // route with both (none today) would need both to pass.
  if (!roleAllows || !permissionAllows) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-secondary-900 mb-2">
            Access Denied
          </h1>
          <p className="text-secondary-600 mb-4">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => {
              clearToken();
              window.location.href = '/login';
            }}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
