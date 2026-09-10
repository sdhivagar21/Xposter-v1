import { Link } from "react-router-dom";
import PosterImage from "./PosterImage.jsx";

// Duplicates the product list so the marquee can loop seamlessly at -50%.
export default function PosterWallRow({ products, direction = "left" }) {
  const doubled = [...products, ...products];
  const animClass = direction === "left" ? "animate-marquee-left" : "animate-marquee-right";

  return (
    <div className="marquee-row overflow-hidden">
      <div className={`flex w-max gap-4 ${animClass}`}>
        {doubled.map((product, i) => (
          <Link
            key={`${product.id}-${i}`}
            to={`/product/${product.id}`}
            className="group block w-32 shrink-0 sm:w-40"
          >
            <PosterImage category={product.category} filename={product.image} alt={product.name} />
          </Link>
        ))}
      </div>
    </div>
  );
}
