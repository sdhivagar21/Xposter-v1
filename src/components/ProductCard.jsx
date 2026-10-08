import { Link } from "react-router-dom";
import PosterImage from "./PosterImage.jsx";
import { SIZES, PACK_DEALS, BULK_DISCOUNT, packSaving, getSizeBySlug } from "../data/categories.js";

export default function ProductCard({ product, className = "" }) {
  return (
    <Link
      to={`/product/${product.id}`}
      className={`group block w-40 shrink-0 sm:w-48 ${className}`}
    >
      <PosterImage src={product.image} alt={product.name} width={380} />
      <div className="mt-3 space-y-0.5">
        <p className="truncate text-sm font-medium text-[var(--xp-white)]">{product.name}</p>
        <p className="text-sm text-[var(--xp-accent)]/80">From ₹{SIZES[0].price}</p>
        <p className="inline-block bg-[var(--xp-accent)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0c0b09]">
          Buy 5 · from ₹{PACK_DEALS[PACK_DEALS.length - 1].price / PACK_DEALS[PACK_DEALS.length - 1].qty} each
        </p>
      </div>
    </Link>
  );
}

// Eye-catching per-size offers (pack deals + the A3 bundle), shown on the
// product page. The card for the currently selected size is highlighted.
export function PackDealCards({ selectedSlug }) {
  const offers = [
    ...PACK_DEALS.map((d) => {
      const size = getSizeBySlug(d.size);
      return {
        slug: d.size,
        label: size.label,
        headline: `Buy ${d.qty} for ₹${d.price}`,
        sub: `Just ₹${d.price / d.qty} each`,
        save: `SAVE ₹${packSaving(d)}`,
      };
    }),
    {
      slug: "a3",
      label: "A3",
      headline: `Buy ${BULK_DISCOUNT.minQty}, save 23%`,
      sub: `3 for ₹${Math.round(3 * (getSizeBySlug("a3")?.price || 0) * 0.7692)}`,
      save: "SAVE 23%",
    },
  ];
  return (
    <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {offers.map((o) => {
        const active = o.slug === selectedSlug;
        return (
          <div
            key={o.slug}
            className={`relative overflow-hidden border px-3 py-3 transition-all ${
              active
                ? "border-[var(--xp-accent-bright)] bg-gradient-to-br from-[var(--xp-accent)]/30 to-[var(--xp-accent)]/5 shadow-[0_0_22px_rgba(201,162,76,0.28)]"
                : "border-[var(--xp-accent-dim)] bg-[var(--xp-accent)]/10"
            }`}
          >
            <span className="absolute right-0 top-0 bg-[var(--xp-accent)] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#0c0b09]">
              {o.save}
            </span>
            <p className="font-display text-2xl leading-none text-[var(--xp-accent-bright)]">{o.label}</p>
            <p className="mt-1.5 text-sm font-semibold text-[var(--xp-white)]">{o.headline}</p>
            <p className="text-xs text-white/60">{o.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
