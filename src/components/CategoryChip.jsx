import { Link } from "react-router-dom";

export default function CategoryChip({ slug, name }) {
  return (
    <Link
      to={`/collections/${slug}`}
      className="shrink-0 whitespace-nowrap border border-white/25 px-4 py-2 text-sm transition-colors hover:border-white hover:bg-white hover:text-black"
    >
      {name}
    </Link>
  );
}
