// Build-time prerender of the homepage ("/") so the HTML already contains the
// header, hero and first posters before any JavaScript runs - the browser can
// paint (and fetch the first poster images) straight from the HTML. The client
// (main.jsx) hydrates this markup instead of rebuilding it.
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";

export function render() {
  return renderToString(
    <StaticRouter location="/">
      <AdminAuthProvider>
        <CartProvider>
          <WishlistProvider>
            <App />
          </WishlistProvider>
        </CartProvider>
      </AdminAuthProvider>
    </StaticRouter>
  );
}
