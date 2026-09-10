import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCategoryName } from "../data/categories.js";
import { getProductsByCategory } from "../data/mockProducts.js";
import ProductCard from "../components/ProductCard.jsx";

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
];

export default function CategoryPage() {
  const { slug } = useParams();
  const [sort, setSort] = useState("newest");
  const categoryName = getCategoryName(slug);
  const products = getProductsByCategory(slug);

  const sorted = useMemo(() => {
    const list = [...products];
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    // "newest" keeps mock-data insertion order, standing in for a real
    // createdAt sort once products come from a backend.
    return list;
  }, [products, sort]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">{categoryName}</h1>
          <p className="mt-2 text-sm text-white/40">
            {sorted.length} {sorted.length === 1 ? "poster" : "posters"}
          </p>
        </div>

        <div className="flex gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSort(opt.id)}
              className={`border px-3 py-2 text-xs transition-colors ${
                sort === opt.id
                  ? "border-white bg-white text-black"
                  : "border-white/25 text-white/70 hover:border-white hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-white/50">No posters in this category yet.</p>
          <Link to="/collections" className="mt-4 inline-block border border-white px-5 py-2.5 text-sm transition-colors hover:bg-white hover:text-black">
            Browse other collections
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
          {sorted.map((product) => (
            <ProductCard key={product.id} product={product} className="w-full" />
          ))}
        </div>
      )}
    </div>
  );
}
