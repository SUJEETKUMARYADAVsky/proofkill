import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const userRole = currentUser && currentUser.role;

    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/projects" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
