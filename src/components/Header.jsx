import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import HamburgerDrawer from "./HamburgerDrawer.jsx";
import SearchOverlay from "./SearchOverlay.jsx";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { itemCount, setDrawerOpen } = useCart();
  const { count: wishlistCount } = useWishlist();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 flex-col items-center justify-center gap-[5px]"
            >
              <span className="h-px w-5 bg-white" />
              <span className="h-px w-5 bg-white" />
              <span className="h-px w-5 bg-white" />
            </button>
            <Link to="/" className="font-display text-2xl tracking-wide">
              XPOSTERS
            </Link>
          </div>

          <nav className="hidden items-center gap-8 text-sm sm:flex">
            <Link to="/collections" className="transition-colors hover:text-white/60">
              Collections
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={() => setSearchOpen(true)} aria-label="Search" className="grid h-9 w-9 place-items-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            <Link to="/wishlist" aria-label="Wishlist" className="relative grid h-9 w-9 place-items-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 20.5s-7.5-4.6-10-9.3C0.3 7.8 2 4 5.8 4c2.2 0 3.7 1.2 4.4 2.4C10.9 5.2 12.4 4 14.6 4 18.4 4 20 7.8 18.3 11.2 15.8 15.9 12 20.5 12 20.5Z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center bg-white px-1 text-[10px] font-medium text-black">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button onClick={() => setDrawerOpen(true)} aria-label="Cart" className="relative grid h-9 w-9 place-items-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 8h12l-1 12H7L6 8Z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center bg-white px-1 text-[10px] font-medium text-black">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <HamburgerDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
