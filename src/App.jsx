import { Routes, Route } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import Home from "./pages/Home.jsx";
import Collections from "./pages/Collections.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import SearchResults from "./pages/SearchResults.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import NotFound from "./pages/NotFound.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute.jsx";

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
    </>
  );
}
