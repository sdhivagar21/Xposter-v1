import { Link } from "react-router-dom";
import { useState } from "react";
import { CATEGORIES } from "../data/categories.js";
import { getFeaturedProducts, getProductsByCategory } from "../data/mockProducts.js";
import PosterWallRow from "../components/PosterWallRow.jsx";
import CategoryChip from "../components/CategoryChip.jsx";
import ProductCard from "../components/ProductCard.jsx";

export default function Home() {
  // Featured products (admin-curated via the `featured` flag) shuffled
  // between two marquee rows scrolling in opposite directions.
  const [{ rowA, rowB }] = useState(() => {
    const featured = getFeaturedProducts();
    const shuffled = [...featured].sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);
    return { rowA: shuffled.slice(0, mid), rowB: shuffled.slice(mid) };
  });

  const categoriesWithProducts = CATEGORIES.map((cat) => ({
    ...cat,
    products: getProductsByCategory(cat.slug),
  })).filter((cat) => cat.products.length > 0);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-16 pt-20 sm:pt-28">
        <div
          className="animate-glow-pulse pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-[110px]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="animate-hero-rise font-display text-6xl leading-none sm:text-8xl">
            XPOSTERS
          </h1>
          <p
            className="animate-hero-rise mx-auto mt-5 max-w-md text-balance text-white/60"
            style={{ animationDelay: "0.15s" }}
          >
            Big, bold prints for people who like their walls loud. Movies, machines, heroes and mantras — in black and white.
          </p>
          <div className="animate-hero-rise mt-8" style={{ animationDelay: "0.3s" }}>
            <Link
              to="/collections"
              className="inline-block bg-white px-8 py-3.5 text-sm font-medium text-black transition-opacity hover:opacity-80"
            >
              Explore Collections
            </Link>
          </div>
        </div>
      </section>

      {/* Auto-scrolling poster wall */}
      {(rowA.length > 0 || rowB.length > 0) && (
        <section className="space-y-4 py-4">
          {rowA.length > 0 && <PosterWallRow products={rowA} direction="left" />}
          {rowB.length > 0 && <PosterWallRow products={rowB} direction="right" />}
        </section>
      )}

      {/* Quick category chips */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="rail flex gap-3 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <CategoryChip key={cat.slug} slug={cat.slug} name={cat.name} />
          ))}
        </div>
      </section>

      {/* Collection sections */}
      <section className="mx-auto max-w-6xl space-y-14 px-5 pb-20">
        {categoriesWithProducts.map((cat) => (
          <div key={cat.slug}>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-2xl sm:text-3xl">{cat.name}</h2>
              <Link to={`/collections/${cat.slug}`} className="text-sm text-white/50 transition-colors hover:text-white">
                View all
              </Link>
            </div>
            <div className="rail flex gap-4 overflow-x-auto pb-2">
              {cat.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
