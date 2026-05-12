import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const RoleRoute = ({ children, roles, redirectTo = "/" }) => {
  const { isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const requiredRoles = Array.isArray(roles) ? roles : [roles];

  const authorized =
    typeof hasRole === "function" &&
    requiredRoles.some((role) => hasRole(role));

  if (!authorized) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};