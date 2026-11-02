import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext.jsx";

// Buy 2 Get 1 progress for the cart: three poster slots that fill up as
// posters go in, the third one stamped FREE. Also says which deal is
// applied right now (the cart always gets whichever saves more) and gives a
// quick pop whenever the saving goes up.
export default function DealMeter({ className = "" }) {
  const { itemCount, dealType, saving, b2g1FreeCount, b2g1ToNext, packDeals, discountEligible, discountPercent } = useCart();
  const [popKey, setPopKey] = useState(0);
  const prevSaving = useRef(saving);

  useEffect(() => {
    if (saving > prevSaving.current) setPopKey((k) => k + 1);
    prevSaving.current = saving;
  }, [saving]);

  const inGroup = itemCount === 0 ? 0 : itemCount % 3 === 0 ? 3 : itemCount % 3;
  const toNext = b2g1ToNext;

  let headline;
  let sub;
  if (dealType === "b2g1") {
    headline = `🎉 ${b2g1FreeCount} poster${b2g1FreeCount === 1 ? "" : "s"} FREE — you save ₹${saving}`;
    sub = `Add ${toNext} more poster${toNext === 1 ? "" : "s"} for another free one`;
  } else if (dealType === "combo") {
    const applied = packDeals.filter((d) => d.packs > 0).map((d) => `${d.qty} ${d.label} for ₹${d.price}`);
    if (discountEligible) applied.push(`${discountPercent}% off 3+ A3`);
    headline = `🎉 ${applied.join(" + ")} — you save ₹${saving}`;
    sub = "The best deal for your cart, applied automatically";
  } else {
    headline = `Add ${toNext} more poster${toNext === 1 ? "" : "s"} — get the cheapest FREE`;
    sub = "Buy 2 Get 1 on every poster, any size";
  }
  const packHint = packDeals
    .filter((d) => d.packs === 0 && d.toNext > 0 && d.toNext <= 2)
    .sort((a, b) => a.toNext - b.toNext)[0];

  return (
    <div
      key={popKey}
      className={`${popKey ? "deal-card-pop" : ""} border border-[var(--xp-accent-dim)] bg-gradient-to-br from-[var(--xp-accent)]/20 via-[var(--xp-accent)]/5 to-transparent px-4 py-3 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex shrink-0 items-end gap-1" aria-hidden="true">
          {[1, 2, 3].map((slot) => {
            const filled = slot <= inGroup;
            const isFree = slot === 3;
            return (
              <span
                key={slot}
                className={`grid h-9 w-6 place-items-center border text-[8px] font-bold leading-none transition-all duration-300 ${
                  filled
                    ? isFree
                      ? "deal-shine relative border-[var(--xp-accent-bright)] bg-[var(--xp-accent-bright)] text-[#0c0b09]"
                      : "border-[var(--xp-accent)] bg-[var(--xp-accent)]/80 text-[#0c0b09]"
                    : isFree
                      ? "border-dashed border-[var(--xp-accent)] text-[var(--xp-accent-bright)]"
                      : "border-dashed border-[var(--xp-border-strong)] text-white/30"
                }`}
              >
                {isFree ? "FREE" : filled ? "✓" : ""}
              </span>
            );
          })}
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-semibold ${dealType ? "text-[var(--xp-accent-bright)]" : "text-[var(--xp-white)]"}`}>
            {headline}
          </p>
          <p className="mt-0.5 text-[11px] text-white/60">{sub}</p>
          {packHint && (
            <p className="mt-0.5 text-[11px] text-white/60">
              Or add {packHint.toNext} more {packHint.label} → {packHint.qty} {packHint.label} for ₹{packHint.price}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
