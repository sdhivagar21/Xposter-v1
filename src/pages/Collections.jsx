import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "../data/categories.js";
import { fetchCollectionsSummary } from "../api/products.js";
import PosterImage from "../components/PosterImage.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";

export default function Collections() {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // One cover image + count per category - not every product.
    fetchCollectionsSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn''t load collections right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-display text-4xl sm:text-5xl">Collections</h1>
      <p className="mt-3 max-w-md text-white/50">Seven worlds. Pick one and start filling your walls.</p>

      {loading && <LoadingScreen />}
      {error && <p className="mt-10 text-sm text-white/40">{error}</p>}

      {!loading && !error && (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const info = summary[cat.slug];
            const count = info?.count || 0;
            return (
              <Link key={cat.slug} to={`/collections/${cat.slug}`} className="group block">
                {info?.cover ? (
                  <PosterImage src={info.cover} alt={cat.name} aspect="aspect-[3/4]" />
                ) : (
                  <div className="poster-frame flex aspect-[3/4] items-center justify-center">
                    <span className="poster-fallback">{cat.name}</span>
                  </div>
                )}
                <p className="mt-3 font-display text-lg tracking-wide">{cat.name}</p>
                <p className="text-xs text-white/40">
                  {count} {count === 1 ? "poster" : "posters"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}