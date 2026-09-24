import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import Home from "./pages/Home.jsx";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute.jsx";

// Everything except the homepage loads on demand instead of shipping in the
// first script the browser downloads. Most visits land on "/" and never
// touch checkout, wishlist, or (almost never) the admin pages - there's no
// reason to make every visitor download and parse that code up front. Vite
// splits each of these into its own small chunk, fetched only when the
// matching route is actually visited.
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

function CustomerShell({ children }) {
  return (
    <div className="min-h-screen bg-[var(--xp-bg)] text-[var(--xp-white)]">
      <div className="film-grain" aria-hidden="true" />
      <Header />
      <CartDrawer />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LoadingScreen fullScreen />}>
        <Routes>
          {/* Admin section has its own layout — no customer header/footer/cart */}
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
