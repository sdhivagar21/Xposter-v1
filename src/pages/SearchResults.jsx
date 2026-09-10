import { useSearchParams, Link } from "react-router-dom";
import { searchProducts } from "../data/mockProducts.js";
import ProductCard from "../components/ProductCard.jsx";

export default function SearchResults() {
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  const results = searchProducts(query);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-display text-3xl sm:text-4xl">
        Results for "{query}"
      </h1>
      <p className="mt-2 text-sm text-white/40">
        {results.length} {results.length === 1 ? "poster" : "posters"} found
      </p>

      {results.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-white/50">Nothing matched that search.</p>
          <Link to="/collections" className="mt-4 inline-block border border-white px-5 py-2.5 text-sm transition-colors hover:bg-white hover:text-black">
            Browse collections
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} className="w-full" />
          ))}
        </div>
      )}
    </div>
  );
}
