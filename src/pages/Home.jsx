import { Link, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, CATEGORY_TITLES, computeCartTotals, getSizeBySlug } from "../data/categories.js";
import { fetchHomeSections, fetchFeaturedProducts, fetchProducts } from "../api/products.js";
import CategoryChip from "../components/CategoryChip.jsx";
import ProductCard from "../components/ProductCard.jsx";
import PosterImage from "../components/PosterImage.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { sortTamilMovies } from "../utils/tamilMoviesOrder.js";
import snapshot from "../data/homeSnapshot.json";
import wallData from "../data/wallSetups.json";
import { useCart } from "../context/CartContext.jsx";
import { flyToCart } from "../components/DealCelebration.jsx";
import { optimizedImage } from "../utils/cloudinaryUrl.js";
import { enhanceCustomImage } from "../api/orders.js";
import { fitForUpload } from "../api/client.js";

// The snapshot (saved at build time) lets the first paint already show real
// posters; the live API response then replaces it a moment later.
function splitRows(list) {
  const mid = Math.ceil(list.length / 2);
  return { rowA: list.slice(0, mid), rowB: list.slice(mid) };
}
const HAS_SNAPSHOT = Object.keys(snapshot.sections || {}).length > 0;

// ---------------------------------------------------------------------------
// Wall setups: ready-made walls of posters in mixed sizes (and a few split
// posters - one poster printed as 2-3 side-by-side panels), each shown on a
// wall in a room. The pictures are pre-made from the real posters
// (public/walls/<slug>-300|480|800.webp); the poster list for each wall lives in
// data/wallSetups.json, so a whole wall goes in the cart in one tap.
const WALLS = wallData.setups.map((w) => ({
  ...w,
  posters: w.posters.map((p) => ({ ...p, image: wallData.base + p.image })),
  pieces: w.posters.reduce((n, p) => n + (p.split || 1), 0),
}));
// Walls are grouped by the feeling they give a room (data/wallSetups.json "moods").
const MOODS = wallData.moods || {};
const MOOD_KEYS = Object.keys(MOODS).filter((k) => WALLS.some((w) => w.mood === k));
const WALL_ROW_A = WALLS.filter((_, i) => i % 2 === 0);
const WALL_ROW_B = WALLS.filter((_, i) => i % 2 === 1);
const wallImg = (slug, w) => `/walls/${slug}-${w}.webp`;

// What the whole wall costs with the best deal applied (Buy 2 Get 1 etc.).
function wallTotals(wall) {
  return computeCartTotals(
    wall.posters.map((p, i) => {
      const size = getSizeBySlug(p.size);
      return { key: `${p.id}-${i}`, size: p.size, price: size.price, qty: p.split || 1 };
    })
  );
}

function sizeMix(wall) {
  const counts = {};
  for (const p of wall.posters) counts[p.size] = (counts[p.size] || 0) + (p.split || 1);
  return ["a3", "a4", "a5"].filter((k) => counts[k]).map((k) => `${counts[k]} × ${k.toUpperCase()}`).join(" · ");
}

function WallTile({ wall, onOpen, priority = false, hidden = false }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(wall)}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden || undefined}
      aria-label={hidden ? undefined : `${wall.title} - ${wall.pieces} posters`}
      className="group relative w-40 shrink-0 overflow-hidden rounded-2xl sm:w-56"
    >
      <img
        src={wallImg(wall.slug, 300)}
        srcSet={`${wallImg(wall.slug, 300)} 300w, ${wallImg(wall.slug, 480)} 480w`}
        sizes="(min-width: 640px) 224px, 160px"
        alt=""
        width="300"
        height="300"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2.5 pb-2 pt-6 text-left">
        <span className="block truncate text-[11px] font-semibold text-white sm:text-xs">{wall.title}</span>
        <span className="block text-[10px] text-[var(--xp-accent-bright)] sm:text-[11px]">{wall.pieces} posters · tap to get it</span>
      </span>
    </button>
  );
}

function WallMarquee({ walls, direction, onOpen, priority = false }) {
  const anim = direction === "left" ? "animate-marquee-left" : "animate-marquee-right";
  return (
    <div className="marquee-row overflow-hidden">
      <div className={`flex w-max gap-3 ${anim}`}>
        {[...walls, ...walls].map((wall, i) => (
          <WallTile key={`${wall.slug}-${i}`} wall={wall} onOpen={onOpen} priority={priority && i < 3} hidden={i >= walls.length} />
        ))}
      </div>
    </div>
  );
}

