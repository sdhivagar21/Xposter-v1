import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext.jsx";
import { fetchProduct } from "../api/products.js";
import ProductCard from "../components/ProductCard.jsx";

export default function Wishlist() {
  const { ids, removeFromWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    Promise.allSettled(ids.map((id) => fetchProduct(id))).then((results) => {
      if (cancelled) return;
      const found = [];
      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          found.push(result.value);
        } else {
          // Product no longer exists (e.g. removed by an admin) — drop the
          // stale id from the saved wishlist instead of showing a gap.
          removeFromWishlist(ids[i]);
        }
      });
      setProducts(found);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-display text-4xl sm:text-5xl">Wishlist</h1>
      <p className="mt-2 text-sm text-white/40">
        {loading ? "Loading…" : `${products.length} ${products.length === 1 ? "poster" : "posters"} saved`}
      </p>

      {!loading && products.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-white/50">Nothing saved yet. Tap the heart on any poster to keep it here.</p>
          <Link to="/collections" className="btn-outline mt-4 inline-block px-5 py-2.5 text-sm">
            Browse collections
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="relative">
              <ProductCard product={product} className="w-full" />
              <button
                onClick={() => removeFromWishlist(product.id)}
                className="mt-2 text-xs text-white/40 underline-offset-2 transition-colors hover:text-white hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
