import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/anton/latin-400.css";
import "./index.css";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";

const app = (

  <StrictMode>
    <BrowserRouter>
      <AdminAuthProvider>
        <CartProvider>
          <WishlistProvider>
            <App />
          </WishlistProvider>
        </CartProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  </StrictMode>

);

// The homepage HTML is prerendered at build time (see entry-server.jsx), so on
// "/" the existing markup is hydrated; any other route starts clean.
const container = document.getElementById("root");
if (container.hasChildNodes() && window.location.pathname === "/") {
  hydrateRoot(container, app);
} else {
  container.textContent = "";
  document.documentElement.classList.remove("no-shell");
  createRoot(container).render(app);
}
