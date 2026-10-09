import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { CATEGORIES } from "../data/categories.js";
import { fetchHomeSections, fetchFeaturedProducts } from "../api/products.js";
import PosterWallRow from "../components/PosterWallRow.jsx";
import CategoryChip from "../components/CategoryChip.jsx";
import ProductCard from "../components/ProductCard.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { sortTamilMovies } from "../utils/tamilMoviesOrder.js";
import snapshot from "../data/homeSnapshot.json";

// The snapshot (saved at build time) lets the first paint already show real
// posters; the live API response then replaces it a moment later.
function splitRows(list) {
  const mid = Math.ceil(list.length / 2);
  return { rowA: list.slice(0, mid), rowB: list.slice(mid) };
}
const HAS_SNAPSHOT = Object.keys(snapshot.sections || {}).length > 0;

export default function Home() {
  const [sections, setSections] = useState(snapshot.sections || {});
  const [rows, setRows] = useState(() => splitRows(snapshot.featured || []));
  const [loading, setLoading] = useState(!HAS_SNAPSHOT);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // Only pulls up to 10 newest posters per category (server-side) plus the
    // featured set for the wall - not the entire catalog.
    Promise.all([fetchHomeSections(10), fetchFeaturedProducts()])
      .then(([sectionsData, featured]) => {
        if (cancelled) return;
        setSections(sectionsData);
        // Shuffled between two marquee rows scrolling in opposite directions
        // - but only if the featured set actually changed since the snapshot,
        // so the posters already on screen don't reshuffle under the visitor.
        setRows((prev) => {
          const same =
            prev.rowA.length + prev.rowB.length === featured.length &&
            [...prev.rowA, ...prev.rowB].every((p) => featured.some((f) => f.id === p.id));
          if (same) return prev;
          const shuffled = [...featured].sort(() => Math.random() - 0.5);
          return splitRows(shuffled);
        });
      })
      .catch(() => {
        // With a saved snapshot already on screen there's nothing to apologise for.
        if (!cancelled && !HAS_SNAPSHOT) setError("Couldn't load the catalog right now - try refreshing.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const categoriesWithProducts = CATEGORIES.map((cat) => {
    const products = sections[cat.slug] || [];
    return {
      ...cat,
      products: cat.slug === "tamil-movies" ? sortTamilMovies(products) : products,
    };
  }).filter((cat) => cat.products.length > 0);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-16 pt-20 sm:pt-28">
        <div
          className="animate-glow-pulse pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,162,76,0.16)_0%,transparent_65%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <img
            src="/logo-mark.webp"
            alt="XPOSTERS"
            className="animate-hero-rise mx-auto h-16 w-auto sm:h-24"
            fetchpriority="high"
            width="320"
            height="114"
          />
          <p
            className="animate-hero-rise mx-auto mt-5 max-w-md text-balance text-white/60"
            style={{ animationDelay: "0.15s" }}
          >
            Big, bold prints for people who like their walls loud. Movies, machines, heroes and mantras - framed for people with taste.
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
        <p className="mx-auto max-w-6xl px-5 pb-10 text-center text-sm text-white/60">{error}</p>
      )}

      {/* Auto-scrolling poster wall */}
      {/* Height is reserved (2 rows of w-32/sm:w-40 posters + gaps) so the
          page below doesn't jump when the posters arrive. */}
      <section className="min-h-[432px] space-y-4 py-4 sm:min-h-[528px]">
        {rows.rowA.length > 0 && <PosterWallRow products={rows.rowA} direction="left" priority />}
        {rows.rowB.length > 0 && <PosterWallRow products={rows.rowB} direction="right" />}
      </section>

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
        {loading && <LoadingScreen className="min-h-[600px]" />}
        {!loading &&
          categoriesWithProducts.map((cat) => (
            <div key={cat.slug} style={{ contentVisibility: "auto", containIntrinsicSize: "auto 380px" }}>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-display text-2xl sm:text-3xl">{cat.name}</h2>
                <Link to={`/collections/${cat.slug}`} className="text-sm text-white/65 transition-colors hover:text-white">
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
