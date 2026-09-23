import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { CATEGORIES } from "../data/categories.js";
import { fetchHomeSections, fetchFeaturedProducts } from "../api/products.js";
import PosterWallRow from "../components/PosterWallRow.jsx";
import PosterImage from "../components/PosterImage.jsx";
import ProductCard from "../components/ProductCard.jsx";

// Hero floating-card layout: left/top offsets, rotation and animation delay
// for each of the (up to) 3 real posters shown stacked beside the headline.
const HERO_CARD_LAYOUT = [
  { left: 0, top: 24, rotate: "-6deg", delay: "0s" },
  { left: 110, top: 76, rotate: "3deg", delay: "0.6s" },
  { left: 222, top: 8, rotate: "-3deg", delay: "1.2s" },
];

const TICKER_ITEMS = [...CATEGORIES, ...CATEGORIES];

export default function Home() {
  const [sections, setSections] = useState({});
  const [rows, setRows] = useState({ rowA: [], rowB: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Only pulls up to 10 newest posters per category (server-side) plus the
    // featured set for the wall - not the entire catalog.
    Promise.all([fetchHomeSections(10), fetchFeaturedProducts()])
      .then(([sectionsData, featured]) => {
        if (cancelled) return;
        setSections(sectionsData);
        // Shuffled between two marquee rows scrolling in opposite directions.
        const shuffled = [...featured].sort(() => Math.random() - 0.5);
        const mid = Math.ceil(shuffled.length / 2);
        setRows({ rowA: shuffled.slice(0, mid), rowB: shuffled.slice(mid) });
      })
      .catch(() => {
        if (!cancelled) setError("Couldn''t load the catalog right now - try refreshing.");
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
    products: sections[cat.slug] || [],
  })).filter((cat) => cat.products.length > 0);

  const heroCards = rows.rowA.slice(0, 3);

  return (
    <div>
      {/* Hero - kinetic stacked headline beside floating real posters */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-16 sm:grid-cols-2 sm:items-center sm:px-8 sm:pt-24">
        <div>
          <h1 className="flex flex-col">
            <span className="kinetic-line font-display text-5xl leading-[0.98] sm:text-7xl">Big, bold</span>
            <span className="kinetic-line font-display text-5xl leading-[0.98] sm:text-7xl sm:ml-8">prints for</span>
            <span className="kinetic-line font-display text-5xl leading-[0.98] sm:text-7xl sm:ml-4">people who</span>
            <span className="kinetic-line font-display text-5xl leading-[0.98] sm:text-7xl">like their</span>
            <span className="kinetic-line font-display text-5xl leading-[0.98] text-[var(--xp-accent)] sm:text-7xl">
              walls loud.
            </span>
          </h1>
          <p className="mt-6 max-w-sm text-white/60">
            Movies, machines, heroes and mantras - framed for people with taste.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/collections" className="btn-primary inline-block px-8 py-3.5 text-sm font-medium">
              Explore Collections
            </Link>
            <a
              href="#categories"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Browse categories
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </a>
          </div>
        </div>

        {heroCards.length > 0 && (
          <div className="relative hidden h-[420px] sm:block" aria-hidden="true">
            {heroCards.map((product, i) => {
              const layout = HERO_CARD_LAYOUT[i];
              return (
                <div
                  key={product.id}
                  className="animate-float-card absolute w-[230px] shadow-2xl shadow-black/50"
                  style={{
                    left: layout.left,
                    top: layout.top,
                    "--r": layout.rotate,
                    animationDelay: layout.delay,
                    zIndex: i + 1,
                  }}
                >
                  <PosterImage src={product.image} alt={product.name} width={460} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {error && (
        <p className="mx-auto max-w-6xl px-5 pb-10 text-center text-sm text-white/40">{error}</p>
      )}

      {/* Scrolling category ticker - purely a visual divider between the
          hero and the poster rows */}
      <section className="overflow-hidden border-y border-[var(--xp-border)] py-5" aria-hidden="true">
        <div className="flex w-max items-center gap-10 animate-marquee-left">
          {TICKER_ITEMS.map((cat, i) => (
            <span
              key={`${cat.slug}-${i}`}
              className="font-display flex items-center gap-10 whitespace-nowrap text-2xl sm:text-4xl"
            >
              {cat.name}
              <span className="text-[var(--xp-accent)]">/</span>
            </span>
          ))}
        </div>
      </section>

      {/* Auto-scrolling poster wall - one row left, one row right */}
      {(rows.rowA.length > 0 || rows.rowB.length > 0) && (
        <section className="py-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--xp-accent)]">Explore</p>
            <h2 className="font-display mt-3 text-4xl sm:text-5xl">The wall never stops</h2>
          </div>
          <div className="mt-8 space-y-4">
            {rows.rowA.length > 0 && <PosterWallRow products={rows.rowA} direction="left" />}
            {rows.rowB.length > 0 && <PosterWallRow products={rows.rowB} direction="right" />}
          </div>
        </section>
      )}

      {/* Shop by category - numbered editorial index */}
      <section id="categories" className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--xp-accent)]">Index</p>
        <h2 className="font-display mt-3 text-4xl sm:text-5xl">Shop by category</h2>
        <div className="mt-10">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.slug}
              to={`/collections/${cat.slug}`}
              className="index-row flex items-center gap-6 border-b border-[var(--xp-border)] py-6 sm:gap-8"
            >
              <span className="index-row-num w-8 shrink-0 text-sm text-white/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="index-row-name font-display flex-1 text-2xl sm:text-4xl">{cat.name}</span>
              <svg
                className="index-row-arrow h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </Link>
          ))}
        </div>
      </section>

      {/* Collection sections */}
      <section className="mx-auto max-w-6xl space-y-14 px-5 pb-20 sm:px-8">
        {loading && <p className="text-sm text-white/40">Loading posters...</p>}
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
