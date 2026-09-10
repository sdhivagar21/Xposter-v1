import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext.jsx";
import { getProductById } from "../data/mockProducts.js";
import ProductCard from "../components/ProductCard.jsx";

export default function Wishlist() {
  const { ids, removeFromWishlist } = useWishlist();
  const products = ids.map(getProductById).filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-display text-4xl sm:text-5xl">Wishlist</h1>
      <p className="mt-2 text-sm text-white/40">
        {products.length} {products.length === 1 ? "poster" : "posters"} saved
      </p>

      {products.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-white/50">Nothing saved yet. Tap the heart on any poster to keep it here.</p>
          <Link to="/collections" className="mt-4 inline-block border border-white px-5 py-2.5 text-sm transition-colors hover:bg-white hover:text-black">
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
