import { Link } from "react-router-dom";
import PosterImage from "./PosterImage.jsx";

export default function ProductCard({ product, className = "" }) {
  return (
    <Link
      to={`/product/${product.id}`}
      className={`group block w-40 shrink-0 sm:w-48 ${className}`}
    >
      <PosterImage src={product.image} alt={product.name} width={380} />
      <div className="mt-3 space-y-0.5">
        <p className="truncate text-sm font-medium text-[var(--xp-white)]">{product.name}</p>
        <p className="text-sm text-[var(--xp-accent)]/80">₹{product.price}</p>
      </div>
    </Link>
  );
}