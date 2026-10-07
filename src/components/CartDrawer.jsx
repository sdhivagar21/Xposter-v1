import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import PosterImage from "./PosterImage.jsx";

export default function CartDrawer() {
  const {
    items,
    updateQty,
    removeFromCart,
    itemCount,
    subtotal,
    discountEligible,
    discountPercent,
    discountAmount,
    packDeals,
    packDealAmount,
    otherQty,
    total,
    itemsToNextDiscount,
    isDrawerOpen,
    setDrawerOpen,
  } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/70 transition-opacity duration-300 ${
          isDrawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 right-0 z-[70] flex w-full max-w-sm flex-col border-l border-[var(--xp-border)] bg-[var(--xp-bg-elevated)] transition-transform duration-300 ease-out ${
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
            {/* Bundle-discount nudge - the whole point of showing this here
                (rather than only at checkout) is to catch shoppers while
                they can still act on it: add one more poster, right now,
                and save 23%. */}
            <div className="mx-5 mt-4 border border-[var(--xp-accent-dim)] bg-[var(--xp-accent)]/10 px-4 py-3">
              {discountEligible ? (
                <p className="text-xs font-medium text-[var(--xp-accent-bright)]">
                  🎉 Bundle discount applied — {discountPercent}% off for buying 3+ posters!
                </p>
              ) : (
                <>
                  <p className="text-xs text-white/70">
                    Add {itemsToNextDiscount} more A3 poster{itemsToNextDiscount === 1 ? "" : "s"} to save 23% on this
                    order.
                  </p>
                  <div className="mt-2 h-1 w-full overflow-hidden bg-[var(--xp-border-strong)]">
                    <div
                      className="h-full bg-[var(--xp-accent)] transition-all duration-300"
                      style={{ width: `${Math.min(100, (otherQty / 3) * 100)}%` }}
                    />
                  </div>
                </>
              )}
            </div>
            {packDeals.length > 0 && (
              <div className="mx-5 mt-3 space-y-2 border border-[var(--xp-accent-dim)] bg-[var(--xp-accent)]/10 px-4 py-3">
                {packDeals.map((deal) => (
                  <div key={deal.size}>
                    {deal.packs > 0 && (
                      <p className="text-xs font-medium text-[var(--xp-accent-bright)]">
                        🎉 {deal.label} deal applied — {deal.qty} {deal.label} posters for just ₹{deal.price}
                        {deal.packs > 1 ? ` (×${deal.packs})` : ""}!
                      </p>
                    )}
                    {deal.toNext > 0 && (
                      <p className={`text-xs text-white/70 ${deal.packs > 0 ? "mt-1" : ""}`}>
                        Add {deal.toNext} more {deal.label} poster{deal.toNext === 1 ? "" : "s"} to get {deal.qty}{" "}
                        {deal.label} posters for just ₹{deal.price}.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

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
                      {item.sizeLabel && <p className="text-xs text-white/40">{item.sizeLabel}</p>}
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
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              {discountEligible && (
                <div className="mt-1.5 flex items-center justify-between text-sm text-[var(--xp-accent-bright)]">
                  <span>Bundle discount ({discountPercent}%)</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              {packDeals
                .filter((deal) => deal.amount > 0)
                .map((deal) => (
                  <div
                    key={deal.size}
                    className="mt-1.5 flex items-center justify-between text-sm text-[var(--xp-accent-bright)]"
                  >
                    <span>
                      {deal.label} deal ({deal.qty} for ₹{deal.price})
                    </span>
                    <span>-₹{deal.amount}</span>
                  </div>
                ))}
              <div className="mb-4 mt-1.5 flex items-center justify-between">
                <span className="text-sm text-white/60">Total</span>
                <span className="text-lg font-medium">₹{total}</span>
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
