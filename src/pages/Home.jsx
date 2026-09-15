import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { CATEGORIES } from "../data/categories.js";
import { fetchProducts, fetchFeaturedProducts } from "../api/products.js";
import PosterWallRow from "../components/PosterWallRow.jsx";
import CategoryChip from "../components/CategoryChip.jsx";
import ProductCard from "../components/ProductCard.jsx";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState({ rowA: [], rowB: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([fetchProducts(), fetchFeaturedProducts()])
      .then(([allProducts, featured]) => {
        if (cancelled) return;
        setProducts(allProducts);
        // Shuffled between two marquee rows scrolling in opposite directions.
        const shuffled = [...featured].sort(() => Math.random() - 0.5);
        const mid = Math.ceil(shuffled.length / 2);
        setRows({ rowA: shuffled.slice(0, mid), rowB: shuffled.slice(mid) });
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load the catalog right now — try refreshing.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const categoriesWithProducts = CATEGORIES.map((cat) => ({
    ...cat,
    products: products.filter((p) => p.category === cat.slug),
  })).filter((cat) => cat.products.length > 0);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-16 pt-20 sm:pt-28">
        <div
          className="animate-glow-pulse pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--xp-accent)]/[0.12] blur-[110px]"
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
            Big, bold prints for people who like their walls loud. Movies, machines, heroes and mantras — framed for people with taste.
          </p>
          <div className="animate-hero-rise mt-8" style={{ animationDelay: "0.3s" }}>
            <Link
              to="/collections"
              className="btn-primary inline-block px-8 py-3.5 text-sm font-medium"
            >
              Explore Collections
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <p className="mx-auto max-w-6xl px-5 pb-10 text-center text-sm text-white/40">{error}</p>
      )}

      {/* Auto-scrolling poster wall */}
      {(rows.rowA.length > 0 || rows.rowB.length > 0) && (
        <section className="space-y-4 py-4">
          {rows.rowA.length > 0 && <PosterWallRow products={rows.rowA} direction="left" />}
          {rows.rowB.length > 0 && <PosterWallRow products={rows.rowB} direction="right" />}
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
        {loading && <p className="text-sm text-white/40">Loading posters…</p>}
        {!loading &&
          categoriesWithProducts.map((cat) => (
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
