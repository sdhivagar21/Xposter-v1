import { Link } from "react-router-dom";

export default function CategoryChip({ slug, name }) {
  return (
    <Link
      to={`/collections/${slug}`}
      className="shrink-0 whitespace-nowrap border border-[var(--xp-border-strong)] px-4 py-2 text-sm transition-colors hover:border-[var(--xp-accent)] hover:text-[var(--xp-accent-bright)]"
    >
      {name}
    </Link>
  );
}