// The "get this wall" sheet: the room picture, every poster in it with its
// size, the price with the deal applied, and one button for all of it.
function WallSheet({ wall, onClose, onCustomise }) {
  const { addManyToCart } = useCart();
  const totals = useMemo(() => wallTotals(wall), [wall]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function addAll(e) {
    const entries = wall.posters.map((p) => ({
      product: { id: p.id, name: p.name, image: p.image, split: p.split },
      size: getSizeBySlug(p.size),
    }));
    const from = e.currentTarget;
    onClose();
    flyToCart({ from, image: wallImg(wall.slug, 300), onArrive: () => addManyToCart(entries) });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose} role="dialog" aria-modal="true" aria-label={wall.title}>
      <div
        className="animate-modal-pop relative flex max-h-[92svh] w-full max-w-[60rem] flex-col overflow-hidden border border-[var(--xp-border-strong)] bg-[var(--xp-bg-elevated)] sm:grid sm:h-[min(30rem,88svh)] sm:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-sm text-white backdrop-blur">
          ✕
        </button>
        <img
          src={wallImg(wall.slug, 800)}
          srcSet={`${wallImg(wall.slug, 480)} 480w, ${wallImg(wall.slug, 800)} 800w`}
          sizes="(min-width: 640px) 480px, 100vw"
          alt={`${wall.title} on a wall`}
          className="aspect-[4/3] w-full object-cover object-[50%_55%] sm:aspect-auto sm:h-full"
        />
        <div className="flex min-h-0 flex-col">
          <div className="px-5 pt-4">
            <h2 className="font-display text-2xl leading-tight sm:text-3xl">{wall.title}</h2>
            <p className="mt-1 text-xs text-white/60">
              {wall.pieces} posters · {sizeMix(wall)}
            </p>
          </div>
          <ul className="mt-3 grid min-h-0 flex-1 grid-cols-4 content-start gap-2 overflow-y-auto px-5 pb-3">
            {wall.posters.map((p, i) => (
              <li key={`${p.id}-${i}`} className="relative">
                <img src={optimizedImage(p.image, 160)} alt={p.name} loading="lazy" className="aspect-[3/4] w-full border border-[var(--xp-border)] object-cover" />
                <span className="absolute left-1 top-1 bg-black/75 px-1 text-[9px] font-semibold text-white">
                  {p.size.toUpperCase()}
                  {p.split ? ` · split ×${p.split}` : ""}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-[var(--xp-border)] px-5 py-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold leading-none">
                  ₹{totals.total}
                  {totals.saving > 0 && <span className="ml-2 text-sm font-normal text-white/45 line-through">₹{totals.subtotal}</span>}
                </p>
                {totals.saving > 0 && (
                  <p className="mt-1 text-xs font-medium text-[var(--xp-accent-bright)]">
                    You save ₹{totals.saving}
                    {totals.dealType === "b2g1" ? ` · ${totals.b2g1FreeCount} posters free` : ""}
                  </p>
                )}
              </div>
              <p className="text-right text-[11px] text-white/50">Free delivery in Tamil Nadu · ⚡ 59 min in Chennai</p>
            </div>
            <button onClick={addAll} className="btn-primary deal-shine relative mt-3 w-full py-3.5 text-sm font-semibold">
              Add all {wall.pieces} posters to cart
            </button>
            <button
              type="button"
              onClick={() => onCustomise(wall)}
              className="btn-outline mt-2 w-full py-3 text-sm font-semibold"
            >
              ✏️ Customise this wall - swap any poster
            </button>
            <p className="mt-2 text-center text-[11px] text-white/45">Keep this exact format and put in any design you like - even your own photos. Furniture not included.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WallSetupCard({ wall, onOpen }) {
  const t = useMemo(() => wallTotals(wall), [wall]);
  return (
    <button type="button" onClick={() => onOpen(wall)} className="group text-left">
      <span className="relative block overflow-hidden rounded-xl">
        <img
          src={wallImg(wall.slug, 300)}
          srcSet={`${wallImg(wall.slug, 300)} 300w, ${wallImg(wall.slug, 480)} 480w, ${wallImg(wall.slug, 800)} 800w`}
          sizes="(min-width: 1024px) 260px, (min-width: 640px) 33vw, 50vw"
          alt={`${wall.title} on a wall`}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {t.saving > 0 && (
          <span className="absolute left-2 top-2 bg-[var(--xp-accent)] px-1.5 py-0.5 text-[10px] font-bold text-[#0c0b09]">SAVE ₹{t.saving}</span>
        )}
      </span>
      {MOODS[wall.mood] && (
        <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--xp-accent-bright)]">
          {MOODS[wall.mood].emoji} {MOODS[wall.mood].label}
        </span>
      )}
      <span className="block truncate font-display text-lg leading-tight group-hover:text-[var(--xp-accent-bright)]">{wall.title}</span>
      <span className="block text-[11px] text-white/55">
        {wall.pieces} posters · {sizeMix(wall)}
      </span>
      <span className="mt-0.5 block text-sm">
        ₹{t.total}
        {t.saving > 0 && <span className="ml-1.5 text-xs text-white/40 line-through">₹{t.subtotal}</span>}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Make your own wall: pick a layout, then fill each spot with any poster.
// Layouts are built from real poster sizes (cm) the same way the wall setup
// pictures were: a centre piece (one poster, or one poster split into 2
// panels), rows above/below it and columns either side.
const SIZE_CM = { a3: [29.7, 42], a4: [21, 29.7], a5: [14.8, 21] };
const GAP = 2.5;
const PANEL_GAP = 1;

function layoutSlots(spec) {
  const slots = [];
  if (spec.grid) {
    const [w, h] = SIZE_CM[spec.grid.size];
    for (let r = 0; r < spec.grid.rows; r++)
      for (let c = 0; c < spec.grid.cols; c++) slots.push({ size: spec.grid.size, x: c * (w + GAP), y: r * (h + GAP), w, h });
    return slots;
  }
  const [pw, ph] = SIZE_CM[spec.center.size];
  const n = spec.center.split || 1;
  const cw = n * pw + (n - 1) * PANEL_GAP;
  slots.push({ size: spec.center.size, split: n > 1 ? n : undefined, x: -cw / 2, y: -ph / 2, w: cw, h: ph, centre: true });
  let top = -ph / 2;
  let bottom = ph / 2;
  const row = (sizes, above) => {
    const dims = sizes.map((s) => SIZE_CM[s]);
    const total = dims.reduce((a, [w]) => a + w, 0) + GAP * (sizes.length - 1);
    const hmax = Math.max(...dims.map(([, h]) => h));
    let x = -total / 2;
    sizes.forEach((s, i) => {
      const [w, h] = dims[i];
      slots.push({ size: s, x, y: above ? top - GAP - h : bottom + GAP, w, h });
      x += w + GAP;
    });
    if (above) top -= GAP + hmax;
    else bottom += GAP + hmax;
  };
  (spec.top || []).forEach((r) => row(r, true));
  (spec.bottom || []).forEach((r) => row(r, false));
  const mid = (top + bottom) / 2;
  for (const [side, sign] of [["left", -1], ["right", 1]]) {
    let edge = Math.max(...slots.map((s) => (sign > 0 ? s.x + s.w : -s.x)));
    (spec[side] || []).forEach((col, ci) => {
      const dims = col.map((s) => SIZE_CM[s]);
      const cwid = Math.max(...dims.map(([w]) => w));
      const th = dims.reduce((a, [, h]) => a + h, 0) + GAP * (col.length - 1);
      let y = mid - th / 2 + (ci % 2 ? 4 : -2);
      const x = sign > 0 ? edge + GAP : -(edge + GAP) - cwid;
      col.forEach((s, i) => {
        const [w, h] = dims[i];
        slots.push({ size: s, x: x + (cwid - w) / 2, y, w, h });
        y += h + GAP;
      });
      edge += GAP + cwid;
    });
  }
  return slots;
}

const BUILD_LAYOUTS = [
  { key: "starter", name: "Mini Mood", blurb: "Small wall, big vibe", spec: { center: { size: "a3" }, top: [["a5", "a5"]], bottom: [["a5", "a5"]], left: [["a4", "a4"]], right: [["a4", "a4"]] } },
  { key: "grid", name: "Grid Goals", blurb: "Clean rows, all A4", spec: { grid: { size: "a4", cols: 4, rows: 3 } } },
  { key: "hero", name: "Main Character", blurb: "A split centrepiece that steals the show", spec: { center: { size: "a3", split: 2 }, top: [["a4", "a4", "a4"]], bottom: [["a4", "a4", "a4"]], left: [["a4", "a4", "a4"]], right: [["a4", "a4", "a4"]] } },
  {
    key: "showcase",
    name: "Fan Zone",
    blurb: "For the true fan - every size, every era",
    spec: {
      center: { size: "a3", split: 2 },
      top: [["a4", "a4", "a4"]],
      bottom: [["a4", "a4", "a4"]],
      left: [["a4", "a4", "a4"], ["a5", "a5", "a5", "a5"]],
      right: [["a4", "a4", "a4"], ["a5", "a5", "a5", "a5"]],
    },
  },
  {
    key: "mega",
    name: "Full Mass",
    blurb: "The whole wall. Total mass.",
    tag: "Best value",
    spec: {
      center: { size: "a3", split: 2 },
      top: [["a4", "a4", "a4"]],
      bottom: [["a4", "a4", "a4"]],
      left: [["a4", "a4", "a4"], ["a5", "a5", "a5", "a5", "a5"], ["a5", "a5", "a5", "a5"]],
      right: [["a4", "a4", "a4"], ["a5", "a5", "a5", "a5", "a5"], ["a5", "a5", "a5", "a5"]],
    },
  },
].map((l) => makeLayout(l, layoutSlots(l.spec)));

// Slots in cm -> a layout the preview / builder can draw (positions in %).
function makeLayout(l, slots) {
  const x0 = Math.min(...slots.map((s) => s.x));
  const y0 = Math.min(...slots.map((s) => s.y));
  const W = Math.max(...slots.map((s) => s.x + s.w)) - x0;
  const H = Math.max(...slots.map((s) => s.y + s.h)) - y0;
  const placed = slots.map((s) => ({ ...s, left: ((s.x - x0) / W) * 100, top: ((s.y - y0) / H) * 100, width: (s.w / W) * 100, height: (s.h / H) * 100 }));
  const pieces = slots.reduce((n, s) => n + (s.split || 1), 0);
  const totals = computeCartTotals(slots.map((s, i) => ({ key: `${l.key}-${i}`, size: s.size, price: getSizeBySlug(s.size).price, qty: s.split || 1 })));
  return { ...l, slots: placed, aspect: W / H, pieces, totals };
}

// A ready-made wall's exact format (every spot, its size and where it hangs)
// plus its posters - so a customer can keep the format and swap any poster.
function wallLayout(wall) {
  const slots = wall.posters.map((p) => {
    const [x, y, w, h] = p.pos;
    return { size: p.size, split: p.split, x, y, w, h, centre: !!p.split };
  });
  return {
    layout: makeLayout({ key: `wall-${wall.slug}`, name: wall.title }, slots),
    picks: wall.posters.map((p) => ({ id: p.id, name: p.name, image: p.image })),
  };
}

function slotMix(slots) {
  const counts = {};
  for (const s of slots) counts[s.size] = (counts[s.size] || 0) + (s.split || 1);
  return ["a3", "a4", "a5"].filter((k) => counts[k]).map((k) => `${counts[k]} × ${k.toUpperCase()}`).join(" · ");
}

// Real posters from the wall setups, used to "fill" the layout previews.
const SAMPLE_POSTERS = [...new Map(WALLS.flatMap((w) => w.posters).map((p) => [p.id, p.image])).values()];

// A little "GIF" on each layout card: a mouse pointer clicks each empty spot,
// a poster pops in where it clicked, then it clicks "Add to cart" and starts
// over. Runs only while the card is on screen.
const CURSOR_SVG = (
  <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]" aria-hidden="true">
    <path d="M4 2.5v17.2l4.6-4.3 2.9 6.6 3-1.3-2.9-6.5h6.3L4 2.5z" fill="#fff" stroke="#0c0b09" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function LayoutPreview({ layout, offset = 0 }) {
  const boxRef = useRef(null);
  const slotRefs = useRef([]);
  const btnRef = useRef(null);
  // centre first, then outwards - the way you'd actually hang them
  const order = useMemo(
    () =>
      layout.slots
        .map((s, i) => ({ i, d: Math.hypot(s.left + s.width / 2 - 50, (s.top + s.height / 2 - 50) * 0.8) }))
        .sort((a, b) => a.d - b.d)
        .map((o) => o.i),
    [layout]
  );
  const N = order.length;
  // steps: 0..N-1 heading to spot k (spots before k are filled), N heading to
  // the button, N+1 click "Add to cart", N+2 hold, then back to 0 (cleared).
  const [step, setStep] = useState(N + 2);
  const [live, setLive] = useState(false);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!live) return;
    const fill = Math.max(240, Math.min(560, 5600 / N));
    const delay = step === N + 2 ? 1500 : step === N + 1 ? 700 : step === N ? 620 : fill;
    const t = setTimeout(() => setStep((k) => (k + 1) % (N + 3)), delay);
    return () => clearTimeout(t);
  }, [live, step, N]);

  useIsoLayoutEffect(() => {
    const box = boxRef.current;
    const target = step < N ? slotRefs.current[order[step]] : btnRef.current;
    if (!box || !target) return;
    const b = box.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    setPos({ x: r.left - b.left + r.width * (step < N ? 0.55 : 0.7), y: r.top - b.top + r.height * (step < N ? 0.55 : 0.6) });
  }, [step, N, order]);

  const filled = new Set(order.slice(0, Math.min(step, N)));
  const clicked = step >= 1 && step <= N ? order[step - 1] : null;
  const added = step === N + 1 || step === N + 2;

  return (
    <div ref={boxRef} className="relative aspect-[4/3] w-full overflow-hidden bg-[radial-gradient(ellipse_at_50%_35%,#ece7df_0%,#d9d2c7_70%,#c9c1b4_100%)] px-[7%] pb-[13%] pt-[6%]">
      <div className="grid h-full w-full place-items-center" style={{ containerType: "size" }}>
        <div className="relative" style={{ aspectRatio: layout.aspect, width: `min(100cqw, ${(layout.aspect * 100).toFixed(2)}cqh)` }}>
          {layout.slots.map((s, i) => (
            <span
              key={i}
              ref={(el) => (slotRefs.current[i] = el)}
              className="absolute border border-dashed border-black/25 bg-white/25"
              style={{ left: `${s.left}%`, top: `${s.top}%`, width: `${s.width}%`, height: `${s.height}%` }}
            >
              {filled.has(i) && (
                <img
                  src={optimizedImage(SAMPLE_POSTERS[(offset + i * 7) % SAMPLE_POSTERS.length], 120)}
                  alt=""
                  decoding="async"
                  className="slot-in absolute inset-0 h-full w-full object-cover shadow-[1px_2px_4px_rgba(0,0,0,0.35)]"
                />
              )}
              {filled.has(i) &&
                s.split > 1 &&
                Array.from({ length: s.split - 1 }, (_, k) => (
                  <span key={k} className="absolute inset-y-0 w-[2px] bg-[#e2dcd3]" style={{ left: `${((k + 1) / s.split) * 100}%` }} />
                ))}
              {clicked === i && <span key={step} className="click-ripple pointer-events-none absolute left-1/2 top-1/2 h-8 w-8 rounded-full border-2 border-[var(--xp-accent)]" />}
            </span>
          ))}
        </div>
      </div>
      <span
        ref={btnRef}
        className={`absolute bottom-[3.5%] right-[4%] flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-[0_3px_8px_rgba(0,0,0,0.3)] transition-colors duration-300 ${
          added ? "bg-[var(--xp-accent)] text-[#0c0b09]" : "bg-[#0c0b09] text-white"
        }`}
      >
        {added ? "✓ Added" : "Add to cart"}
        {step === N + 1 && <span key="r" className="click-ripple pointer-events-none absolute left-[70%] top-1/2 h-8 w-8 rounded-full border-2 border-[var(--xp-accent)]" />}
      </span>
      {live && pos && (
        <span
          className="pointer-events-none absolute left-0 top-0 z-10 transition-transform duration-[320ms] ease-[cubic-bezier(0.45,0,0.2,1)]"
          style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, transitionDelay: step === 0 ? "0ms" : "170ms" }}
          aria-hidden="true"
        >
          <span key={step} className={`block ${step >= 1 && step <= N + 1 ? "cursor-press" : ""}`}>
            {CURSOR_SVG}
          </span>
        </span>
      )}
    </div>
  );
}

