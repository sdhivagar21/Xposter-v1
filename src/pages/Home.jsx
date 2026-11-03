import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { CATEGORIES } from "../data/categories.js";
import { fetchHomeSections, fetchFeaturedProducts } from "../api/products.js";
import PosterWallRow from "../components/PosterWallRow.jsx";
import CategoryChip from "../components/CategoryChip.jsx";
import ProductCard from "../components/ProductCard.jsx";
import PosterImage from "../components/PosterImage.jsx";
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
  // Only the first collection row is in the prerendered HTML; the rest mount a
  // moment after load, so hydration (and first paint) stay light.
  const [rowsShown, setRowsShown] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setRowsShown(Infinity), 1200);
    return () => clearTimeout(t);
  }, []);

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

  const promoPosters = [...rows.rowA, ...rows.rowB].filter((p) => p.image).slice(0, 3);

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
            fetchPriority="high"
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
        <div className="mx-auto max-w-6xl px-5 pb-10">
          <p role="alert" className="alert-error text-center">{error}</p>
        </div>
      )}

      {/* Auto-scrolling poster wall */}
      {/* Height is reserved (2 rows of w-32/sm:w-40 posters + gaps) so the
          page below doesn't jump when the posters arrive. */}
      <section className="min-h-[432px] space-y-4 py-4 sm:min-h-[528px]">
        {rows.rowA.length > 0 && <PosterWallRow products={rows.rowA} direction="left" priority />}
        {rows.rowB.length > 0 && <PosterWallRow products={rows.rowB} direction="right" />}
      </section>

      {/* Buy 2 Get 1 promo */}
      <section className="mx-auto max-w-6xl px-5 pt-8">
        <Link
          to="/collections"
          className="group relative grid items-center gap-6 overflow-hidden border border-[var(--xp-accent)] bg-[linear-gradient(120deg,rgba(201,162,76,0.22),rgba(12,11,9,0.2)_55%,rgba(201,162,76,0.12))] px-6 py-7 sm:grid-cols-[1.1fr_1fr] sm:px-10 sm:py-9"
        >
          <div
            className="animate-glow-pulse pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[var(--xp-accent)]/25 blur-[90px]"
            aria-hidden="true"
          />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--xp-accent-bright)]">On every poster · every size</p>
            <h2 className="mt-2 font-display text-5xl leading-[0.92] sm:text-6xl lg:text-7xl">
              Buy 2<br />
              Get 1 <span className="text-[var(--xp-accent-bright)]">Free</span>
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/65">
              Put any 3 posters in your cart and the most affordable one is on us. Mix sizes, mix movies — it applies automatically.
            </p>
            <span className="btn-primary deal-shine relative mt-5 inline-block px-6 py-3 text-sm font-semibold">Grab the deal →</span>
          </div>
          <div className="relative mx-auto flex h-44 w-60 items-end justify-center sm:h-60 sm:w-96" aria-hidden="true">
            {promoPosters.map((p, i) => (
              <div
                key={p.id}
                className="absolute bottom-0 w-20 transition-transform duration-500 group-hover:-translate-y-1 sm:w-32"
                style={{
                  transform: `translateX(calc(${(i - 1) * 100}% - ${(i - 1) * 8}px)) rotate(${(i - 1) * 8}deg) translateY(${i === 1 ? -16 : 0}px)`,
                  zIndex: i === 2 ? 3 : i === 1 ? 2 : 1,
                }}
              >
                <PosterImage src={p.image} alt="" width={240} className="shadow-[0_14px_30px_rgba(0,0,0,0.7)]" />
                {i === 2 && (
                  <span className="stamp-in absolute -right-3 -top-3 grid h-14 w-14 place-items-center rounded-full border-2 border-[#0c0b09] bg-[var(--xp-accent-bright)] font-display text-lg text-[#0c0b09] shadow-[0_6px_16px_rgba(0,0,0,0.6)]">
                    FREE
                  </span>
                )}
              </div>
            ))}
          </div>
        </Link>
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
          categoriesWithProducts.slice(0, rowsShown).map((cat) => (
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
