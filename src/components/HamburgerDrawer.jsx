import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES, CATEGORY_TITLES } from "../data/categories.js";
import { fetchCollectionsSummary } from "../api/products.js";
import { optimizedImage } from "../utils/cloudinaryUrl.js";
import wallData from "../data/wallSetups.json";

const WHATSAPP_HREF = `https://wa.me/919042574899?text=${encodeURIComponent("Hi XPOSTERS! I need help choosing posters for my wall.")}`;
const MOODS = Object.entries(wallData.moods || {}).filter(([k]) => wallData.setups.some((w) => w.mood === k));
const WALL_COUNT = wallData.setups.length;

// Covers + poster counts for each category, fetched once when the menu is
// first opened and kept for the rest of the visit.
let summaryCache = null;

export default function HamburgerDrawer({ open, onClose }) {
  const [summary, setSummary] = useState(summaryCache);

  useEffect(() => {
    if (!open || summaryCache) return;
    let cancelled = false;
    fetchCollectionsSummary()
      .then((data) => {
        summaryCache = data;
        if (!cancelled) setSummary(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Hide collections that have no posters yet (once we know the counts).
  const cats = CATEGORIES.filter((c) => c.slug !== "customizable-posters" && (!summary || summary[c.slug]?.count > 0));
  const stagger = (i) => (open ? { animationDelay: `${0.05 + i * 0.035}s` } : undefined);
  const item = open ? "drawer-item" : "opacity-0";

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[88vw] max-w-[380px] flex-col overflow-hidden border-r border-[var(--xp-border)] bg-[var(--xp-bg-elevated)] shadow-[20px_0_60px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
        aria-label="Menu"
      >
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(201,162,76,0.22)_0%,transparent_65%)]"
          aria-hidden="true"
        />

        {/* top bar */}
        <div className="relative flex items-center justify-between px-5 pb-3 pt-5">
          <Link to="/" onClick={onClose} aria-label="XPOSTERS home">
            <img src="/logo-mark.webp" alt="XPOSTERS" width="90" height="32" className="h-7 w-auto" />
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--xp-border-strong)] text-sm transition-colors hover:border-[var(--xp-accent)] hover:text-[var(--xp-accent-bright)]"
          >
            ✕
          </button>
        </div>

        <nav className="relative flex-1 overflow-y-auto px-5 pb-4">
          {/* deal strip */}
          <Link
            to="/collections"
            onClick={onClose}
            className={`${item} deal-shine relative flex items-center justify-between gap-3 overflow-hidden rounded-xl bg-[linear-gradient(110deg,#c9a24c,#e7c873_55%,#c9a24c)] px-4 py-3 text-[#0c0b09]`}
            style={stagger(0)}
          >
            <span>
              <span className="block font-display text-xl leading-none">Buy 2 Get 1 Free</span>
              <span className="mt-1 block text-[11px] font-semibold opacity-80">On every poster · every size</span>
            </span>
            <span className="shrink-0 rounded-full bg-[#0c0b09] px-2.5 py-1 text-[10px] font-bold text-[var(--xp-accent-bright)]">⚡ 59 min Chennai</span>
          </Link>

          {/* walls */}
          <p className={`${item} mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45`} style={stagger(1)}>
            Walls
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            <Link
              to={{ pathname: "/", hash: "#wall-setups" }}
              onClick={onClose}
              className={`${item} group relative block overflow-hidden rounded-xl ring-1 ring-white/10`}
              style={stagger(2)}
            >
              <img src="/walls/thala-dhoni-300.webp" alt="" width="300" height="300" loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-2.5">
                <span className="block font-display text-lg leading-none text-white">Steal the Look</span>
                <span className="mt-1 block text-[10px] text-[var(--xp-accent-bright)]">{WALL_COUNT} ready-made walls →</span>
              </span>
            </Link>
            <Link
              to={{ pathname: "/", hash: "#build-your-wall" }}
              onClick={onClose}
              className={`${item} group relative block overflow-hidden rounded-xl ring-1 ring-white/10`}
              style={stagger(3)}
            >
              <img src="/walls/late-night-feels-300.webp" alt="" width="300" height="300" loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <span className="absolute left-2 top-2 rounded-full bg-[var(--xp-accent)] px-2 py-0.5 text-[9px] font-bold text-[#0c0b09]">NEW</span>
              <span className="absolute inset-x-0 bottom-0 p-2.5">
                <span className="block font-display text-lg leading-none text-white">Your Wall, Your Rules</span>
                <span className="mt-1 block text-[10px] text-[var(--xp-accent-bright)]">Build your own →</span>
              </span>
            </Link>
          </div>

          {/* moods */}
          {MOODS.length > 0 && (
            <>
              <p className={`${item} mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45`} style={stagger(4)}>
                Shop by mood
              </p>
              <div className={`${item} mt-2 flex flex-wrap gap-1.5`} style={stagger(5)}>
                {MOODS.map(([key, m]) => (
                  <Link
                    key={key}
                    to={{ pathname: "/", search: `?mood=${key}`, hash: "#wall-setups" }}
                    onClick={onClose}
                    className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs text-white/85 transition-colors hover:border-[var(--xp-accent)] hover:text-[var(--xp-accent-bright)]"
                  >
                    {m.emoji} {m.label}
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* collections */}
          <p className={`${item} mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45`} style={stagger(6)}>
            Collections
          </p>
          <ul className="mt-1">
            {cats.map((cat, i) => {
              const info = summary?.[cat.slug];
              return (
                <li key={cat.slug} className={item} style={stagger(7 + i)}>
                  <Link
                    to={`/collections/${cat.slug}`}
                    onClick={onClose}
                    className="group flex items-center gap-3 border-b border-[var(--xp-border)] py-2.5"
                  >
                    <span className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-white/5 ring-1 ring-white/10">
                      {info?.cover && (
                        <img src={optimizedImage(info.cover, 80)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-white transition-colors group-hover:text-[var(--xp-accent-bright)]">{cat.name}</span>
                      <span className="block truncate text-[11px] text-white/50">
                        <span className="text-[var(--xp-accent-bright)]/90">{CATEGORY_TITLES[cat.slug]}</span>
                        {info?.count ? ` · ${info.count} posters` : ""}
                      </span>
                    </span>
                    <span className="text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--xp-accent-bright)]" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* own photo */}
          <Link
            to="/collections/customizable-posters"
            onClick={onClose}
            className={`${item} mt-4 flex items-center gap-3 rounded-xl border border-dashed border-[var(--xp-accent)] bg-[var(--xp-accent)]/10 px-3 py-3`}
            style={stagger(7 + cats.length)}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--xp-accent)] text-xl">📷</span>
            <span>
              <span className="block text-sm font-semibold text-[var(--xp-accent-bright)]">Your Photo, Our Print</span>
              <span className="block text-[11px] text-white/60">Upload any picture or Pinterest pin - same price</span>
            </span>
          </Link>
        </nav>

        <div className="relative grid grid-cols-[1fr_auto] gap-2 border-t border-[var(--xp-border)] px-5 py-4">
          <Link to="/collections" onClick={onClose} className="btn-primary block py-3 text-center text-sm font-semibold">
            View all collections
          </Link>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            className="grid w-12 place-items-center rounded-sm border border-[var(--xp-border-strong)] text-lg transition-colors hover:border-[#25D366]"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#25D366" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2z" />
            </svg>
          </a>
        </div>
      </aside>
    </>
  );
}
