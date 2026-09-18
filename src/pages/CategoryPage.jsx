import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCategoryName } from "../data/categories.js";
import { fetchProducts } from "../api/products.js";
import ProductCard from "../components/ProductCard.jsx";

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
];

const PAGE_SIZE = 24;

export default function CategoryPage() {
  const { slug } = useParams();
  const [sort, setSort] = useState("newest");
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const categoryName = getCategoryName(slug);

  // Reset to page 1 whenever the category or sort changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProducts({ category: slug, sort, page: 1, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(1);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this category right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, sort]);

  function loadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    fetchProducts({ category: slug, sort, page: nextPage, limit: PAGE_SIZE })
      .then((data) => {
        setProducts((prev) => [...prev, ...data.products]);
        setPage(nextPage);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError("Couldn't load more posters right now."))
      .finally(() => setLoadingMore(false));
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">{categoryName}</h1>
          <p className="mt-2 text-sm text-white/40">
            {loading ? "Loading..." : `${total} ${total === 1 ? "poster" : "posters"}`}
          </p>
        </div>

        <div className="flex gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSort(opt.id)}
              className={`border px-3 py-2 text-xs transition-colors ${
                sort === opt.id
                  ? "border-[var(--xp-accent)] bg-[var(--xp-accent)] text-[#0c0b09]"
                  : "border-[var(--xp-border-strong)] text-white/70 hover:border-[var(--xp-accent)] hover:text-[var(--xp-accent-bright)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-10 text-sm text-white/40">{error}</p>}

      {!error && !loading && products.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-white/50">No posters in this category yet.</p>
          <Link to="/collections" className="btn-outline mt-4 inline-block px-5 py-2.5 text-sm">
            Browse other collections
          </Link>
        </div>
      )}

      {!error && products.length > 0 && (
        <>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
            {products.map((product) => (
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