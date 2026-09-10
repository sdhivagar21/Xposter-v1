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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#0d0d0d] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <span className="font-display text-xl">MENU</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-9 w-9 place-items-center border border-white/20 text-lg transition-colors hover:bg-white hover:text-black"
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
                  className="block border-b border-white/5 py-3 text-lg transition-colors hover:text-white/60"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-white/10 px-5 py-5">
          <Link
            to="/collections"
            onClick={onClose}
            className="block w-full border border-white py-3 text-center text-sm font-medium transition-colors hover:bg-white hover:text-black"
          >
            View all collections
          </Link>
        </div>
      </aside>
    </>
  );
}
