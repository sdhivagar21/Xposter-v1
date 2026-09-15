import { Link, NavLink } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

export default function AdminLayout({ children }) {
  const { admin, logout } = useAdminAuth();

  const linkClass = ({ isActive }) =>
    `border-b-2 pb-1 text-sm transition-colors ${
      isActive ? "border-[var(--xp-accent)] text-[var(--xp-accent-bright)]" : "border-transparent text-white/50 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-[var(--xp-bg)] text-[var(--xp-white)]">
      <header className="border-b border-[var(--xp-border)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-8">
            <Link to="/admin" className="font-display text-xl tracking-wide">
              XPOSTERS ADMIN
            </Link>
            <nav className="flex gap-6">
              <NavLink to="/admin" end className={linkClass}>
                Products
              </NavLink>
              <NavLink to="/admin/orders" className={linkClass}>
                Orders
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/50">
            <span>{admin?.email}</span>
            <button
              onClick={logout}
              className="border border-[var(--xp-border-strong)] px-3 py-1.5 text-xs transition-colors hover:border-[var(--xp-accent)] hover:text-[var(--xp-accent-bright)]"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
    </div>
  );
}
