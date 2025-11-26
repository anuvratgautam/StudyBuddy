import React from "react";
import { Navigate } from "react-router-dom";
import { getStoredUserId } from "../api/authClient";

export default function ProtectedRoute({ children }){
  const id = getStoredUserId();
  if (!id) return <Navigate to="/login" replace />;
  return children;
}
