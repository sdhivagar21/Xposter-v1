import { Link } from "react-router-dom";
import { CATEGORIES } from "../data/categories.js";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--xp-border)]">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="font-display text-2xl">XPOSTERS</p>
            <p className="mt-3 max-w-xs text-sm text-white/50">
              Bold prints for people who like their walls to say something.
              Movies, machines, heroes, and a little chaos — printed and shipped.
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm text-white/40">Categories</p>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link to={`/collections/${cat.slug}`} className="text-white/70 transition-colors hover:text-[var(--xp-accent-bright)]">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm text-white/40">Shop</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/collections" className="text-white/70 transition-colors hover:text-[var(--xp-accent-bright)]">
                  All collections
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="text-white/70 transition-colors hover:text-[var(--xp-accent-bright)]">
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex items-center justify-between border-t border-[var(--xp-border)] pt-6 text-xs text-white/30">
          <span>© {new Date().getFullYear()} XPOSTERS. All rights reserved.</span>
          <Link to="/admin/login" className="transition-colors hover:text-white/60">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
