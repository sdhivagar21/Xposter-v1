import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import ProductFormModal from "../../components/admin/ProductFormModal.jsx";
import { fetchAdminProducts, deleteAdminProduct } from "../../api/admin.js";
import { getCategoryName } from "../../data/categories.js";

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalMode, setModalMode] = useState(null); // null | "create" | product object being edited
  const [deletingId, setDeletingId] = useState(null);

  function load() {
    setLoading(true);
    fetchAdminProducts()
      .then(setProducts)
      .catch(() => setError("Couldn't load products."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function handleSaved(saved) {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
    });
    setModalMode(null);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this poster? This can't be undone.")) return;
    setDeletingId(id);
    try {
      await deleteAdminProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Couldn't delete that product — try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Products</h1>
        <button
          onClick={() => setModalMode("create")}
          className="btn-primary px-4 py-2 text-sm font-medium"
        >
          + Add poster
        </button>
      </div>

      {error && <p className="mt-6 text-sm text-white/50">{error}</p>}
      {loading && <p className="mt-6 text-sm text-white/40">Loading…</p>}

      {!loading && products.length === 0 && (
        <p className="mt-10 text-sm text-white/40">No products yet — add your first poster above.</p>
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
                    <img src={p.image} alt={p.name} className="h-14 w-11 object-cover" />
                  </td>
                  <td className="py-3 pr-4">{p.name}</td>
                  <td className="py-3 pr-4 text-white/60">{getCategoryName(p.category)}</td>
                  <td className="py-3 pr-4">₹{p.price}</td>
                  <td className="py-3 pr-4">{p.featured ? "Yes" : "—"}</td>
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
                        {deletingId === p.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
