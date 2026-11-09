import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, user, business, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // If no active session/user, redirect to /login and preserve destination
  if (!session && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user has no business and isn't already on /onboarding, redirect to onboarding
  if (!business && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
