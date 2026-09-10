import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-20 text-center">
      <h1 className="font-display text-6xl">404</h1>
      <p className="mt-4 text-white/60">This page doesn't exist.</p>
      <Link to="/" className="mt-8 border border-white px-8 py-3 text-sm transition-colors hover:bg-white hover:text-black">
        Back home
      </Link>
    </div>
  );
}
