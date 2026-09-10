import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  function handleSubmit(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setQuery("");
    onClose();
  }

  function handleClose() {
    setQuery("");
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]/98 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <span className="font-display text-xl">SEARCH</span>
        <button
          onClick={handleClose}
          aria-label="Close search"
          className="grid h-9 w-9 place-items-center border border-white/20 text-lg transition-colors hover:bg-white hover:text-black"
        >
          ✕
        </button>
      </div>
      <form onSubmit={handleSubmit} className="mx-auto mt-16 w-full max-w-xl px-5">
        <div className="flex items-center gap-3 border-b-2 border-white pb-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posters..."
            className="w-full bg-transparent text-2xl outline-none placeholder:text-white/30"
          />
          <button type="submit" className="shrink-0 border border-white px-4 py-2 text-sm transition-colors hover:bg-white hover:text-black">
            Go
          </button>
        </div>
        <p className="mt-4 text-sm text-white/40">Try "Vaathi", "Gotham", or a category name.</p>
      </form>
    </div>
  );
}
