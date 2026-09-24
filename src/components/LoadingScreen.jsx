// Branded loading state - shown instead of blank space or plain text
// wherever the site is waiting on something: a lazy-loaded route, a page's
// first data fetch, etc. `fullScreen` covers the whole viewport (used for
// the route-level Suspense fallback, where nothing else has rendered yet);
// without it, it just centers in the space it's given.
export default function LoadingScreen({ fullScreen = false, className = "" }) {
  return (
    <div
      className={`flex items-center justify-center ${
        fullScreen ? "min-h-screen bg-[var(--xp-bg)]" : "py-24"
      } ${className}`}
      role="status"
      aria-label="Loading"
    >
      <img
        src="/logo-mark.png"
        alt="XPOSTERS"
        className="animate-logo-pulse h-9 w-auto sm:h-11"
      />
    </div>
  );
}
