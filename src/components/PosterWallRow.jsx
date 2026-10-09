import { Link } from "react-router-dom";
import PosterImage from "./PosterImage.jsx";

// Candidate widths so each device downloads only what it can show (the cards
// are 128px / 160px wide on screen).
const WALL_WIDTHS = [160, 240, 320];
const WALL_SIZES = "(min-width: 640px) 160px, 128px";

// Duplicates the product list so the marquee can loop seamlessly at -50%.
export default function PosterWallRow({ products, direction = "left", priority = false }) {
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
            <PosterImage src={product.image} alt={product.name} width={320} widths={WALL_WIDTHS} sizes={WALL_SIZES} priority={priority && i < 4} defer={i >= 4} />
          </Link>
        ))}
      </div>
    </div>
  );
}