function BuildLayoutCard({ layout, index, onChoose }) {
  return (
    <button type="button" onClick={() => onChoose(layout)} className="group flex h-full w-full flex-col overflow-hidden border border-[var(--xp-border)] bg-[var(--xp-bg-elevated)] text-left transition-colors hover:border-[var(--xp-accent)]">
      <span className="relative block">
        <LayoutPreview layout={layout} offset={index * 11} />
        {layout.tag && <span className="absolute left-2 top-2 bg-[var(--xp-accent)] px-1.5 py-0.5 text-[10px] font-bold text-[#0c0b09]">{layout.tag}</span>}
      </span>
      <span className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
        <span className="font-display text-xl leading-tight">{layout.name}</span>
        <span className="text-[11px] italic text-[var(--xp-accent-bright)]/90">{layout.blurb}</span>
        <span className="mt-0.5 text-[11px] text-white/55">
          {layout.pieces} posters · {slotMix(layout.slots)}
        </span>
        <span className="mt-1 text-sm">
          ₹{layout.totals.total}
          {layout.totals.saving > 0 && <span className="ml-1.5 text-xs text-white/40 line-through">₹{layout.totals.subtotal}</span>}
        </span>
        <span className="mt-2 text-xs font-semibold text-[var(--xp-accent-bright)] group-hover:underline">Choose your posters →</span>
      </span>
    </button>
  );
}

