import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

export default function AdminLogin() {
  const { isLoggedIn, checking, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Back to the admin page they were trying to open, if any.
  const from = typeof location.state?.from === "string" && location.state.from.startsWith("/admin") ? location.state.from : "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!checking && isLoggedIn) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      // Only a 401 means the details were wrong - don't blame the password
      // when the backend is asleep, down, or erroring.
      const status = err.response?.status;
      if (status === 401) {
        setError("Wrong email or password.");
      } else if (!err.response) {
        setError("Can't reach the server right now. Wait a minute and try again.");
      } else {
        setError(`The server couldn't sign you in (error ${status}). Try again in a minute.`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <h1 className="font-display text-3xl">XPOSTERS ADMIN</h1>
      <p className="mt-2 text-sm text-white/60">Sign in to manage products and view orders.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1 block text-xs text-white/60" htmlFor="admin-email">
            Email
          </label>
          {/* type="text", not "email": the browser's email check would block
              signing in if ADMIN_EMAIL on the backend isn't a perfectly
              formed address. The backend decides what's valid. */}
          <input
            id="admin-email"
            type="text"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(error)}
            className="w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/60" htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(error)}
            className="w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
          />
        </div>
        {error && <p role="alert" className="alert-error">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-3 text-sm font-medium"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        {submitting && (
          <p className="text-xs text-white/50">
            If the site has been quiet for a while, the server can take up to a minute to wake up.
          </p>
        )}
      </form>
    </div>
  );
}
