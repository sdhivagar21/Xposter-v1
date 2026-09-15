// Renders a 0-5 star rating using weight/fill instead of color, per the
// grayscale-only design constraint (no colored star accents).
export default function StarRating({ value = 0, size = "text-sm" }) {
  const rounded = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-0.5 ${size}`} aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? "text-[var(--xp-accent)]" : "text-white/20"}>
          ★
        </span>
      ))}
    </span>
  );
}
