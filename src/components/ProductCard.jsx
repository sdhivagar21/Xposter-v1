import { Link } from "react-router-dom";
import PosterImage from "./PosterImage.jsx";
import { SIZES } from "../data/categories.js";

export default function ProductCard({ product, className = "" }) {
  return (
    <Link
      to={`/product/${product.id}`}
      className={`group block w-40 shrink-0 sm:w-48 ${className}`}
    >
      <PosterImage src={product.image} alt={product.name} width={380} widths={[240, 320, 380]} sizes="(min-width: 640px) 192px, 160px" />
      <div className="mt-3 space-y-0.5">
        <p className="truncate text-sm font-medium text-[var(--xp-white)]">{product.name}</p>
        <p className="text-sm text-[var(--xp-accent)]/80">From ₹{SIZES[0].price}</p>
        <p className="inline-block bg-[var(--xp-accent)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0c0b09]">
          Buy 2 Get 1 Free
        </p>
      </div>
    </Link>
  );
}
