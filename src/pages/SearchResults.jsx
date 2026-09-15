import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchProducts } from "../api/products.js";
import ProductCard from "../components/ProductCard.jsx";

export default function SearchResults() {
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchProducts({ q: query })
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch(() => {
        if (!cancelled) setError("Search isn't working right now — try again in a moment.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-display text-3xl sm:text-4xl">
        Results for "{query}"
      </h1>
      <p className="mt-2 text-sm text-white/40">
        {loading ? "Searching…" : `${results.length} ${results.length === 1 ? "poster" : "posters"} found`}
      </p>

      {error && <p className="mt-10 text-sm text-white/40">{error}</p>}

      {!error && !loading && results.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-white/50">Nothing matched that search.</p>
          <Link to="/collections" className="btn-outline mt-4 inline-block px-5 py-2.5 text-sm">
            Browse collections
          </Link>
        </div>
      )}

      {!error && results.length > 0 && (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} className="w-full" />
          ))}
        </div>
      )}
    </div>
  );
}
