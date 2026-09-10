import { Link } from "react-router-dom";
import { CATEGORIES } from "../data/categories.js";

export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="font-display text-2xl">XPOSTERS</p>
            <p className="mt-3 max-w-xs text-sm text-white/50">
              Bold, black-and-white prints for people who like their walls to say something.
              Movies, machines, heroes, and a little chaos — printed and shipped.
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm text-white/40">Categories</p>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link to={`/collections/${cat.slug}`} className="text-white/70 transition-colors hover:text-white">
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
                <Link to="/collections" className="text-white/70 transition-colors hover:text-white">
                  All collections
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="text-white/70 transition-colors hover:text-white">
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-white/30">
          © {new Date().getFullYear()} XPOSTERS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
