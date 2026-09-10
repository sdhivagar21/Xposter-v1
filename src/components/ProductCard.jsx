import { Link } from "react-router-dom";
import PosterImage from "./PosterImage.jsx";

export default function ProductCard({ product, className = "" }) {
  return (
    <Link
      to={`/product/${product.id}`}
      className={`group block w-40 shrink-0 sm:w-48 ${className}`}
    >
      <PosterImage category={product.category} filename={product.image} alt={product.name} />
      <div className="mt-3 space-y-0.5">
        <p className="truncate text-sm font-medium text-white">{product.name}</p>
        <p className="text-sm text-white/50">₹{product.price}</p>
      </div>
    </Link>
  );
}
