import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

export default function ProtectedAdminRoute({ children }) {
  const { isLoggedIn, checking } = useAdminAuth();

  if (checking) {
    return <div className="mx-auto max-w-6xl px-5 py-20 text-center text-sm text-white/40">Checking login…</div>;
  }
  if (!isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
