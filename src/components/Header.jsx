import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import HamburgerDrawer from "./HamburgerDrawer.jsx";
import SearchOverlay from "./SearchOverlay.jsx";

const TICKER = [
  { text: "Buy 2 Get 1 FREE", hot: true },
  { text: "The cheapest of every 3 posters is on us" },
  { text: "⚡ 59-min delivery anywhere in Chennai", hot: true },
  { text: "Free delivery all over Tamil Nadu" },
  { text: "5 A4 for ₹375 · 5 A5 for ₹225" },
  { text: "Best deal applied automatically" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { itemCount, setDrawerOpen } = useCart();
  const { count: wishlistCount } = useWishlist();

  return (
    <>
      {/* Sitewide deals ad - the main "come buy more posters" nudge, seen on
          every page before anyone's even opened the cart. A slow gold ticker
          led by Buy 2 Get 1. Scrolls away with the page rather than staying
          sticky, so it doesn't eat into the header's own sticky space. */}
      <Link
        to="/collections"
        aria-label="Buy 2 Get 1 free on every poster - shop now"
        className="promo-ticker-wrap relative block overflow-hidden bg-[var(--xp-accent)] text-[#0c0b09]"
      >
        <div className="promo-ticker" aria-hidden="true">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {TICKER.map((msg) => (
                <span key={msg.text} className="flex items-center gap-2 whitespace-nowrap px-5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] sm:text-xs">
                  {msg.hot ? (
                    <span className="bg-[#0c0b09] px-2 py-0.5 text-[var(--xp-accent-bright)]">{msg.text}</span>
                  ) : (
                    msg.text
                  )}
                  <span className="pl-5 opacity-50">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </Link>

      <header className="sticky top-0 z-30 border-b border-[var(--xp-border)] bg-[var(--xp-bg)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 flex-col items-center justify-center gap-[5px]"
            >
              <span className="h-px w-5 bg-[var(--xp-white)]" />
              <span className="h-px w-5 bg-[var(--xp-white)]" />
              <span className="h-px w-5 bg-[var(--xp-white)]" />
            </button>
            <Link to="/" aria-label="XPOSTERS" className="flex items-center">
              <img src="/logo-mark.webp" alt="XPOSTERS" width="90" height="32" className="h-7 w-auto sm:h-8" />
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
                <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center bg-[var(--xp-accent)] px-1 text-[10px] font-medium text-[#0c0b09]">
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
                <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center bg-[var(--xp-accent)] px-1 text-[10px] font-medium text-[#0c0b09]">
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
