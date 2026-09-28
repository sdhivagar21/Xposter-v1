import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCategoryName, SIZES } from "../data/categories.js";
import { fetchProducts } from "../api/products.js";
import { submitCustomPosterOrder } from "../api/orders.js";
import ProductCard from "../components/ProductCard.jsx";
import { sortTamilMovies } from "../utils/tamilMoviesOrder.js";

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
  const isCustomPosters = slug === "customizable-posters";

  // Reset to page 1 whenever the category or sort changes. The
  // customizable-posters "category" isn't backed by real Product documents
  // (see CustomPosterForm below), so there's nothing to fetch for it.
  useEffect(() => {
    if (isCustomPosters) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchProducts({ category: slug, sort, page: 1, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        const list = slug === "tamil-movies" ? sortTamilMovies(data.products) : data.products;
        setProducts(list);
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
  }, [slug, sort, isCustomPosters]);

  function loadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    fetchProducts({ category: slug, sort, page: nextPage, limit: PAGE_SIZE })
      .then((data) => {
        setProducts((prev) => {
          const combined = [...prev, ...data.products];
          return slug === "tamil-movies" ? sortTamilMovies(combined) : combined;
        });
        setPage(nextPage);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError("Couldn't load more posters right now."))
      .finally(() => setLoadingMore(false));
  }

  if (isCustomPosters) {
    return <CustomPosterForm />;
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;

// The "Customizable Posters" category has no real product listing - it's an
// upload form instead. Kept inside CategoryPage (rather than a separate
// page/route) since /collections/:slug already routes every category slug
// here, customizable-posters included.
function CustomPosterForm() {
  const [mode, setMode] = useState("upload"); // "upload" | "link"
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [imageLink, setImageLink] = useState("");
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", notes: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setFile(picked);
    setImageLink("");
    setFilePreview(URL.createObjectURL(picked));
  }

  function handleModeChange(next) {
    setMode(next);
    setServerError(null);
    if (next === "upload") {
      setImageLink("");
    } else {
      setFile(null);
      setFilePreview(null);
    }
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Enter your name.";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (!PHONE_RE.test(form.phone.trim())) next.phone = "Enter a 10-digit phone number.";
    if (!form.address.trim()) next.address = "Enter a delivery address.";
    if (mode === "upload" && !file) next.image = "Choose an image to upload.";
    if (mode === "link" && !imageLink.trim()) next.image = "Paste a link to your image.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError(null);

    const formData = new FormData();
    formData.append("size", selectedSize.slug);
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("phone", form.phone);
    formData.append("address", form.address);
    formData.append("notes", form.notes);
    if (mode === "upload" && file) {
      formData.append("image", file);
    } else {
      formData.append("imageLink", imageLink.trim());
    }

    try {
      await submitCustomPosterOrder(formData);
      setSubmitted(true);
      setFile(null);
      setFilePreview(null);
      setImageLink("");
      setForm({ name: "", email: "", phone: "", address: "", notes: "" });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Couldn't submit your poster right now — please try again in a moment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="font-display text-4xl sm:text-5xl">Got it!</h1>
        <p className="mt-4 text-white/60">
          Your poster's on its way to us. We'll take a look and email you at the address you gave once it's confirmed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={() => setSubmitted(false)} className="btn-outline px-6 py-3 text-sm">
            Submit another
          </button>
          <Link to="/collections" className="btn-primary px-6 py-3 text-sm font-medium">
            Browse posters
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <h1 className="font-display text-4xl sm:text-5xl">Customizable Posters</h1>
      <p className="mt-3 max-w-lg text-white/50">
        Upload your own image or paste a link to one, pick a size, and we'll print it — same rates as every other poster on XPOSTERS.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="poster-frame flex aspect-[3/4] items-center justify-center overflow-hidden">
            {mode === "upload" && filePreview ? (
              <img src={filePreview} alt="Your poster preview" className="h-full w-full object-contain" />
            ) : mode === "link" && imageLink.trim() ? (
              <img
                src={imageLink.trim()}
                alt="Your poster preview"
                className="h-full w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span className="poster-fallback">Your poster will appear here</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleModeChange("upload")}
                className={`flex-1 border px-4 py-2.5 text-sm transition-colors ${
                  mode === "upload"
                    ? "border-[var(--xp-accent)] bg-[var(--xp-accent)] text-[#0c0b09]"
                    : "border-[var(--xp-border-strong)] hover:border-[var(--xp-accent)]"
                }`}
              >
                Upload a file
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("link")}
                className={`flex-1 border px-4 py-2.5 text-sm transition-colors ${
                  mode === "link"
                    ? "border-[var(--xp-accent)] bg-[var(--xp-accent)] text-[#0c0b09]"
                    : "border-[var(--xp-border-strong)] hover:border-[var(--xp-accent)]"
                }`}
              >
                Paste a link
              </button>
            </div>

            {mode === "upload" ? (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-3 w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none file:mr-3 file:border-0 file:bg-[var(--xp-accent)] file:px-3 file:py-1.5 file:text-xs file:text-[#0c0b09]"
              />
            ) : (
              <input
                type="url"
                placeholder="https://example.com/your-image.jpg"
                value={imageLink}
                onChange={(e) => setImageLink(e.target.value)}
                className="mt-3 w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
              />
            )}
            {errors.image && <p className="mt-1 text-xs text-white/70">{errors.image}</p>}
            <p className="mt-2 text-xs text-white/40">
              We'll check the image is sharp enough to print well at the size you pick below.
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs text-white/40">Size</p>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  className={`border px-3 py-2 text-xs transition-colors ${
                    selectedSize.slug === s.slug
                      ? "border-[var(--xp-accent)] bg-[var(--xp-accent)] text-[#0c0b09]"
                      : "border-[var(--xp-border-strong)] hover:border-[var(--xp-accent)] hover:text-[var(--xp-accent-bright)]"
                  }`}
                >
                  {s.label} · ₹{s.price}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-1 block text-xs text-white/40" htmlFor="cp-name">
                Full name
              </label>
              <input
                id="cp-name"
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
              />
              {errors.name && <p className="mt-1 text-xs text-white/70">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/40" htmlFor="cp-email">
                Email
              </label>
              <input
                id="cp-email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
              />
              {errors.email && <p className="mt-1 text-xs text-white/70">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/40" htmlFor="cp-phone">
                Phone (10 digits)
              </label>
              <input
                id="cp-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                className="w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
              />
              {errors.phone && <p className="mt-1 text-xs text-white/70">{errors.phone}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/40" htmlFor="cp-address">
                Delivery address
              </label>
              <textarea
                id="cp-address"
                rows={3}
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="w-full resize-none border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
              />
              {errors.address && <p className="mt-1 text-xs text-white/70">{errors.address}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/40" htmlFor="cp-notes">
                Notes (optional)
              </label>
              <textarea
                id="cp-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Cropping, framing, anything else we should know"
                className="w-full resize-none border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
              />
            </div>
          </div>

          {serverError && <p className="text-xs text-white/70">{serverError}</p>}

          <div className="flex items-center justify-between border-t border-[var(--xp-border)] pt-5">
            <span className="text-sm text-white/60">
              Total: <span className="text-white">₹{selectedSize.price}</span>
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-8 py-3.5 text-sm font-medium"
            >
              {submitting ? "Submitting…" : "Submit poster"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
