import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCategoryName, SIZES } from "../data/categories.js";
import { fetchAllProducts, getCachedAll } from "../api/products.js";
import { submitCustomPosterOrder, enhanceCustomImage } from "../api/orders.js";
import ProductCard from "../components/ProductCard.jsx";
import { sortTamilMovies } from "../utils/tamilMoviesOrder.js";

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
];

export default function CategoryPage() {
  const { slug } = useParams();
  const [sort, setSort] = useState("newest");
  const categoryName = getCategoryName(slug);
  const isCustomPosters = slug === "customizable-posters";
  const cacheParams = { category: slug, sort };
  const cached = isCustomPosters ? null : getCachedAll(cacheParams);
  const [products, setProducts] = useState(cached ? (slug === "tamil-movies" ? sortTamilMovies(cached.products) : cached.products) : []);
  const [total, setTotal] = useState(cached ? cached.total : 0);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(null);

  // The whole category is loaded at once (no "Load more"). The
  // customizable-posters "category" isn't backed by real Product documents
  // (see CustomPosterForm below), so there's nothing to fetch for it.
  useEffect(() => {
    if (isCustomPosters) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const hit = getCachedAll({ category: slug, sort });
    const order = (list) => (slug === "tamil-movies" ? sortTamilMovies(list) : list);
    if (hit) {
      setProducts(order(hit.products));
      setTotal(hit.total);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);
    fetchAllProducts({ category: slug, sort })
      .then((data) => {
        if (cancelled) return;
        setProducts(order(data.products));
        setTotal(data.total);
      })
      .catch(() => {
        if (!cancelled && !hit) setError("Couldn't load this category right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, sort, isCustomPosters]);

  if (isCustomPosters) {
    return <CustomPosterForm />;
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">{categoryName}</h1>
          <p className="mt-2 text-sm text-white/60">
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

      {error && <p className="mt-10 text-sm text-white/60">{error}</p>}

      {!error && !loading && products.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-white/65">No posters in this category yet.</p>
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
        </>
      )}
    </div>
  );
}

const MAX_UPLOAD_SIDE = 5200; // the biggest print (A3 @ 300 DPI) is 3510x4950

// Camera/phone originals can be huge. Anything over ~4MB or ~5200px is
// downscaled in the browser first (still more pixels than any print needs),
// so big files upload quickly and never hit a size limit. Falls back to the
// original file if the browser can't decode it.
async function shrinkForUpload(file) {
  try {
    if (!file.type.startsWith("image/")) return file;
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const longSide = Math.max(bitmap.width, bitmap.height);
    if (file.size <= 4 * 1024 * 1024 && longSide <= MAX_UPLOAD_SIDE) {
      bitmap.close();
      return file;
    }
    const scale = Math.min(1, MAX_UPLOAD_SIDE / longSide);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
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
  // Tracks whether the current preview <img> has actually finished loading,
  // so it can pick up the .loaded class the shared .poster-frame CSS relies
  // on (that CSS starts every image at opacity: 0 and only reveals it once
  // .loaded is added - PosterImage.jsx does the same thing for product
  // photos). Reset to false whenever the preview source changes, so a new
  // pick/link doesn't render with the previous image's visibility.
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [imageLink, setImageLink] = useState("");
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", notes: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  // Enhancement: as soon as there's an image (and again if the size changes)
  // it's sent to the backend, which upscales/cleans it to 300 DPI for that
  // size and hosts the result. The customer sees the enhanced image before
  // submitting, and the order then just references it.
  const [enhanced, setEnhanced] = useState(null);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState(null);
  const enhanceRun = useRef(0);

  useEffect(() => {
    const link = imageLink.trim();
    const hasSource = mode === "upload" ? !!file : /^https?:\/\/\S+$/i.test(link);
    setEnhanced(null);
    setEnhanceError(null);
    if (!hasSource) {
      setEnhancing(false);
      return;
    }
    const run = ++enhanceRun.current;
    setEnhancing(true);
    const timer = setTimeout(
      async () => {
        const fd = new FormData();
        fd.append("size", selectedSize.slug);
        if (mode === "upload") fd.append("image", await shrinkForUpload(file));
        else fd.append("imageLink", link);
        if (run !== enhanceRun.current) return;
        enhanceCustomImage(fd)
          .then((data) => {
            if (run !== enhanceRun.current) return;
            setEnhanced(data);
            setPreviewLoaded(false);
          })
          .catch((err) => {
            if (run !== enhanceRun.current) return;
            setEnhanceError(
              err.response?.data?.message || "Couldn't enhance that image right now - please try again."
            );
          })
          .finally(() => {
            if (run === enhanceRun.current) setEnhancing(false);
          });
      },
      mode === "link" ? 800 : 0
    );
    return () => clearTimeout(timer);
  }, [mode, file, imageLink, selectedSize]);

  function handleFileChange(e) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setFile(picked);
    setImageLink("");
    setPreviewLoaded(false);
    setFilePreview(URL.createObjectURL(picked));
  }

  function handleModeChange(next) {
    setMode(next);
    setServerError(null);
    setPreviewLoaded(false);
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
    if (!next.image && enhancing) next.image = "Hold on - we're still enhancing your image.";
    if (!next.image && !enhanced) next.image = enhanceError || "We couldn't enhance that image - try another.";
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
    // The image was already enhanced and hosted in the preview step - the
    // order just points at it (the server re-checks the id and reads its real
    // size), so nothing is uploaded a second time.
    formData.append("enhancedPublicId", enhanced.publicId);

    try {
      await submitCustomPosterOrder(formData);
      setSubmitted(true);
      setFile(null);
      setFilePreview(null);
      setImageLink("");
      setEnhanced(null);
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
      <p className="mt-3 max-w-lg text-white/65">
        Upload your own image or paste a link to one, pick a size, and we'll print it — same rates as every other poster on XPOSTERS.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="poster-frame relative flex aspect-[3/4] items-center justify-center overflow-hidden">
            {enhanced ? (
              <img
                src={enhanced.url}
                alt="Your enhanced poster preview"
                className={`h-full w-full object-contain ${previewLoaded ? "loaded" : ""}`}
                onLoad={() => setPreviewLoaded(true)}
              />
            ) : mode === "upload" && filePreview ? (
              <img
                src={filePreview}
                alt="Your poster preview"
                className={`h-full w-full object-contain ${previewLoaded ? "loaded" : ""}`}
                onLoad={() => setPreviewLoaded(true)}
              />
            ) : mode === "link" && imageLink.trim() ? (
              <img
                src={imageLink.trim()}
                alt="Your poster preview"
                className={`h-full w-full object-contain ${previewLoaded ? "loaded" : ""}`}
                onLoad={() => setPreviewLoaded(true)}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span className="poster-fallback">Your poster will appear here</span>
            )}
            {enhancing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 text-center">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--xp-accent)] border-t-transparent" />
                <p className="px-6 text-sm text-[var(--xp-accent-bright)]">
                  Enhancing to print quality for {selectedSize.label}…
                </p>
              </div>
            )}
          </div>
          {enhanced && !enhancing && (
            <p className="mt-3 border border-[var(--xp-accent-dim)] bg-[var(--xp-accent)]/10 px-3 py-2 text-xs text-[var(--xp-accent-bright)]">
              ✓ Print-ready {selectedSize.label} · {enhanced.width}×{enhanced.height}px at {enhanced.dpi} DPI
              {enhanced.upscaled
                ? ` (enhanced from ${enhanced.originalWidth}×${enhanced.originalHeight}px)`
                : " (already high quality)"}
            </p>
          )}
          {enhanceError && !enhancing && <p className="mt-3 text-xs text-white/70">{enhanceError}</p>}
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
                onChange={(e) => {
                  setPreviewLoaded(false);
                  setImageLink(e.target.value);
                }}
                className="mt-3 w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
              />
            )}
            {errors.image && <p className="mt-1 text-xs text-white/70">{errors.image}</p>}
            <p className="mt-2 text-xs text-white/60">
              Any quality works - we automatically enhance your image to print-ready quality for the size you pick below.
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs text-white/60">Size</p>
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
              <label className="mb-1 block text-xs text-white/60" htmlFor="cp-name">
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
              <label className="mb-1 block text-xs text-white/60" htmlFor="cp-email">
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
              <label className="mb-1 block text-xs text-white/60" htmlFor="cp-phone">
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
              <label className="mb-1 block text-xs text-white/60" htmlFor="cp-address">
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
              <label className="mb-1 block text-xs text-white/60" htmlFor="cp-notes">
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
              disabled={submitting || enhancing}
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
