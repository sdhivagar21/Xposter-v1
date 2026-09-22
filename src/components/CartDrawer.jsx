import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import PosterImage from "./PosterImage.jsx";

export default function CartDrawer() {
  const { items, updateQty, removeFromCart, subtotal, isDrawerOpen, setDrawerOpen } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/70 transition-opacity duration-300 ${
          isDrawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-[var(--xp-border)] bg-[var(--xp-bg-elevated)] transition-transform duration-300 ease-out ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isDrawerOpen}
      >
        <div className="flex items-center justify-between border-b border-[var(--xp-border)] px-5 py-5">
          <span className="font-display text-xl">YOUR CART</span>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close cart"
            className="grid h-9 w-9 place-items-center border border-[var(--xp-border-strong)] text-lg transition-colors hover:border-[var(--xp-accent)] hover:text-[var(--xp-accent-bright)]"
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-white/50">Your cart is empty.</p>
            <Link
              to="/collections"
              onClick={() => setDrawerOpen(false)}
              className="btn-outline px-5 py-2.5 text-sm"
            >
              Browse posters
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4">
                  <PosterImage
                    src={item.image}
                    alt={item.name}
                    aspect="aspect-[2/3]"
                    className="w-16"
                    width={150}
                  />
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-[var(--xp-border-strong)]">
                        <button
                          onClick={() => updateQty(item.key, item.qty - 1)}
                          className="h-7 w-7 text-sm transition-colors hover:text-[var(--xp-accent-bright)]"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.key, item.qty + 1)}
                          className="h-7 w-7 text-sm transition-colors hover:text-[var(--xp-accent-bright)]"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm">₹{item.qty * item.price}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.key)}
                    className="self-start text-xs text-white/40 underline-offset-2 transition-colors hover:text-white hover:underline"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-[var(--xp-border)] px-5 py-5">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-white/60">Subtotal</span>
                <span className="text-lg font-medium">₹{subtotal}</span>
              </div>
              <Link
                to="/checkout"
                onClick={() => setDrawerOpen(false)}
                className="btn-primary block w-full py-3 text-center text-sm font-medium"
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}