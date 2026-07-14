import { Navigate } from "react-router-dom";
import { getToken, getRole } from "../utils/authStorage";

const roleHomePath = {
  admin: "/admin",
  mentor: "/mentor",
  peserta: "/peserta",
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = getToken();
  const role = getRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={roleHomePath[role] || "/login"} replace />;
  }

  return children;
};

export default ProtectedRoute;