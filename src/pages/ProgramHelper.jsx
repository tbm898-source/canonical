import React from "react";
import { Navigate, useLocation } from "react-router-dom";

// Old bookmarks remain useful, but mode flags no longer change teaching access.
export default function ProgramHelper() {
  const { hash } = useLocation();
  return <Navigate to={hash === "#integrations" ? "/connections" : ["#agent-demo", "#helper"].includes(hash) ? "/plan" : "/curriculum"} replace />;
}
