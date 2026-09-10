import { Link } from "react-router-dom";
import { CATEGORIES } from "../data/categories.js";
import { getProductsByCategory } from "../data/mockProducts.js";
import PosterImage from "../components/PosterImage.jsx";

export default function Collections() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-display text-4xl sm:text-5xl">Collections</h1>
      <p className="mt-3 max-w-md text-white/50">Seven worlds. Pick one and start filling your walls.</p>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const products = getProductsByCategory(cat.slug);
          const cover = products[0];
          return (
            <Link key={cat.slug} to={`/collections/${cat.slug}`} className="group block">
              {cover ? (
                <PosterImage
                  category={cover.category}
                  filename={cover.image}
                  alt={cat.name}
                  aspect="aspect-[3/4]"
                />
              ) : (
                <div className="poster-frame flex aspect-[3/4] items-center justify-center">
                  <span className="poster-fallback">{cat.name}</span>
                </div>
              )}
              <p className="mt-3 font-display text-lg tracking-wide">{cat.name}</p>
              <p className="text-xs text-white/40">
                {products.length} {products.length === 1 ? "poster" : "posters"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
