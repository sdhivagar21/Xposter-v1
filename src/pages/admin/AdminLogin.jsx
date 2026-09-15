import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

export default function AdminLogin() {
  const { isLoggedIn, checking, login } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!checking && isLoggedIn) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate("/admin");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <h1 className="font-display text-3xl">XPOSTERS ADMIN</h1>
      <p className="mt-2 text-sm text-white/40">Sign in to manage products and view orders.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1 block text-xs text-white/40" htmlFor="admin-email">
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/40" htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
          />
        </div>
        {error && <p className="text-xs text-white/70">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-3 text-sm font-medium"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
