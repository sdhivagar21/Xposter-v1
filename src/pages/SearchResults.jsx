import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchProducts } from "../api/products.js";
import ProductCard from "../components/ProductCard.jsx";

const PAGE_SIZE = 24;

export default function SearchResults() {
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchProducts({ q: query, page: 1, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setResults(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(1);
      })
      .catch(() => {
        if (!cancelled) setError("Search isn't working right now - try again in a moment.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  function loadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    fetchProducts({ q: query, page: nextPage, limit: PAGE_SIZE })
      .then((data) => {
        setResults((prev) => [...prev, ...data.products]);
        setPage(nextPage);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError("Couldn't load more results right now."))
      .finally(() => setLoadingMore(false));
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-display text-3xl sm:text-4xl">
        Results for "{query}"
      </h1>
      <p className="mt-2 text-sm text-white/40">
        {loading ? "Searching..." : `${total} ${total === 1 ? "poster" : "posters"} found`}
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
        <>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} className="w-full" />
            ))}
          </div>

          {page < totalPages && (
            <div className="mt-10 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-outline px-6 py-2.5 text-sm disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}