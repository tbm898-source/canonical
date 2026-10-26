import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function Cohort6Curriculum() {
  const { pathname } = useLocation();
  const target = pathname.includes("/RCS/") ? "/courses/RCS" : pathname.includes("/PV101/") ? "/courses/PV101" : "/curriculum";
  return <Navigate to={target} replace />;
}
