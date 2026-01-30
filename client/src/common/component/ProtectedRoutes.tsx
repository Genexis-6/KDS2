// src/components/auth/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useIsAuthenticatedStore } from "../../utils/hooks/use_is_authenticated_store";
import { AppUrl } from "../routes/app_urls";

export default function ProtectedRoute() {
  const { isAuthenticated, isChecking } = useIsAuthenticatedStore();

  // You can show a spinner while checking authentication
  if (isChecking) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={AppUrl.login} replace />;
  }

  // If authenticated, render the child route
  return <Outlet />;
}
