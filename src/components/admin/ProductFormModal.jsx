import { useState } from "react";
import { CATEGORIES } from "../../data/categories.js";
import { createAdminProduct, updateAdminProduct } from "../../api/admin.js";

export default function ProductFormModal({ product, onClose, onSaved }) {
  const isEdit = Boolean(product);
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price ?? "");
  const [category, setCategory] = useState(product?.category || CATEGORIES[0].slug);
  const [description, setDescription] = useState(product?.description || "");
  const [featured, setFeatured] = useState(product?.featured || false);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(product?.image || null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !price || (!isEdit && !imageFile)) {
      setError("Name, price, and an image are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const fields = { name: name.trim(), price, category, description, featured };

    try {
      const saved = isEdit
        ? await updateAdminProduct(product.id, fields, imageFile)
        : await createAdminProduct(fields, imageFile);
      onSaved(saved);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save this product — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-[var(--xp-border-strong)] bg-[var(--xp-bg-elevated)] p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl">{isEdit ? "Edit poster" : "Add poster"}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center border border-[var(--xp-border-strong)] transition-colors hover:border-[var(--xp-accent)] hover:text-[var(--xp-accent-bright)]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-white/40" htmlFor="p-name">
              Name
            </label>
            <input
              id="p-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/40" htmlFor="p-price">
                Price (₹)
              </label>
              <input
                id="p-price"
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/40" htmlFor="p-category">
                Category
              </label>
              <select
                id="p-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-[var(--xp-border-strong)] bg-[var(--xp-bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/40" htmlFor="p-description">
              Description (optional)
            </label>
            <textarea
              id="p-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/40" htmlFor="p-image">
              Poster image {isEdit && "(leave empty to keep current photo)"}
            </label>
            <input
              id="p-image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-xs text-white/60 file:mr-3 file:border file:border-[var(--xp-border-strong)] file:bg-transparent file:px-3 file:py-1.5 file:text-xs file:text-[var(--xp-white)]"
            />
            {preview && (
              <img src={preview} alt="Preview" className="mt-3 h-32 w-24 border border-[var(--xp-border)] object-cover" />
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-white/70">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            Featured on homepage wall
          </label>

          {error && <p className="text-xs text-white/70">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-2.5 text-sm font-medium"
          >
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Add poster"}
          </button>
        </form>
      </div>
    </div>
  );
}