const PICK_CATEGORIES = CATEGORIES.filter((c) => !["customizable-posters", "anime", "cartoon"].includes(c.slug));

// The builder: the chosen layout on top, posters to pick from below. Tapping a
// poster drops it in the highlighted spot and moves on to the next empty one.
function BuildWallSheet({ initial, initialPicks, onClose }) {
  const { addManyToCart } = useCart();
  const [layout, setLayout] = useState(initial);
  const [picks, setPicks] = useState(() => initial.slots.map((_, i) => initialPicks?.[i] || null));
  const [active, setActive] = useState(0);
  const layoutChoices = initial.key.startsWith("wall-") ? [initial, ...BUILD_LAYOUTS] : BUILD_LAYOUTS;
  const photoInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [cat, setCat] = useState(PICK_CATEGORIES[0].slug);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Load posters for the chosen category / search (search waits for typing to pause).
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(
      () => {
        setBusy(true);
        const q = query.trim();
        fetchProducts(q ? { q, page, limit: 36 } : { category: cat, page, limit: 36 })
          .then((data) => {
            if (cancelled) return;
            setProducts((prev) => (page === 1 ? data.products : [...prev, ...data.products]));
            setMore(data.page < data.totalPages);
          })
          .catch(() => !cancelled && page === 1 && setProducts([]))
          .finally(() => !cancelled && setBusy(false));
      },
      query ? 350 : 0
    );
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [cat, query, page]);

  function switchLayout(next) {
    setLayout(next);
    // keep the posters already picked, in order, as far as the new layout goes
    const kept = picks.filter(Boolean);
    const fresh = next.slots.map((_, i) => kept[i] || null);
    setPicks(fresh);
    const firstEmpty = fresh.findIndex((p) => !p);
    setActive(firstEmpty === -1 ? 0 : firstEmpty);
  }

  function place(product, at = active) {
    const next = [...picks];
    next[at] = product;
    setPicks(next);
    const after = next.findIndex((p, i) => !p && i > at);
    const any = next.findIndex((p) => !p);
    setActive(after !== -1 ? after : any !== -1 ? any : at);
  }

  // The customer's own photo for the selected spot: it's enhanced for that
  // spot's print size (same service as Customizable Posters) and then sits in
  // the wall like any other poster.
  async function usePhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const at = active;
    const size = getSizeBySlug(layout.slots[at].size);
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("size", size.slug);
      fd.append("image", await fitForUpload(file));
      const data = await enhanceCustomImage(fd);
      place(
        {
          id: data.publicId,
          name: `Custom Poster (${size.label})`,
          image: data.url,
          category: "customizable-posters",
          custom: {
            imagePublicId: data.publicId,
            width: data.width,
            height: data.height,
            notes: "Part of a custom wall",
            ...(data.sourceUrl ? { sourceImage: data.sourceUrl } : {}),
          },
        },
        at
      );
    } catch (err) {
      setUploadError(err.response?.data?.message || "Couldn't use that photo - please try another one.");
    } finally {
      setUploading(false);
    }
  }

  function clearSlot(i) {
    setPicks((prev) => prev.map((p, j) => (j === i ? null : p)));
    setActive(i);
  }

  function fillRest() {
    const used = new Set(picks.filter(Boolean).map((p) => p.id));
    // (own photos stay where they are; only empty spots get filled)
    const pool = products.filter((p) => !used.has(p.id)).sort(() => Math.random() - 0.5);
    setPicks((prev) => prev.map((p) => p || pool.shift() || null));
  }

  const filled = picks.filter(Boolean).length;
  const totals = useMemo(
    () =>
      computeCartTotals(
        layout.slots
          .map((s, i) => (picks[i] ? { key: `${picks[i].id}-${i}`, size: s.size, price: getSizeBySlug(s.size).price, qty: s.split || 1 } : null))
          .filter(Boolean)
      ),
    [layout, picks]
  );
  const piecesPicked = layout.slots.reduce((n, s, i) => n + (picks[i] ? s.split || 1 : 0), 0);

  function addAll(e) {
    const entries = layout.slots
      .map(
        (s, i) =>
          picks[i] && {
            product: { id: picks[i].id, name: picks[i].name, image: picks[i].image, split: s.split, category: picks[i].category, custom: picks[i].custom },
            size: getSizeBySlug(s.size),
          }
      )
      .filter(Boolean);
    if (!entries.length) return;
    const from = e.currentTarget;
    const image = picks.find(Boolean)?.image;
    onClose();
    flyToCart({ from, image: optimizedImage(image, 200), onArrive: () => addManyToCart(entries) });
  }

  const slot = layout.slots[active];

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Make your own wall - ${layout.name}`}>
      <div
        className="animate-modal-pop relative flex h-[94svh] w-full max-w-[68rem] flex-col overflow-hidden border border-[var(--xp-border-strong)] bg-[var(--xp-bg-elevated)] sm:h-[min(44rem,92svh)] sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-sm text-white backdrop-blur">
          ✕
        </button>

        {/* the wall */}
        <div className="flex shrink-0 flex-col bg-[radial-gradient(ellipse_at_50%_35%,#ece7df_0%,#d9d2c7_70%,#c9c1b4_100%)] sm:w-[55%]">
          <div className="rail flex gap-1.5 overflow-x-auto px-3 pt-3 pr-14">
            {layoutChoices.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => switchLayout(l)}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${l.key === layout.key ? "bg-[#0c0b09] text-white" : "bg-black/10 text-black/70 hover:bg-black/20"}`}
              >
                {l.name} · {l.pieces}
              </button>
            ))}
          </div>
          <div className="h-[29svh] px-4 py-3 sm:h-auto sm:min-h-0 sm:flex-1 sm:p-6">
            <div className="grid h-full w-full place-items-center" style={{ containerType: "size" }}>
            <div className="relative" style={{ aspectRatio: layout.aspect, width: `min(100cqw, ${(layout.aspect * 100).toFixed(2)}cqh)` }}>
              {layout.slots.map((s, i) => {
                const p = picks[i];
                const isActive = i === active;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => (p && isActive ? clearSlot(i) : setActive(i))}
                    aria-label={p ? `${p.name} - tap again to remove` : `Empty ${s.size.toUpperCase()} spot`}
                    className={`absolute overflow-hidden ${p ? "shadow-[1px_2px_5px_rgba(0,0,0,0.4)]" : "border border-dashed border-black/30 bg-white/30"} ${isActive ? "z-[1] outline outline-2 outline-offset-1 outline-[var(--xp-accent)]" : ""}`}
                    style={{ left: `${s.left}%`, top: `${s.top}%`, width: `${s.width}%`, height: `${s.height}%` }}
                  >
                    {p ? (
                      <>
                        <img key={p.id} src={optimizedImage(p.image, s.centre ? 360 : 160)} alt="" className="slot-in h-full w-full object-cover" />
                        {s.split > 1 &&
                          Array.from({ length: s.split - 1 }, (_, k) => (
                            <span key={k} className="absolute inset-y-0 w-[2px] bg-[#e2dcd3]" style={{ left: `${((k + 1) / s.split) * 100}%` }} />
                          ))}
                        {isActive && <span className="absolute inset-0 grid place-items-center bg-black/45 text-[10px] font-bold text-white">✕</span>}
                      </>
                    ) : (
                      <span className={`grid h-full w-full place-items-center text-[10px] font-bold ${isActive ? "text-[var(--xp-accent)]" : "text-black/35"}`}>+</span>
                    )}
                  </button>
                );
              })}
            </div>
            </div>
          </div>
          <p className="px-4 pb-2 text-center text-[11px] text-black/60 sm:pb-3">
            {filled}/{layout.slots.length} spots filled · selected spot: {slot?.size.toUpperCase()}
            {slot?.split ? ` centre piece, split into ${slot.split} panels` : ""}
          </p>
        </div>

        {/* the posters */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-4 pt-3 sm:pt-4">
            <h2 className="font-display text-xl leading-tight sm:text-2xl">{initial.key.startsWith("wall-") ? "Customise this wall" : "Make your own wall"}</h2>
            <p className="hidden text-[11px] text-white/55 sm:block">Tap a spot on the wall, then tap any poster - or use your own photo.</p>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search posters - Vijay, Porsche, Spider-Man…"
              className="mt-2 w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--xp-accent)]"
            />
            {!query && (
              <div className="rail mt-2 flex gap-1.5 overflow-x-auto pb-1">
                {PICK_CATEGORIES.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => {
                      setCat(c.slug);
                      setPage(1);
                    }}
                    className={`shrink-0 rounded-full border px-3 py-1 text-[11px] ${c.slug === cat ? "border-[var(--xp-accent)] bg-[var(--xp-accent)] font-semibold text-[#0c0b09]" : "border-[var(--xp-border-strong)] text-white/70"}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              <button
                type="button"
                onClick={() => photoInput.current?.click()}
                disabled={uploading}
                className="grid aspect-[3/4] w-full place-items-center border border-dashed border-[var(--xp-accent)] bg-[var(--xp-accent)]/10 px-1 text-center text-[10px] font-semibold leading-tight text-[var(--xp-accent-bright)] transition-colors hover:bg-[var(--xp-accent)]/20 disabled:opacity-60"
              >
                {uploading ? (
                  <span>Enhancing your photo…</span>
                ) : (
                  <span>
                    <span className="block text-xl">📷</span>
                    Your own photo
                    <span className="block font-normal text-white/50">for the {slot?.size.toUpperCase()} spot</span>
                  </span>
                )}
              </button>
              <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={usePhoto} />
              {products.map((p) => {
                const count = picks.filter((x) => x?.id === p.id).length;
                return (
                  <button key={p.id} type="button" onClick={() => place(p)} className="relative" aria-label={`Add ${p.name}`}>
                    <img src={optimizedImage(p.image, 160)} alt={p.name} loading="lazy" className="aspect-[3/4] w-full border border-[var(--xp-border)] object-cover transition-transform hover:scale-[1.03]" />
                    {count > 0 && (
                      <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--xp-accent)] px-1 text-[10px] font-bold text-[#0c0b09]">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
            {uploadError && <p className="alert-error mt-2 text-xs">{uploadError}</p>}
            {busy && <p className="py-4 text-center text-xs text-white/50">Loading posters…</p>}
            {!busy && !products.length && <p className="py-4 text-center text-xs text-white/50">No posters found.</p>}
            {more && !busy && (
              <button type="button" onClick={() => setPage((n) => n + 1)} className="btn-outline mx-auto my-3 block px-5 py-2 text-xs">
                Show more posters
              </button>
            )}
          </div>
          <div className="border-t border-[var(--xp-border)] px-4 py-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xl font-semibold leading-none">
                  ₹{totals.total}
                  {totals.saving > 0 && <span className="ml-2 text-sm font-normal text-white/45 line-through">₹{totals.subtotal}</span>}
                </p>
                <p className="mt-1 text-[11px] text-[var(--xp-accent-bright)]">
                  {totals.saving > 0 ? `You save ₹${totals.saving}` : "Buy 2 Get 1 applies automatically"}
                </p>
              </div>
              {filled < layout.slots.length && products.length > 0 && (
                <button type="button" onClick={fillRest} className="text-right text-xs font-semibold text-white/70 underline-offset-2 hover:text-white hover:underline">
                  Fill the rest for me
                </button>
              )}
            </div>
            <button onClick={addAll} disabled={!filled} className="btn-primary deal-shine relative mt-2.5 w-full py-3 text-sm font-semibold disabled:opacity-50">
              {filled ? `Add ${piecesPicked} posters to cart` : "Tap posters to fill your wall"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Catchy headings for the collection rows (the plain category name sits above).
const SECTION_TITLES = CATEGORY_TITLES;

// ---------------------------------------------------------------------------
// Hero: "Build a wall of ___" - the word and the wall photo deck change together.
const HERO_PICKS = [
  ["Vijay", "thalapathy-vijay"],
  ["Rajini", "superstar-rajini"],
  ["Kohli", "king-virat"],
  ["Spider-Man", "spider-verse"],
  ["Ajith", "thala-ajith"],
  ["F1", "f1-legends"],
  ["Suriya", "suriya"],
  ["CR7", "cr7-legacy"],
  ["Heisenberg", "breaking-bad"],
  ["Dhoni", "thala-dhoni"],
  ["Friends", "central-perk"],
]
  .map(([word, slug]) => ({ word, wall: WALLS.find((w) => w.slug === slug) }))
  .filter((p) => p.wall)
  .map((p) => ({ ...p, totals: wallTotals(p.wall) }));

function useHeroTicker(count, ms = 2600) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % count), ms);
    return () => clearInterval(t);
  }, [count, ms]);
  return i;
}

// The rotating word. Every word sits in the same grid cell (invisible) so the
// line keeps the width of the longest one and nothing jumps around.
function HeroWord({ index }) {
  return (
    <span className="relative inline-grid align-baseline text-[var(--xp-accent-bright)]">
      {HERO_PICKS.map((p) => (
        <span key={p.word} className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden="true">
          {p.word}.
        </span>
      ))}
      <span key={index} className="col-start-1 row-start-1 whitespace-nowrap">
        <span className="hero-word-in relative">
          {HERO_PICKS[index].word}.
          <span className="hero-underline absolute -bottom-1 left-0 h-[5px] w-full origin-left bg-[var(--xp-accent)] sm:h-2" aria-hidden="true" />
        </span>
      </span>
    </span>
  );
}

// A deck of real wall photos in 3D; the front one matches the word.
function HeroDeck({ index, onOpen }) {
  const n = HERO_PICKS.length;
  const pose = [
    "translate3d(0,0,0) rotateY(-14deg) rotateZ(-3deg) scale(1)",
    "translate3d(18%,-7%,-80px) rotateY(-14deg) rotateZ(5deg) scale(0.88)",
    "translate3d(33%,-13%,-160px) rotateY(-14deg) rotateZ(11deg) scale(0.76)",
  ];
  return (
    <div className="hero-float relative mx-auto aspect-square w-full max-w-[460px]" style={{ perspective: "1400px" }}>
      {HERO_PICKS.map((p, i) => {
        const depth = (i - index + n) % n;
        const leaving = depth === n - 1;
        const visible = depth < 3;
        const t = p.totals;
        return (
          <button
            key={p.wall.slug}
            type="button"
            tabIndex={depth === 0 ? 0 : -1}
            aria-hidden={depth !== 0 || undefined}
            onClick={() => onOpen(p.wall)}
            className="absolute left-0 top-[12%] w-[74%] overflow-hidden rounded-2xl text-left shadow-[0_30px_60px_rgba(0,0,0,0.65)] ring-1 ring-white/10 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              transform: leaving ? "translate3d(-38%,6%,60px) rotateY(-14deg) rotateZ(-14deg) scale(0.95)" : pose[Math.min(depth, 2)],
              opacity: visible ? (depth === 0 ? 1 : depth === 1 ? 0.85 : 0.6) : 0,
              zIndex: 10 - Math.min(depth, 9),
              pointerEvents: depth === 0 ? "auto" : "none",
              transformStyle: "preserve-3d",
            }}
          >
            <img
              src={wallImg(p.wall.slug, 480)}
              srcSet={`${wallImg(p.wall.slug, 480)} 480w, ${wallImg(p.wall.slug, 800)} 800w`}
              sizes="340px"
              alt={depth === 0 ? `${p.wall.title} on a wall` : ""}
              loading={i < 3 ? "eager" : "lazy"}
              decoding="async"
              className="aspect-square w-full object-cover"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-3.5 pt-10">
              <span className="block font-display text-xl leading-tight text-white">{p.wall.title}</span>
              <span className="mt-0.5 flex items-center gap-2 text-xs text-white/75">
                {p.wall.pieces} posters · ₹{t.total}
                {t.saving > 0 && <span className="bg-[var(--xp-accent)] px-1.5 py-0.5 text-[10px] font-bold text-[#0c0b09]">SAVE ₹{t.saving}</span>}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [sections, setSections] = useState(snapshot.sections || {});
  const [rows, setRows] = useState(() => splitRows(snapshot.featured || []));
  const [loading, setLoading] = useState(!HAS_SNAPSHOT);
  const [error, setError] = useState(null);
  // Only the first collection row is in the prerendered HTML; the rest mount a
  // moment after load, so hydration (and first paint) stay light.
  const [rowsShown, setRowsShown] = useState(1);
  const [openWall, setOpenWall] = useState(null);
  const [allWalls, setAllWalls] = useState(false);
  const [building, setBuilding] = useState(null);
  const [mood, setMood] = useState(null);
  const shownWalls = mood ? WALLS.filter((w) => w.mood === mood) : WALLS;
  const location = useLocation();
  useEffect(() => {
    const m = new URLSearchParams(location.search).get("mood");
    if (m && MOODS[m]) setMood(m);
    const id = location.hash.slice(1);
    if (!id) return;
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    return () => clearTimeout(t);
  }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps
  const heroIndex = useHeroTicker(HERO_PICKS.length);

  useEffect(() => {
    const t = setTimeout(() => setRowsShown(Infinity), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Only pulls up to 10 newest posters per category (server-side) plus the
    // featured set for the wall - not the entire catalog.
    Promise.all([fetchHomeSections(10), fetchFeaturedProducts()])
      .then(([sectionsData, featured]) => {
        if (cancelled) return;
        setSections(sectionsData);
        // Shuffled between two marquee rows scrolling in opposite directions
        // - but only if the featured set actually changed since the snapshot,
        // so the posters already on screen don't reshuffle under the visitor.
        setRows((prev) => {
          const same =
            prev.rowA.length + prev.rowB.length === featured.length &&
            [...prev.rowA, ...prev.rowB].every((p) => featured.some((f) => f.id === p.id));
          if (same) return prev;
          const shuffled = [...featured].sort(() => Math.random() - 0.5);
          return splitRows(shuffled);
        });
      })
      .catch(() => {
        // With a saved snapshot already on screen there's nothing to apologise for.
        if (!cancelled && !HAS_SNAPSHOT) setError("Couldn't load the catalog right now - try refreshing.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const promoPosters = [...rows.rowA, ...rows.rowB].filter((p) => p.image).slice(0, 3);

  const categoriesWithProducts = CATEGORIES.map((cat) => {
    const products = sections[cat.slug] || [];
    return {
      ...cat,
      products: cat.slug === "tamil-movies" ? sortTamilMovies(products) : products,
    };
  }).filter((cat) => cat.products.length > 0);

  return (
    <div>
      {/* Hero: walls, not single posters */}
      <section className="relative overflow-hidden pb-10 pt-8 sm:pt-12">
        <div
          className="animate-glow-pulse pointer-events-none absolute -left-24 top-0 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(201,162,76,0.18)_0%,transparent_65%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-[-10%] top-10 hidden h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(201,162,76,0.16)_0%,transparent_62%)] lg:block"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-5 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
          <div>
            <p className="animate-hero-rise inline-flex items-center gap-2 rounded-full border border-[var(--xp-accent)]/40 bg-[var(--xp-accent)]/10 py-1 pl-1.5 pr-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--xp-accent-bright)] sm:text-[11px]">
              <span className="rounded-full bg-[var(--xp-accent)] px-2 py-0.5 tracking-normal text-[#0c0b09]">New</span>
              {WALLS.length} ready-made walls · real rooms
            </p>
            <h1 className="animate-hero-rise mt-4 font-display text-[40px] leading-[1.04] sm:text-6xl lg:text-[68px]" style={{ animationDelay: "0.08s" }}>
              <span className="block whitespace-nowrap">Don&apos;t buy a poster.</span>
              <span className="block whitespace-nowrap">Build a wall of</span>
              <span className="mt-1 block text-[1.3em] leading-[0.95]">
                <HeroWord index={heroIndex} />
              </span>
            </h1>
            <p className="animate-hero-rise mt-5 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base" style={{ animationDelay: "0.16s" }}>
              Real posters on real walls. Pick a ready-made wall, tap once and the whole look lands in your cart - with{" "}
              <span className="font-semibold text-[var(--xp-accent-bright)]">Buy 2 Get 1</span> already applied.
            </p>
            <div className="animate-hero-rise mt-5 flex flex-wrap gap-2 text-[11px] text-white/75 sm:text-xs" style={{ animationDelay: "0.24s" }}>
              {["Big split centrepieces", "A3 · A4 · A5 mixed", "Free delivery in Tamil Nadu"].map((t) => (
                <span key={t} className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden lg:block">
            <HeroDeck index={heroIndex} onOpen={setOpenWall} />
          </div>
        </div>

        <div className="relative mt-6 min-h-[332px] space-y-3 sm:min-h-[460px]">
          <WallMarquee walls={WALL_ROW_A} direction="left" onOpen={setOpenWall} priority />
          <WallMarquee walls={WALL_ROW_B} direction="right" onOpen={setOpenWall} />
        </div>

        <div className="relative mx-auto mt-6 flex max-w-6xl flex-wrap items-center gap-3 px-5">
          <a href="#wall-setups" className="btn-primary deal-shine relative px-7 py-3.5 text-sm font-bold">
            Shop wall setups
          </a>
          <a href="#build-your-wall" className="btn-outline px-7 py-3.5 text-sm font-bold">
            Build your own
          </a>
        </div>
        <div className="relative mx-auto mt-4 flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-5 text-xs text-white/60">
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            59-min delivery live in Chennai
          </span>
          <span>Buy 2 Get 1 free on every wall</span>
          <span>1,400+ designs</span>
        </div>
      </section>

      {error && (
        <div className="mx-auto max-w-6xl px-5 pb-10">
          <p role="alert" className="alert-error text-center">{error}</p>
        </div>
      )}

      {/* Every wall setup */}
      <section id="wall-setups" className="mx-auto max-w-6xl scroll-mt-20 px-5 pt-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--xp-accent-bright)]">Wall setups · pick your mood</p>
            <h2 className="font-display text-3xl sm:text-4xl">Steal the Look</h2>
            <p className="mt-1 text-sm text-white/60">How do you want to feel when you walk into your room?</p>
          </div>
          <button type="button" onClick={() => setAllWalls((v) => !v)} className="text-sm text-white/65 transition-colors hover:text-white">
            {allWalls ? "Show less" : `View all ${WALLS.length} →`}
          </button>
        </div>
        {/* moods */}
        <div className="rail -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
          {[null, ...MOOD_KEYS].map((k) => (
            <button
              key={k || "all"}
              type="button"
              onClick={() => setMood(k)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                mood === k ? "border-[var(--xp-accent)] bg-[var(--xp-accent)] text-[#0c0b09]" : "border-white/15 text-white/75 hover:border-white/40"
              }`}
            >
              {k ? `${MOODS[k].emoji} ${MOODS[k].label}` : "✨ All moods"}
            </button>
          ))}
        </div>
        {mood && <p className="mt-3 text-sm italic text-[var(--xp-accent-bright)]">{MOODS[mood].line}</p>}
        {/* one row (2 / 3 / 4 across) until "View all" - a mood shows all of its walls */}
        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {shownWalls.map((wall, i) => (
            <div key={wall.slug} className={allWalls || mood || i < 2 ? "" : i === 2 ? "hidden sm:block" : i === 3 ? "hidden lg:block" : "hidden"}>
              <WallSetupCard wall={wall} onOpen={setOpenWall} />
            </div>
          ))}
        </div>
        {!mood && (
          <div className="mt-6 text-center">
            <button type="button" onClick={() => setAllWalls((v) => !v)} className="btn-outline px-8 py-3 text-sm font-semibold">
              {allWalls ? "Show less" : `View all ${WALLS.length} wall setups`}
            </button>
          </div>
        )}
      </section>

      {/* Make your own wall: pick a layout, fill it with any posters */}
      <section id="build-your-wall" className="mx-auto max-w-6xl scroll-mt-20 px-5 pt-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--xp-accent-bright)]">Make your own wall · pick a layout</p>
        <h2 className="font-display text-3xl sm:text-4xl">Your Wall, Your Rules</h2>
        <p className="mt-1 max-w-xl text-sm text-white/60">Pick a layout, then click any of our 1,400+ posters to fill it - just like the preview. Buy 2 Get 1 is applied to the whole wall.</p>
        <div className="rail mt-5 flex snap-x gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:overflow-visible">
          {BUILD_LAYOUTS.map((layout, i) => (
            <div key={layout.key} className="w-[62%] shrink-0 snap-start sm:w-[38%] lg:w-auto">
              <BuildLayoutCard layout={layout} index={i} onChoose={(l) => setBuilding({ layout: l })} />
            </div>
          ))}
        </div>
      </section>

      {openWall && (
        <WallSheet
          wall={openWall}
          onClose={() => setOpenWall(null)}
          onCustomise={(wall) => {
            const { layout, picks } = wallLayout(wall);
            setOpenWall(null);
            setBuilding({ layout, picks });
          }}
        />
      )}
      {building && <BuildWallSheet initial={building.layout} initialPicks={building.picks} onClose={() => setBuilding(null)} />}

      {/* Buy 2 Get 1 promo */}
      <section className="mx-auto max-w-6xl px-5 pt-8">
        <Link
          to="/collections"
          className="group relative grid items-center gap-6 overflow-hidden border border-[var(--xp-accent)] bg-[linear-gradient(120deg,rgba(201,162,76,0.22),rgba(12,11,9,0.2)_55%,rgba(201,162,76,0.12))] px-6 py-7 sm:grid-cols-[1.1fr_1fr] sm:px-10 sm:py-9"
        >
          <div
            className="animate-glow-pulse pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[var(--xp-accent)]/25 blur-[90px]"
            aria-hidden="true"
          />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--xp-accent-bright)]">On every poster · every size</p>
            <h2 className="mt-2 font-display text-5xl leading-[0.92] sm:text-6xl lg:text-7xl">
              Buy 2<br />
              Get 1 <span className="text-[var(--xp-accent-bright)]">Free</span>
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/65">
              Put any 3 posters in your cart and the most affordable one is on us. Mix sizes, mix movies — it applies automatically.
            </p>
            <span className="btn-primary deal-shine relative mt-5 inline-block px-6 py-3 text-sm font-semibold">Grab the deal →</span>
          </div>
          <div className="relative mx-auto flex h-44 w-60 items-end justify-center sm:h-60 sm:w-96" aria-hidden="true">
            {promoPosters.map((p, i) => (
              <div
                key={p.id}
                className="absolute bottom-0 w-20 transition-transform duration-500 group-hover:-translate-y-1 sm:w-32"
                style={{
                  transform: `translateX(calc(${(i - 1) * 100}% - ${(i - 1) * 8}px)) rotate(${(i - 1) * 8}deg) translateY(${i === 1 ? -16 : 0}px)`,
                  zIndex: i === 2 ? 3 : i === 1 ? 2 : 1,
                }}
              >
                <PosterImage src={p.image} alt="" width={240} className="shadow-[0_14px_30px_rgba(0,0,0,0.7)]" />
                {i === 2 && (
                  <span className="stamp-in absolute -right-3 -top-3 grid h-14 w-14 place-items-center rounded-full border-2 border-[#0c0b09] bg-[var(--xp-accent-bright)] font-display text-lg text-[#0c0b09] shadow-[0_6px_16px_rgba(0,0,0,0.6)]">
                    FREE
                  </span>
                )}
              </div>
            ))}
          </div>
        </Link>
      </section>

      {/* Quick category chips */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="rail flex gap-3 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <CategoryChip key={cat.slug} slug={cat.slug} name={cat.name} />
          ))}
        </div>
      </section>

      {/* Collection sections */}
      <section className="mx-auto max-w-6xl space-y-14 px-5 pb-20">
        {loading && <LoadingScreen className="min-h-[600px]" />}
        {!loading &&
          categoriesWithProducts.slice(0, rowsShown).map((cat) => (
            <div key={cat.slug} style={{ contentVisibility: "auto", containIntrinsicSize: "auto 380px" }}>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--xp-accent-bright)] sm:text-[11px]">{cat.name}</p>
                  <h2 className="font-display text-2xl sm:text-3xl">{SECTION_TITLES[cat.slug] || cat.name}</h2>
                </div>
                <Link to={`/collections/${cat.slug}`} className="text-sm text-white/65 transition-colors hover:text-white">
                  View all
                </Link>
              </div>
              <div className="rail flex gap-4 overflow-x-auto pb-2">
                {cat.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))}
      </section>
    </div>
  );
}
