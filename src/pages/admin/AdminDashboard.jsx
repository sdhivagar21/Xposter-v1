import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import ProductFormModal from "../../components/admin/ProductFormModal.jsx";
import { fetchAdminProducts, deleteAdminProduct } from "../../api/admin.js";
import { CATEGORIES, getCategoryName } from "../../data/categories.js";
import { optimizedImage } from "../../utils/cloudinaryUrl.js";
import LoadingScreen from "../../components/LoadingScreen.jsx";

const PAGE_SIZE = 50;

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [modalMode, setModalMode] = useState(null); // null | "create" | product object being edited
  const [deletingId, setDeletingId] = useState(null);

  function load() {
    setLoading(true);
    fetchAdminProducts({ category: category || undefined, q: q || undefined, page: 1, limit: PAGE_SIZE })
      .then((data) => {
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(1);
      })
      .catch(() => setError("Couldn''t load products."))
      .finally(() => setLoading(false));
  }

  // Re-runs whenever the category filter or search term changes.
  useEffect(load, [category, q]);

  function loadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    fetchAdminProducts({ category: category || undefined, q: q || undefined, page: nextPage, limit: PAGE_SIZE })
      .then((data) => {
        setProducts((prev) => [...prev, ...data.products]);
        setPage(nextPage);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError("Couldn''t load more products."))
      .finally(() => setLoadingMore(false));
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setQ(searchInput.trim());
  }

  function handleSaved() {
    // Refetch rather than guessing whether the saved product belongs in the
    // current filtered/sorted view.
    setModalMode(null);
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this poster? This can''t be undone.")) return;
    setDeletingId(id);
    try {
      await deleteAdminProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch {
      setError("Couldn''t delete that product - try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Products</h1>
        <button
          onClick={() => setModalMode("create")}
          className="btn-primary px-4 py-2 text-sm font-medium"
        >
          + Add poster
        </button>
      </div>

      {/* Filter by category and search by name - with 1500+ products this is
          the fastest way to find the poster you want to edit or delete. */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-[var(--xp-border-strong)] bg-transparent px-3 py-2 text-sm text-white/80"
        >
          <option value="" className="bg-[#0c0b09]">All categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.slug} value={cat.slug} className="bg-[#0c0b09]">
              {cat.name}
            </option>
          ))}
        </select>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name..."
            className="border border-[var(--xp-border-strong)] bg-transparent px-3 py-2 text-sm text-white/80 placeholder:text-white/30"
          />
          <button type="submit" className="btn-outline px-4 py-2 text-xs">
            Search
          </button>
          {q && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setQ("");
              }}
              className="text-xs text-white/50 underline-offset-2 hover:text-white hover:underline"
            >
              Clear
            </button>
          )}
        </form>

        {!loading && (
          <span className="text-xs text-white/40">
            {total} {total === 1 ? "product" : "products"}
          </span>
        )}
      </div>

      {error && <p className="mt-6 text-sm text-white/50">{error}</p>}
      {loading && <LoadingScreen />}

      {!loading && products.length === 0 && (
        <p className="mt-10 text-sm text-white/40">
          {category || q ? "No products match that filter." : "No products yet - add your first poster above."}
        </p>
      )}

      {!loading && products.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--xp-border)] text-white/40">
                <th className="py-3 pr-4 font-normal">Photo</th>
                <th className="py-3 pr-4 font-normal">Name</th>
                <th className="py-3 pr-4 font-normal">Category</th>
                <th className="py-3 pr-4 font-normal">Price</th>
                <th className="py-3 pr-4 font-normal">Featured</th>
                <th className="py-3 pr-4 font-normal">Reviews</th>
                <th className="py-3 pr-4 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-[var(--xp-border)]">
                  <td className="py-3 pr-4">
                    <img src={optimizedImage(p.image, 100)} alt={p.name} className="h-14 w-11 object-cover" />
                  </td>
                  <td className="py-3 pr-4">{p.name}</td>
                  <td className="py-3 pr-4 text-white/60">{getCategoryName(p.category)}</td>
                  <td className="py-3 pr-4">â‚¹{p.price}</td>
                  <td className="py-3 pr-4">{p.featured ? "Yes" : "-"}</td>
                  <td className="py-3 pr-4 text-white/60">{p.reviews.length}</td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setModalMode(p)}
                        className="text-xs text-white/60 underline-offset-2 hover:text-white hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        className="text-xs text-white/60 underline-offset-2 hover:text-white hover:underline disabled:opacity-50"
                      >
                        {deletingId === p.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {page < totalPages && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-outline px-6 py-2.5 text-sm disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : `Load more (${products.length} of ${total})`}
              </button>
            </div>
          )}
        </div>
      )}

      {modalMode && (
        <ProductFormModal
          product={modalMode === "create" ? null : modalMode}
          onClose={() => setModalMode(null)}
          onSaved={handleSaved}
        />
      )}
    </AdminLayout>
  );
}