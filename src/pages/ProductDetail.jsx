import { useEffect, useRef, useState } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { fetchProduct, fetchRelatedProducts, submitReview, averageRating } from "../api/products.js";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { SIZES, PACK_DEALS, BULK_DISCOUNT, getCategoryName, getSizeBySlug } from "../data/categories.js";
import PosterImage from "../components/PosterImage.jsx";
import ProductCard from "../components/ProductCard.jsx";
import StarRating from "../components/StarRating.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import DealMeter from "../components/DealMeter.jsx";

const INPUT_CLASS =
  "w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]";

function HeartIcon({ filled, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-10-9.3C0.3 7.8 2 4 5.8 4c2.2 0 3.7 1.2 4.4 2.4C10.9 5.2 12.4 4 14.6 4 18.4 4 20 7.8 18.3 11.2 15.8 15.9 12 20.5 12 20.5Z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="19.5" r="1.3" />
      <circle cx="17" cy="19.5" r="1.3" />
    </svg>
  );
}

function Perk({ icon, title, text, highlight = false }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${highlight ? "bg-[var(--xp-accent)]/10" : ""}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center border border-[var(--xp-accent-dim)] text-lg" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${highlight ? "text-[var(--xp-accent-bright)]" : "text-[var(--xp-white)]"}`}>{title}</p>
        <p className="text-xs text-white/60">{text}</p>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, setDrawerOpen, itemCount } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);

  const [added, setAdded] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: "", rating: 5, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Phones get a buy bar pinned to the bottom of the screen whenever the
  // main Add to Cart button isn't in view, so buying is always one tap away.
  const buyRef = useRef(null);
  const [barVisible, setBarVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    fetchProduct(id)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        return fetchRelatedProducts(id);
      })
      .then((relatedData) => {
        if (!cancelled && relatedData) setRelated(relatedData);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const el = buyRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setBarVisible(!entry.isIntersecting), { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [product, loading]);

  // Lift the WhatsApp button above the buy bar while it's showing on phones.
  useEffect(() => {
    const root = document.documentElement;
    const phone = window.matchMedia?.("(max-width: 767px)").matches;
    root.style.setProperty("--fab-lift", barVisible && phone ? "76px" : "0px");
    return () => root.style.removeProperty("--fab-lift");
  }, [barVisible]);

  if (notFound) {
    return <Navigate to="/collections" replace />;
  }

  if (loading || !product) {
    return <LoadingScreen />;
  }

  const avgRating = averageRating(product);
  const wishlisted = isWishlisted(product.id);
  const reviewCount = product.reviews.length;

  function handleAddToCart() {
    addToCart(product, 1, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    addToCart(product, 1, selectedSize);
    setDrawerOpen(false);
    navigate("/checkout");
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) return;
    setSubmitting(true);
    setReviewError(null);
    try {
      const updated = await submitReview(product.id, {
        name: reviewForm.name.trim(),
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
      });
      setProduct(updated);
      setReviewForm({ name: "", rating: 5, comment: "" });
      setReviewSubmitted(true);
      setShowReviewForm(false);
      setTimeout(() => setReviewSubmitted(false), 2500);
    } catch {
      setReviewError("Couldn't post that review — try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-32 pt-4 sm:px-5 md:pb-16 md:pt-8">
      <nav className="mb-4 flex items-center gap-2 text-xs text-white/50" aria-label="Breadcrumb">
        <Link to="/" className="transition-colors hover:text-white">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link to={`/collections/${product.category}`} className="truncate transition-colors hover:text-white">
          {getCategoryName(product.category)}
        </Link>
      </nav>

      {/* Phones: title → poster → buy box. Desktop: poster on the left
          (sticky), title + buy box side by side with it. */}
      <div className="grid gap-x-12 gap-y-4 md:grid-cols-2 md:grid-rows-[auto_1fr]">
        <header className="md:col-start-2 md:row-start-1">
          <h1 className="font-display text-3xl leading-[1.05] sm:text-4xl lg:text-5xl">{product.name}</h1>
          <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-xs text-white/60 transition-colors hover:text-white">
            <StarRating value={avgRating} />
            {reviewCount > 0 ? `${avgRating.toFixed(1)} · ${reviewCount} review${reviewCount === 1 ? "" : "s"}` : "Be the first to review"}
          </a>
        </header>

        <div className="md:sticky md:top-24 md:col-start-1 md:row-span-2 md:row-start-1 md:self-start">
          <div className="relative mx-auto w-[min(100%,38svh)] min-w-[240px] md:w-full md:max-w-[460px]">
            <div
              className="pointer-events-none absolute -inset-8 bg-[radial-gradient(circle,rgba(201,162,76,0.22)_0%,transparent_65%)]"
              aria-hidden="true"
            />
            <div className="relative shadow-[0_30px_60px_-24px_rgba(0,0,0,0.95)]">
              <PosterImage src={product.image} alt={product.name} aspect="aspect-[3/4]" width={800} priority />
            </div>
            <span className="deal-shine absolute -left-2 top-4 bg-[var(--xp-accent)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0c0b09] shadow-[0_6px_18px_rgba(0,0,0,0.5)]">
              Buy 2 Get 1 Free
            </span>
            <button
              onClick={() => toggleWishlist(product.id)}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={wishlisted}
              className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border backdrop-blur transition-colors ${
                wishlisted
                  ? "border-[var(--xp-accent)] bg-[var(--xp-accent)] text-[#0c0b09]"
                  : "border-white/25 bg-black/55 text-white hover:border-[var(--xp-accent)] hover:text-[var(--xp-accent-bright)]"
              }`}
            >
              <HeartIcon filled={wishlisted} size={18} />
            </button>
            <span className="absolute bottom-3 left-3 bg-black/65 px-2 py-1 text-[11px] text-white/85 backdrop-blur">
              {selectedSize.label} · {selectedSize.dimensions}
            </span>
          </div>
        </div>

        <div className="md:col-start-2 md:row-start-2">
          <div className="flex items-end gap-3">
            <span className="font-display text-4xl leading-none">₹{selectedSize.price}</span>
            <span className="pb-0.5 text-xs text-white/55">per {selectedSize.label} poster</span>
          </div>
          <p className="mt-1.5 text-xs font-medium text-[var(--xp-accent-bright)]">
            Add any 3 posters, pay for 2 — the most affordable one is FREE
          </p>

          <div className="mt-5">
            <p className="mb-2 text-xs text-white/60">Choose size</p>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Poster size">
              {SIZES.map((s) => {
                const active = selectedSize.slug === s.slug;
                return (
                  <button
                    key={s.slug}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelectedSize(s)}
                    className={`border px-2 py-2.5 text-center transition-all ${
                      active
                        ? "border-[var(--xp-accent-bright)] bg-[var(--xp-accent)] text-[#0c0b09] shadow-[0_0_18px_rgba(201,162,76,0.3)]"
                        : "border-[var(--xp-border-strong)] hover:border-[var(--xp-accent)] hover:text-[var(--xp-accent-bright)]"
                    }`}
                  >
                    <span className="block font-display text-xl leading-none">{s.label}</span>
                    <span className={`mt-1 block text-xs ${active ? "font-semibold" : "text-white/70"}`}>₹{s.price}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div ref={buyRef} className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              onClick={handleAddToCart}
              className="btn-primary flex items-center justify-center gap-2 py-3.5 text-sm font-semibold"
            >
              {added ? (
                "Added ✓"
              ) : (
                <>
                  <CartIcon /> Add to cart
                </>
              )}
            </button>
            <button onClick={handleBuyNow} className="btn-outline py-3.5 text-sm font-semibold">
              Buy now
            </button>
          </div>

          {itemCount > 0 && <DealMeter className="mt-4" />}

          <div className="mt-4 divide-y divide-[var(--xp-border)] border border-[var(--xp-border)]">
            <Perk icon="🎁" title="Buy 2 Get 1 FREE" text="Mix any posters & sizes — the most affordable of every 3 is free" highlight />
            <Perk icon="⚡" title="59-min delivery in Chennai" text="₹150 · ₹100 from ₹200 · FREE above ₹300" />
            <Perk icon="🚚" title="Free delivery all over Tamil Nadu" text="Arrives in 3–5 days" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
            {PACK_DEALS.map((d) => (
              <span key={d.size} className="border border-[var(--xp-accent-dim)] px-2 py-1 text-white/75">
                {d.qty} {getSizeBySlug(d.size)?.label} for ₹{d.price}
              </span>
            ))}
            <span className="border border-[var(--xp-accent-dim)] px-2 py-1 text-white/75">
              3+ A3 · {Math.round(BULK_DISCOUNT.percent)}% off
            </span>
            <span className="text-white/45">Best deal applied automatically</span>
          </div>

          {product.description && <p className="mt-5 text-sm leading-relaxed text-white/60">{product.description}</p>}
        </div>
      </div>

      {/* Ratings & reviews */}
      <section id="reviews" className="mt-14 scroll-mt-24 border-t border-[var(--xp-border)] pt-10 md:mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl">Reviews</h2>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl">{avgRating.toFixed(1)}</span>
              <StarRating value={avgRating} size="text-base" />
              <span className="text-xs text-white/60">({reviewCount})</span>
            </div>
          </div>
          {!showReviewForm && (
            <button onClick={() => setShowReviewForm(true)} className="btn-outline px-4 py-2 text-xs font-medium">
              {reviewSubmitted ? "Thanks — review posted ✓" : "Write a review"}
            </button>
          )}
        </div>

        <div className={`mt-6 grid gap-8 ${showReviewForm ? "md:grid-cols-2" : ""}`}>
          {reviewCount === 0 ? (
            <p className="text-sm text-white/60">No reviews yet — be the first.</p>
          ) : (
            <ul className={`grid gap-3 ${showReviewForm ? "" : "sm:grid-cols-2"}`}>
              {product.reviews.map((r) => (
                <li key={r.id} className="border border-[var(--xp-border)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <StarRating value={r.rating} />
                  </div>
                  <p className="mt-2 text-sm text-white/60">{r.comment}</p>
                </li>
              ))}
            </ul>
          )}

          {showReviewForm && (
            <form onSubmit={handleReviewSubmit} className="space-y-4 border border-[var(--xp-border)] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/60">Leave a review</p>
                <button type="button" onClick={() => setShowReviewForm(false)} className="text-xs text-white/50 hover:text-white">
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div>
                  <label className="mb-1 block text-xs text-white/60" htmlFor="review-name">
                    Name
                  </label>
                  <input
                    id="review-name"
                    type="text"
                    required
                    value={reviewForm.name}
                    onChange={(e) => setReviewForm((f) => ({ ...f, name: e.target.value }))}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/60" htmlFor="review-rating">
                    Rating
                  </label>
                  <select
                    id="review-rating"
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm((f) => ({ ...f, rating: e.target.value }))}
                    className="border border-[var(--xp-border-strong)] bg-[var(--xp-bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} ★
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/60" htmlFor="review-comment">
                  Comment
                </label>
                <textarea
                  id="review-comment"
                  required
                  rows={3}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                  className={`${INPUT_CLASS} resize-none`}
                />
              </div>
              {reviewError && <p role="alert" className="alert-error">{reviewError}</p>}
              <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5 text-sm font-medium">
                {submitting ? "Posting…" : "Submit review"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* You may also like */}
      {related.length > 0 && (
        <section className="mt-14 border-t border-[var(--xp-border)] pt-10 md:mt-20">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl sm:text-3xl">You may also like</h2>
            <span className="text-xs text-[var(--xp-accent-bright)]">Pick 3 → 1 free</span>
          </div>
          <div className="rail mt-6 flex gap-4 overflow-x-auto pb-2">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Phone buy bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--xp-border-strong)] bg-[#0c0b09]/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_rgba(0,0,0,0.6)] backdrop-blur transition-transform duration-300 md:hidden ${
          barVisible ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        aria-hidden={!barVisible}
      >
        <div className="flex items-center gap-2">
          <PosterImage src={product.image} alt="" aspect="aspect-[3/4]" className="w-9 shrink-0" width={90} />
          <div className="flex shrink-0 border border-[var(--xp-border-strong)]" role="radiogroup" aria-label="Poster size">
            {SIZES.map((s) => {
              const active = selectedSize.slug === s.slug;
              return (
                <button
                  key={s.slug}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={barVisible ? 0 : -1}
                  onClick={() => setSelectedSize(s)}
                  className={`w-10 py-2 text-xs font-semibold transition-colors ${
                    active ? "bg-[var(--xp-accent)] text-[#0c0b09]" : "text-white/70"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleAddToCart}
            tabIndex={barVisible ? 0 : -1}
            className="btn-primary flex min-w-0 flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-semibold"
          >
            {added ? (
              "Added ✓"
            ) : (
              <>
                <CartIcon /> Add · ₹{selectedSize.price}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
