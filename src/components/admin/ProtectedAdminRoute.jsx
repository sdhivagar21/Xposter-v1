import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

export default function ProtectedAdminRoute({ children }) {
  const { isLoggedIn, checking } = useAdminAuth();
  const location = useLocation();

  if (checking) {
    return <div className="mx-auto max-w-6xl px-5 py-20 text-center text-sm text-white/60">Checking login…</div>;
  }
  if (!isLoggedIn) {
    // Remember where they were going (e.g. a "Make it sharper" link from an
    // order email), so logging in lands them right there.
    return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return children;
}
