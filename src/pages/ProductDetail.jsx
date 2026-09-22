import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { fetchProduct, fetchRelatedProducts, submitReview, averageRating } from "../api/products.js";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import PosterImage from "../components/PosterImage.jsx";
import ProductCard from "../components/ProductCard.jsx";
import StarRating from "../components/StarRating.jsx";

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [added, setAdded] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: "", rating: 5, comment: "" });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  if (notFound) {
    return <Navigate to="/collections" replace />;
  }

  if (loading || !product) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-20 text-center text-sm text-white/40">Loading poster…</div>
    );
  }

  const avgRating = averageRating(product);
  const wishlisted = isWishlisted(product.id);

  function handleAddToCart() {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
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
      setTimeout(() => setReviewSubmitted(false), 2500);
    } catch {
      setReviewError("Couldn't post that review — try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="md:sticky md:top-24 md:self-start">
          <PosterImage src={product.image} alt={product.name} aspect="aspect-[3/4]" width={800} />
        </div>

        <div>
          <Link to={`/collections/${product.category}`} className="text-xs text-white/40 transition-colors hover:text-white">
            ← Back to category
          </Link>
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{product.name}</h1>

          <div className="mt-3 flex items-center gap-2">
            <StarRating value={avgRating} />
            <span className="text-sm text-white/40">
              {avgRating.toFixed(1)} ({product.reviews.length} {product.reviews.length === 1 ? "review" : "reviews"})
            </span>
          </div>

          <p className="mt-5 text-2xl">₹{product.price}</p>
          {product.description && (
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">{product.description}</p>
          )}

          <div className="mt-8 flex gap-3">
            <button
              onClick={handleAddToCart}
              className="btn-primary flex-1 py-3.5 text-sm font-medium"
            >
              {added ? "Added ✓" : "Add to Cart"}
            </button>
            <button
              onClick={() => toggleWishlist(product.id)}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={wishlisted}
              className={`grid h-[50px] w-14 shrink-0 place-items-center border transition-colors ${
                wishlisted ? "border-[var(--xp-accent)] bg-[var(--xp-accent)] text-[#0c0b09]" : "border-[var(--xp-border-strong)] hover:border-[var(--xp-accent)] hover:text-[var(--xp-accent-bright)]"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
                <path d="M12 20.5s-7.5-4.6-10-9.3C0.3 7.8 2 4 5.8 4c2.2 0 3.7 1.2 4.4 2.4C10.9 5.2 12.4 4 14.6 4 18.4 4 20 7.8 18.3 11.2 15.8 15.9 12 20.5 12 20.5Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Ratings & reviews */}
      <section className="mt-20 border-t border-[var(--xp-border)] pt-12">
        <h2 className="font-display text-2xl sm:text-3xl">Ratings &amp; Reviews</h2>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-3xl">{avgRating.toFixed(1)}</span>
          <div>
            <StarRating value={avgRating} size="text-base" />
            <p className="text-xs text-white/40">
              {product.reviews.length} {product.reviews.length === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <ul className="space-y-6">
            {product.reviews.length === 0 && <p className="text-sm text-white/40">No reviews yet — be the first.</p>}
            {product.reviews.map((r) => (
              <li key={r.id} className="border-b border-[var(--xp-border)] pb-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{r.name}</p>
                  <StarRating value={r.rating} />
                </div>
                <p className="mt-2 text-sm text-white/60">{r.comment}</p>
              </li>
            ))}
          </ul>

          <form onSubmit={handleReviewSubmit} className="space-y-4 border border-[var(--xp-border)] p-6">
            <p className="text-sm text-white/40">Leave a review</p>
            <div>
              <label className="mb-1 block text-xs text-white/40" htmlFor="review-name">
                Name
              </label>
              <input
                id="review-name"
                type="text"
                required
                value={reviewForm.name}
                onChange={(e) => setReviewForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/40" htmlFor="review-rating">
                Rating
              </label>
              <select
                id="review-rating"
                value={reviewForm.rating}
                onChange={(e) => setReviewForm((f) => ({ ...f, rating: e.target.value }))}
                className="w-full border border-[var(--xp-border-strong)] bg-[var(--xp-bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/40" htmlFor="review-comment">
                Comment
              </label>
              <textarea
                id="review-comment"
                required
                rows={3}
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                className="w-full resize-none border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
              />
            </div>
            {reviewError && <p className="text-xs text-white/70">{reviewError}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-2.5 text-sm font-medium"
            >
              {submitting ? "Posting…" : reviewSubmitted ? "Thanks — review posted ✓" : "Submit review"}
            </button>
          </form>
        </div>
      </section>

      {/* You may also like */}
      {related.length > 0 && (
        <section className="mt-20 border-t border-[var(--xp-border)] pt-12">
          <h2 className="font-display text-2xl sm:text-3xl">You may also like</h2>
          <div className="rail mt-6 flex gap-4 overflow-x-auto pb-2">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}