import { useEffect, useState } from "react";
import { fetchAdminStats, resetAdminStats } from "../../api/admin.js";

const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const resetTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

function StatTile({ label, value }) {
  return (
    <div className="border border-[var(--xp-border)] bg-[var(--xp-bg-elevated)] p-5">
      <p className="text-xs uppercase tracking-widest text-white/40">{label}</p>
      <p className="mt-2 font-display text-3xl text-[var(--xp-accent-bright)]">{value}</p>
    </div>
  );
}

// Total collected so far plus progress to the next sales milestone, at the
// top of the admin pages. The backend does the maths (cancelled orders left
// out, "this month" in Indian time) and emails the owner once per milestone.
// "Reset to zero" starts the count again from now without touching orders.
export default function SalesOverview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState(null);

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch(() => setError(true));
  }, []);

  async function handleReset() {
    const ok = window.confirm(
      "Reset the sales total to zero from now?\n\nNo orders are deleted, but only orders placed after this will count towards the total, this month, the order count and milestones."
    );
    if (!ok) return;
    setResetting(true);
    setResetError(null);
    try {
      setStats(await resetAdminStats());
    } catch {
      setResetError("Couldn't reset the total - try again.");
    } finally {
      setResetting(false);
    }
  }

  if (error) {
    return <p role="alert" className="alert-error mt-6">Couldn't load sales totals.</p>;
  }

  const placeholder = "…";
  const reached = stats ? stats.milestones.reached : [];
  const lastReached = reached.length ? reached[reached.length - 1].amount : 0;
  const next = stats ? stats.milestones.next : 0;
  const progress = stats ? Math.min(1, (stats.total - lastReached) / (next - lastReached)) : 0;

  return (
    <section aria-label="Sales so far" className="mt-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total collected" value={stats ? rupees.format(stats.total) : placeholder} />
        <StatTile label="This month" value={stats ? rupees.format(stats.month) : placeholder} />
        <StatTile label="Orders" value={stats ? stats.orders.toLocaleString("en-IN") : placeholder} />
      </div>

      {stats && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/50">
          <p>{stats.since ? `Counting since ${resetTime.format(new Date(stats.since))}` : "Counting all orders"}</p>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="btn-outline px-3 py-1.5 text-xs disabled:opacity-50"
          >
            {resetting ? "Resetting…" : "Reset to zero"}
          </button>
        </div>
      )}
      {resetError && (
        <p role="alert" className="alert-error mt-3">
          {resetError}
        </p>
      )}

      {stats && (
        <div className="mt-4 border border-[var(--xp-border)] p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <p className="text-white/70">
              Next milestone:{" "}
              <strong className="text-[var(--xp-accent-bright)]">{rupees.format(next)}</strong>
            </p>
            <p className="text-white/60">{rupees.format(next - stats.total)} to go</p>
          </div>
          <div
            role="progressbar"
            aria-label="Progress to next milestone"
            aria-valuemin={lastReached}
            aria-valuemax={next}
            aria-valuenow={stats.total}
            className="mt-3 h-2 bg-[var(--xp-accent-dim)]"
          >
            <div className="h-full bg-[var(--xp-accent)]" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>

          {reached.length > 0 && (
            <ul aria-label="Milestones reached" className="mt-4 flex flex-wrap gap-2">
              {reached.map((m) => (
                <li
                  key={m.amount}
                  title={m.reachedAt ? `Reached ${new Date(m.reachedAt).toLocaleDateString("en-IN")}` : undefined}
                  className="border border-[var(--xp-accent)] px-2.5 py-1 text-xs text-[var(--xp-accent-bright)]"
                >
                  ✓ {rupees.format(m.amount)}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-xs text-white/40">
            A celebration email goes out once for each milestone crossed. Cancelled orders are not counted.
          </p>
        </div>
      )}
    </section>
  );
}
