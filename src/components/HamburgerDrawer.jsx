import { Link } from "react-router-dom";
import { CATEGORIES } from "../data/categories.js";

export default function HamburgerDrawer({ open, onClose }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/70 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--xp-border)] bg-[var(--xp-bg-elevated)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-[var(--xp-border)] px-5 py-5">
          <span className="font-display text-xl">MENU</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-9 w-9 place-items-center border border-[var(--xp-border-strong)] text-lg transition-colors hover:border-[var(--xp-accent)] hover:text-[var(--xp-accent-bright)]"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-3 text-xs text-white/40">Categories</p>
          <ul className="space-y-1">
            {CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link
                  to={`/collections/${cat.slug}`}
                  onClick={onClose}
                  className="block border-b border-[var(--xp-border)] py-3 text-lg transition-colors hover:text-[var(--xp-accent-bright)]"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-[var(--xp-border)] px-5 py-5">
          <Link
            to="/collections"
            onClick={onClose}
            className="btn-outline block w-full py-3 text-center text-sm font-medium"
          >
            View all collections
          </Link>
        </div>
      </aside>
    </>
  );
}
