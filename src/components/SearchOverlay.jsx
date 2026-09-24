import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProducts } from "../api/products.js";
import { optimizedImage } from "../utils/cloudinaryUrl.js";

export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const requestId = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Live suggestions as you type, debounced so a request isn't fired on
  // every keystroke. Each request carries an id so a slow older response
  // can never overwrite what a newer one already set.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++requestId.current;
    const t = setTimeout(() => {
      fetchProducts({ q, limit: 6 })
        .then((data) => {
          if (requestId.current !== id) return;
          setSuggestions(data.products || []);
        })
        .catch(() => {
          if (requestId.current === id) setSuggestions([]);
        })
        .finally(() => {
          if (requestId.current === id) setLoading(false);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  function goToProduct(product) {
    setQuery("");
    setSuggestions([]);
    onClose();
    navigate(`/product/${product.id}`);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      goToProduct(suggestions[activeIndex]);
      return;
    }
    const q = query.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setQuery("");
    setSuggestions([]);
    onClose();
  }

  function handleKeyDown(e) {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setSuggestions([]);
    }
  }

  function handleClose() {
    setQuery("");
    setSuggestions([]);
    onClose();
  }

  if (!open) return null;

  const showDropdown = query.trim().length >= 2;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--xp-bg)]/[0.98] backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-[var(--xp-border)] px-5 py-5">
        <span className="font-display text-xl">SEARCH</span>
        <button
          onClick={handleClose}
          aria-label="Close search"
          className="grid h-9 w-9 place-items-center border border-[var(--xp-border-strong)] text-lg transition-colors hover:border-[var(--xp-accent)] hover:text-[var(--xp-accent-bright)]"
        >
          ✕
        </button>
      </div>
      <form onSubmit={handleSubmit} className="mx-auto mt-16 w-full max-w-xl px-5">
        <div className="flex items-center gap-3 border-b-2 border-[var(--xp-accent)] pb-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search posters..."
            autoComplete="off"
            className="w-full bg-transparent text-2xl outline-none placeholder:text-white/30"
          />
          <button type="submit" className="btn-primary shrink-0 px-4 py-2 text-sm">
            Go
          </button>
        </div>

        {showDropdown && (
          <div className="mt-2 max-h-[60vh] overflow-y-auto border border-[var(--xp-border)] bg-[var(--xp-bg-elevated)]">
            {loading && suggestions.length === 0 && (
              <p className="px-4 py-4 text-sm text-white/40">Searching...</p>
            )}

            {!loading && suggestions.length === 0 && (
              <p className="px-4 py-4 text-sm text-white/40">No posters match &quot;{query.trim()}&quot;.</p>
            )}

            {suggestions.map((product, i) => (
              <button
                key={product.id}
                type="button"
                onClick={() => goToProduct(product)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex w-full items-center gap-3 border-b border-[var(--xp-border)] px-4 py-3 text-left transition-colors last:border-b-0 ${
                  activeIndex === i ? "bg-white/5" : ""
                }`}
              >
                <img
                  src={optimizedImage(product.image, 80)}
                  alt=""
                  className="h-12 w-9 shrink-0 object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-[var(--xp-white)]">{product.name}</span>
                  <span className="text-xs text-[var(--xp-accent)]/80">₹{product.price}</span>
                </span>
              </button>
            ))}

            {suggestions.length > 0 && (
              <button
                type="submit"
                onMouseEnter={() => setActiveIndex(-1)}
                className="block w-full border-t border-[var(--xp-border)] px-4 py-3 text-left text-sm text-white/60 transition-colors hover:text-white"
              >
                See all results for &quot;{query.trim()}&quot;
              </button>
            )}
          </div>
        )}

        <p className="mt-4 text-sm text-white/40">Search by poster name or category — try "anime" or "motivational".</p>
      </form>
    </div>
  );
}
