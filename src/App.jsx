import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import Home from "./pages/Home.jsx";
import { useCart } from "./context/CartContext.jsx";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute.jsx";

// Everything except the homepage loads on demand instead of shipping in the
// first script the browser downloads. Most visits land on "/" and never
// touch checkout, wishlist, or (almost never) the admin pages - there's no
// reason to make every visitor download and parse that code up front. Vite
// splits each of these into its own small chunk, fetched only when the
// matching route is actually visited.
// The cart drawer isn't needed for the first paint, so it's split out and mounted
// a moment after load (or immediately if opened sooner).
const CartDrawer = lazy(() => import("./components/CartDrawer.jsx"));
const Collections = lazy(() => import("./pages/Collections.jsx"));
const CategoryPage = lazy(() => import("./pages/CategoryPage.jsx"));
const SearchResults = lazy(() => import("./pages/SearchResults.jsx"));
const ProductDetail = lazy(() => import("./pages/ProductDetail.jsx"));
const Wishlist = lazy(() => import("./pages/Wishlist.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin.jsx"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.jsx"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders.jsx"));

// Session-wide "instant delivery" promo popup - a one-time attention-grab
// nudging shoppers toward buying right now with a very specific, concrete
// hook (55 minutes, Chennai only). Shown once per browser tab (sessionStorage
// flag) with a short delay so it doesn't fight the page's own first paint.
function DeliveryPopup({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Instant delivery in Chennai"
    >
      <div
        className="animate-modal-pop relative w-full max-w-md overflow-hidden border border-[var(--xp-accent)] bg-[var(--xp-bg-elevated)] p-7 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="animate-glow-pulse pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--xp-accent)]/20 blur-[90px]"
          aria-hidden="true"
        />

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center border border-[var(--xp-border-strong)] text-sm transition-colors hover:border-[var(--xp-accent)] hover:text-[var(--xp-accent-bright)]"
        >
          ✕
        </button>

        <div className="relative flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--xp-accent-bright)]">
            Live in Chennai
          </span>
        </div>

        <div className="relative mt-5 flex items-end gap-3">
          <span className="font-display text-6xl leading-none text-[var(--xp-accent-bright)] sm:text-7xl">
            55
          </span>
          <span className="pb-1.5 font-display text-xl leading-none text-white/80 sm:text-2xl">MIN</span>
        </div>

        <h2 className="relative mt-3 font-display text-2xl leading-tight sm:text-[28px]">
          ⚡ Instant Delivery, Right to Your Door
        </h2>
        <p className="relative mt-3 text-sm text-white/60">
          Order any poster now and get it delivered across Chennai in just 55 minutes — fresh off the
          press, no waiting around.
        </p>

        <Link
          to="/collections"
          onClick={onClose}
          className="btn-primary relative mt-6 block w-full py-3.5 text-center text-sm font-medium"
        >
          Order Now — Get It in 55 Min
        </Link>
        <button
          onClick={onClose}
          className="relative mx-auto mt-3 block text-xs text-white/40 underline-offset-2 transition-colors hover:text-white hover:underline"
        >
          Maybe later
        </button>
        <p className="relative mt-4 text-center text-[11px] text-white/30">
          Available for Chennai addresses. Standard delivery elsewhere.
        </p>
      </div>
    </div>
  );
}

function CustomerShell({ children }) {
  const [showDeliveryPopup, setShowDeliveryPopup] = useState(false);
  const { isDrawerOpen } = useCart();
  const [drawerReady, setDrawerReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDrawerReady(true), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem("xp_delivery_popup_seen") === "1";
    } catch {
      alreadySeen = false;
    }
    if (alreadySeen) return;

    const timer = setTimeout(() => {
      setShowDeliveryPopup(true);
      try {
        sessionStorage.setItem("xp_delivery_popup_seen", "1");
      } catch {
        // Storage unavailable (private mode, etc.) - the popup still shows
        // for this page view, it just won't remember it did.
      }
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--xp-bg)] text-[var(--xp-white)]">
      <div className="film-grain" aria-hidden="true" />
      <Header />
      {(drawerReady || isDrawerOpen) && (
        <Suspense fallback={null}>
          <CartDrawer />
        </Suspense>
      )}
      <main>{children}</main>
      <Footer />
      {showDeliveryPopup && <DeliveryPopup onClose={() => setShowDeliveryPopup(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LoadingScreen fullScreen />}>
        <Routes>
          {/* Admin section has its own layout - no customer header/footer/cart */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedAdminRoute>
                <AdminOrders />
              </ProtectedAdminRoute>
            }
          />

          {/* Customer-facing site */}
          <Route path="/" element={<CustomerShell><Home /></CustomerShell>} />
          <Route path="/collections" element={<CustomerShell><Collections /></CustomerShell>} />
          <Route path="/collections/:slug" element={<CustomerShell><CategoryPage /></CustomerShell>} />
          <Route path="/search" element={<CustomerShell><SearchResults /></CustomerShell>} />
          <Route path="/product/:id" element={<CustomerShell><ProductDetail /></CustomerShell>} />
          <Route path="/wishlist" element={<CustomerShell><Wishlist /></CustomerShell>} />
          <Route path="/checkout" element={<CustomerShell><Checkout /></CustomerShell>} />
          <Route path="/order-success" element={<CustomerShell><OrderSuccess /></CustomerShell>} />
          <Route path="*" element={<CustomerShell><NotFound /></CustomerShell>} />
        </Routes>
      </Suspense>
    </>
  );
}
