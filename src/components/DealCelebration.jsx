import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { optimizedImage } from "../utils/cloudinaryUrl.js";

// The "deal unlocked" show - each time, at random, one of two:
//  - a cheeky neon helicopter (blinking eyes, big grin) flies in from a
//    random side, swoops around, hovers to drop a parachute gift, does a
//    loop-de-loop ("Wheee!") and zooms off - the deal swinging under it;
//  - a neon supercar races in, launches into a mid-air flip, lands with a
//    puff of smoke, revs ("Vroom!") and blasts off in a wheelie on nitro -
//    the deal flying above it like a kite.
// Fired by CartContext whenever the cart reaches a new or bigger deal.
// Purely decorative (pointer-events: none); people whose device asks for
// less motion just get a simple banner.

const CONFETTI_COLORS = ["#e2bd6c", "#c9a24c", "#f3ede2", "#25d366", "#ff5a5f", "#ffffff"];
const T_IN = 1500;
const T_HOVER = 1100;
const T_LOOP = 1000;
const T_OUT = 1300;
const T_TOTAL = T_IN + T_HOVER + T_LOOP + T_OUT;

function reducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) };
}

// A smooth curve through all the points, u from 0 to 1.
function spline(points, u) {
  const n = points.length - 1;
  const seg = Math.min(n - 1, Math.floor(u * n));
  const t = u * n - seg;
  return catmull(points[Math.max(seg - 1, 0)], points[seg], points[seg + 1], points[Math.min(seg + 2, n)], t);
}

// Random entry and exit sides, so every flight is different.
function planFlight(w, h) {
  const sides = ["left", "right", "top"];
  const edge = (side, off) =>
    side === "left"
      ? { x: -off, y: rand(0.12, 0.5) * h }
      : side === "right"
        ? { x: w + off, y: rand(0.12, 0.5) * h }
        : { x: rand(0.2, 0.8) * w, y: -off };
  const startSide = sides[Math.floor(Math.random() * 3)];
  const exitChoices = sides.filter((s) => s !== startSide);
  const exitSide = exitChoices[Math.floor(Math.random() * exitChoices.length)];
  const C = { x: w / 2, y: clamp(h * 0.3, 140, h - 300) };
  return {
    C,
    inPts: [edge(startSide, 160), { x: rand(0.18, 0.82) * w, y: rand(0.5, 0.68) * h }, C],
    outPts: [C, { x: rand(0.15, 0.85) * w, y: rand(0.15, 0.45) * h }, edge(exitSide, 260)],
    loopR: Math.min(70, w * 0.16),
  };
}

function Helicopter({ width }) {
  return (
    <svg width={width} height={(width * 100) / 150} viewBox="0 0 150 100" aria-hidden="true" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="xp-heli-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff2e93" />
          <stop offset="0.5" stopColor="#ff6a1a" />
          <stop offset="1" stopColor="#ffd400" />
        </linearGradient>
        <linearGradient id="xp-heli-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="xp-heli-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b8fbff" />
          <stop offset="1" stopColor="#00a8ff" />
        </linearGradient>
        <linearGradient id="xp-heli-fin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00e5ff" />
          <stop offset="1" stopColor="#7b4dff" />
        </linearGradient>
        <linearGradient id="xp-heli-chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#8c8aa8" />
        </linearGradient>
        <linearGradient id="xp-heli-disc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff2e93" />
          <stop offset="0.5" stopColor="#ffd400" />
          <stop offset="1" stopColor="#00e5ff" />
        </linearGradient>
      </defs>
      {/* tail */}
      <path d="M42 44 L9 37 L9 46 L42 56 Z" fill="url(#xp-heli-body)" stroke="#5b0f3c" strokeWidth="1.2" />
      <path d="M3 22 L14 22 L19 44 L6 47 Z" fill="url(#xp-heli-fin)" stroke="#2a0845" strokeWidth="1.2" />
      <circle className="heli-light" cx="4" cy="23" r="2.4" fill="#ff1744" />
      <g className="heli-tail-rotor">
        <circle cx="11" cy="33" r="10" fill="#00e5ff" opacity="0.28" />
        <line x1="11" y1="23" x2="11" y2="43" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <line x1="1" y1="33" x2="21" y2="33" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      </g>
      {/* skids */}
      <line x1="60" y1="70" x2="55" y2="85" stroke="url(#xp-heli-chrome)" strokeWidth="3.4" strokeLinecap="round" />
      <line x1="108" y1="70" x2="112" y2="85" stroke="url(#xp-heli-chrome)" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M38 86 L124 86 C130 86 133 82 132 78" fill="none" stroke="#d9d7ec" strokeWidth="3.8" strokeLinecap="round" />
      {/* body */}
      <path
        d="M38 50 C36 34 50 24 72 24 L96 24 C118 24 133 36 133 50 C133 64 118 73 98 73 L58 73 C46 73 39 63 38 50 Z"
        fill="url(#xp-heli-body)"
        stroke="#5b0f3c"
        strokeWidth="1.4"
      />
      <path d="M40 58 L131 58 C127 66 117 72 99 72 L58 72 C49 72 43 66 40 58 Z" fill="#2a0845" />
      <path d="M41 58 L131 58" stroke="#00e5ff" strokeWidth="1.6" />
      <path d="M48 30 C60 25 84 25 94 27 C84 31 62 33 50 36 Z" fill="url(#xp-heli-gloss)" />
      <path d="M58 52 L66 38 L64 46 L72 44 L62 60 L64 51 Z" fill="#fff200" stroke="#5b0f3c" strokeWidth="0.8" />
      <text x="40" y="53" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="11" fill="#fff" stroke="#5b0f3c" strokeWidth="0.6">
        XP
      </text>
      <rect x="72" y="30" width="20" height="14" rx="4" fill="url(#xp-heli-glass)" stroke="#2a0845" strokeWidth="1.2" />
      {/* cockpit with the face */}
      <path d="M98 28 C114 28 127 36 130 49 L100 49 C97 42 96 34 98 28 Z" fill="url(#xp-heli-glass)" stroke="#2a0845" strokeWidth="1.2" />
      <path d="M101 31 C108 31 113 33 116 36 L103 38 Z" fill="#fff" opacity="0.8" />
      <g className="heli-eyes">
        <ellipse cx="108" cy="40" rx="4.4" ry="5.4" fill="#fff" stroke="#2a0845" strokeWidth="0.8" />
        <circle cx="109.6" cy="41" r="2.4" fill="#2a0845" />
        <circle cx="110.4" cy="40" r="0.8" fill="#fff" />
        <ellipse cx="119" cy="41.5" rx="4" ry="5" fill="#fff" stroke="#2a0845" strokeWidth="0.8" />
        <circle cx="120.4" cy="42.4" r="2.2" fill="#2a0845" />
        <circle cx="121.1" cy="41.5" r="0.7" fill="#fff" />
      </g>
      <ellipse cx="112" cy="53" rx="3.4" ry="2.1" fill="#ff2e93" opacity="0.7" />
      <path d="M116 52 Q123 58 129 51" fill="none" stroke="#2a0845" strokeWidth="2.2" strokeLinecap="round" />
      <circle className="heli-light heli-light-2" cx="132" cy="56" r="2.2" fill="#00e676" />
      {/* main rotor */}
      <rect x="71" y="13" width="6" height="12" rx="1" fill="#2a0845" />
      <ellipse cx="74" cy="13" rx="70" ry="7" fill="url(#xp-heli-disc)" opacity="0.35" />
      <ellipse className="heli-rotor" cx="74" cy="13" rx="70" ry="3.2" fill="#2a0845" />
      <ellipse cx="74" cy="13" rx="7" ry="3" fill="#ffd400" stroke="#2a0845" strokeWidth="1" />
    </svg>
  );
}

const SPARKLE_COLORS = ["#ff2e93", "#ffd400", "#00e5ff", "#ffffff", "#ff6a1a"];

// Glittery sparkle trail left behind the helicopter / car.
function sparkle(container, x, y, i, palette = SPARKLE_COLORS) {
  const el = document.createElement("span");
  const size = 10 + Math.random() * 10;
  el.textContent = "✦";
  el.style.cssText =
    `position:${container === document.body ? "fixed;z-index:94;pointer-events:none" : "absolute"};left:${x}px;top:${y}px;font-size:${size}px;line-height:1;color:${palette[i % palette.length]};` +
    `text-shadow:0 0 8px currentColor;will-change:transform,opacity;`;
  container.appendChild(el);
  el.animate(
    [
      { transform: "translate(-50%,-50%) scale(1) rotate(0deg)", opacity: 1 },
      { transform: `translate(-50%,-50%) translate(${(Math.random() - 0.5) * 24}px, ${18 + Math.random() * 22}px) scale(0) rotate(180deg)`, opacity: 0 },
    ],
    { duration: 650 + Math.random() * 300, easing: "ease-out", fill: "forwards" }
  )
    .finished.then(() => el.remove())
    .catch(() => el.remove());
}

function burstConfetti(container, originX, originY) {
  for (let i = 0; i < 46; i += 1) {
    const piece = document.createElement("span");
    const size = 5 + Math.random() * 6;
    piece.style.cssText =
      `position:absolute;left:${originX}px;top:${originY}px;width:${size}px;height:${size * 0.45}px;` +
      `background:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};border-radius:1px;will-change:transform,opacity;`;
    container.appendChild(piece);
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
    const speed = 110 + Math.random() * 180;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    const spin = (Math.random() - 0.5) * 1080;
    piece
      .animate(
        [
          { transform: "translate(-50%,-50%) translate(0,0) rotate(0deg)", opacity: 1 },
          { transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.35 },
          { transform: `translate(-50%,-50%) translate(${dx * 1.35}px,${dy + 280}px) rotate(${spin}deg)`, opacity: 0 },
        ],
        { duration: 1500 + Math.random() * 900, easing: "cubic-bezier(.2,.7,.4,1)", fill: "forwards" }
      )
      .finished.then(() => piece.remove())
      .catch(() => piece.remove());
  }
}

// A gift box floating down on a little parachute.
function dropGift(container, x, y, h) {
  const gift = document.createElement("div");
  gift.style.cssText = `position:absolute;left:0;top:0;width:54px;will-change:transform;`;
  gift.innerHTML = `
    <svg width="54" height="74" viewBox="0 0 54 74" aria-hidden="true">
      <path d="M3 24 C3 8 51 8 51 24 Z" fill="#f3ede2"/>
      <path d="M15 24 C15 9 39 9 39 24 Z" fill="#c9a24c"/>
      <path d="M3 24 Q9 20 15 24 Q21 20 27 24 Q33 20 39 24 Q45 20 51 24" fill="none" stroke="#0c0b09" stroke-width="1.2"/>
      <path d="M4 24 L19 46 M50 24 L35 46 M27 24 L27 46" stroke="#f3ede2" stroke-width="1" opacity="0.8"/>
      <rect x="15" y="46" width="24" height="22" fill="#c9a24c" stroke="#0c0b09" stroke-width="1.2"/>
      <rect x="25" y="46" width="4" height="22" fill="#ff5a5f"/>
      <path d="M27 46 C21 38 15 44 27 46 C39 44 33 38 27 46" fill="#ff5a5f"/>
      <text x="27" y="62" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="7" fill="#0c0b09">FREE</text>
    </svg>`;
  container.appendChild(gift);
  const fall = Math.max(200, h - y + 90);
  gift
    .animate(
      [
        { transform: `translate(${x - 27}px, ${y}px) rotate(0deg) scale(0.4)`, opacity: 0 },
        { transform: `translate(${x - 27}px, ${y + 30}px) rotate(-8deg) scale(1)`, opacity: 1, offset: 0.1 },
        { transform: `translate(${x - 2}px, ${y + fall * 0.35}px) rotate(12deg) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${x - 52}px, ${y + fall * 0.7}px) rotate(-12deg) scale(1)`, opacity: 1, offset: 0.72 },
        { transform: `translate(${x - 20}px, ${y + fall}px) rotate(6deg) scale(1)`, opacity: 0.9 },
      ],
      { duration: 3200, easing: "ease-in-out", fill: "forwards" }
    )
    .finished.then(() => gift.remove())
    .catch(() => gift.remove());
}

const CAR_SPARKLES = ["#00f5d4", "#f15bb5", "#fee440", "#9b5de5", "#ffffff"];

function Supercar({ width }) {
  const wheel = (cx) => (
    <g className="car-wheel" data-cx={cx} data-cy="64">
      <circle cx={cx} cy="64" r="14" fill="#0b0b12" stroke="#2b1b6b" strokeWidth="1" />
      <circle cx={cx} cy="64" r="9.5" fill="url(#xp-car-rim)" />
      {[0, 72, 144, 216, 288].map((a) => (
        <line
          key={a}
          x1={cx}
          y1="64"
          x2={cx + 8.5 * Math.cos((a * Math.PI) / 180)}
          y2={64 + 8.5 * Math.sin((a * Math.PI) / 180)}
          stroke="#f15bb5"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      ))}
      <circle cx={cx} cy="64" r="2.6" fill="#2b1b6b" />
    </g>
  );
  return (
    <svg width={width} height={(width * 84) / 200} viewBox="0 0 200 84" aria-hidden="true" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="xp-car-paint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00f5d4" />
          <stop offset="0.45" stopColor="#00bbf9" />
          <stop offset="1" stopColor="#9b5de5" />
        </linearGradient>
        <linearGradient id="xp-car-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="xp-car-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a2a9c" />
          <stop offset="1" stopColor="#0d0a2b" />
        </linearGradient>
        <radialGradient id="xp-car-rim">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#9aa0c8" />
        </radialGradient>
        <linearGradient id="xp-car-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fffbe0" stopOpacity="0.8" />
          <stop offset="1" stopColor="#fffbe0" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="xp-car-glow">
          <stop offset="0" stopColor="#f15bb5" stopOpacity="0.95" />
          <stop offset="0.6" stopColor="#00f5d4" stopOpacity="0.5" />
          <stop offset="1" stopColor="#00f5d4" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* neon underglow + headlight beam */}
      <ellipse className="car-glow" cx="100" cy="74" rx="92" ry="9" fill="url(#xp-car-glow)" />
      <polygon points="192,44 268,28 268,64" fill="url(#xp-car-beam)" />
      {/* nitro flame (its size is set from the animation) */}
      <g className="car-flame-size">
        <g className="car-flame">
          <path d="M12 51 C0 45 -16 49 -30 54 C-16 59 0 63 12 59 Z" fill="#f15bb5" />
          <path d="M12 52 C4 49 -7 51 -17 55 C-7 58 4 60 12 58 Z" fill="#fee440" />
          <path d="M12 53.5 C7 52.5 2 53.5 -4 55 C2 56.5 7 57.5 12 56.5 Z" fill="#fff" />
        </g>
      </g>
      {/* body */}
      <path
        d="M10 54 C10 46 16 42 28 40 L66 35 C80 22 100 17 122 18 C136 19 146 25 154 33 L182 38 C193 40 197 47 197 54 L197 58 C197 62 193 64 187 64 L14 64 C11 64 10 62 10 58 Z"
        fill="url(#xp-car-paint)"
        stroke="#2b1b6b"
        strokeWidth="1.4"
      />
      <path d="M30 41 L68 37 C82 25 100 21 120 22 C108 26 90 31 72 40 L30 45 Z" fill="url(#xp-car-gloss)" />
      <path d="M77 35 C88 25 102 22 118 22 L120 35 Z" fill="url(#xp-car-glass)" stroke="#2b1b6b" strokeWidth="1.2" />
      <path d="M124 22 C134 23 142 28 149 34 L126 35 Z" fill="url(#xp-car-glass)" stroke="#2b1b6b" strokeWidth="1.2" />
      <path d="M86 33 C93 27 100 25 108 24 L104 28 C98 29 93 31 89 34 Z" fill="#00f5d4" opacity="0.6" />
      <path d="M14 50 L196 50" stroke="#f15bb5" strokeWidth="3" />
      <path d="M14 54.5 L196 54.5" stroke="#fee440" strokeWidth="1.8" />
      <path d="M128 43 L147 41 L141 47 L126 48 Z" fill="#0d0a2b" opacity="0.85" />
      <text x="92" y="47" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="9" fill="#fff" stroke="#2b1b6b" strokeWidth="0.5">
        XP
      </text>
      <path d="M6 29 L38 29 L38 33.5 L6 34.5 Z" fill="#f15bb5" stroke="#2b1b6b" strokeWidth="1" />
      <path d="M22 34 L24 41" stroke="#2b1b6b" strokeWidth="3" />
      <path d="M186 42 C191 42 195 44 196.5 47.5 L186 47.5 Z" fill="#fffbe0" />
      <rect x="10" y="43" width="4" height="7" rx="1" fill="#ff1744" />
      <path d="M118 34 L125 30.5 L127 34 Z" fill="#9b5de5" stroke="#2b1b6b" strokeWidth="0.6" />
      {/* wheel arches + wheels */}
      <path d="M33 64 A19 19 0 0 1 71 64 Z" fill="#0d0a2b" />
      <path d="M139 64 A19 19 0 0 1 177 64 Z" fill="#0d0a2b" />
      {wheel(52)}
      {wheel(158)}
    </svg>
  );
}

function dustPuff(container, x, y) {
  for (let i = 0; i < 12; i += 1) {
    const el = document.createElement("span");
    const size = 14 + Math.random() * 18;
    el.style.cssText =
      `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;border-radius:999px;` +
      `background:rgba(243,237,226,${0.35 + Math.random() * 0.3});will-change:transform,opacity;`;
    container.appendChild(el);
    const dx = (Math.random() - 0.5) * 180;
    el.animate(
      [
        { transform: "translate(-50%,-50%) scale(0.3)", opacity: 0.9 },
        { transform: `translate(-50%,-50%) translate(${dx}px, ${-10 - Math.random() * 40}px) scale(1.6)`, opacity: 0 },
      ],
      { duration: 700 + Math.random() * 400, easing: "ease-out", fill: "forwards" }
    )
      .finished.then(() => el.remove())
      .catch(() => el.remove());
  }
}

// Neon speed streaks whooshing past behind the car.
function streak(container, x, y, dir, i) {
  const el = document.createElement("span");
  const len = 30 + Math.random() * 50;
  const color = CAR_SPARKLES[i % CAR_SPARKLES.length];
  el.style.cssText =
    `position:absolute;left:${x}px;top:${y}px;width:${len}px;height:3px;border-radius:3px;` +
    `background:linear-gradient(${dir > 0 ? 270 : 90}deg, ${color}, transparent);box-shadow:0 0 8px ${color};will-change:transform,opacity;`;
  container.appendChild(el);
  el.animate(
    [
      { transform: `translate(${dir > 0 ? "-100%" : "0"},-50%)`, opacity: 0.9 },
      { transform: `translate(${dir > 0 ? "-100%" : "0"},-50%) translateX(${-dir * 60}px) scaleX(0.3)`, opacity: 0 },
    ],
    { duration: 380, easing: "ease-out", fill: "forwards" }
  )
    .finished.then(() => el.remove())
    .catch(() => el.remove());
}

function rotPt(x, y, deg) {
  const a = (deg * Math.PI) / 180;
  return { x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) };
}

function setLine(el, p, q) {
  if (!el) return;
  el.setAttribute("x1", p.x);
  el.setAttribute("y1", p.y);
  el.setAttribute("x2", q.x);
  el.setAttribute("y2", q.y);
}

// The deal banner on its strings: a damped spring pulls it toward a spot
// under (helicopter) or above (car) the vehicle, so it lags, swings and
// bounces naturally as the vehicle moves.
function makeBanner(el, side) {
  const bw = el?.offsetWidth || 200;
  const bh = el?.offsetHeight || 50;
  const b = { x: 0, y: 0, vx: 0, vy: 0, init: false, bw, bh, angle: 0 };
  b.update = (hx, hy, ropeLen, dt) => {
    const tx = hx;
    const ty = hy + side * (ropeLen + bh / 2);
    if (!b.init) {
      b.x = tx;
      b.y = ty;
      b.init = true;
    }
    b.vx += (60 * (tx - b.x) - 5.2 * b.vx) * dt;
    b.vy += (60 * (ty - b.y) - 5.2 * b.vy) * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    const raw = side > 0 ? Math.atan2(b.x - hx, b.y - hy) : Math.atan2(b.x - hx, hy - b.y);
    b.angle = clamp((raw * 180) / Math.PI, -40, 40) * (side > 0 ? -1 : 1);
    if (el) el.style.transform = `translate(${b.x - bw / 2}px, ${b.y - bh / 2}px) rotate(${b.angle}deg)`;
    return b;
  };
  // Where a string meets the banner (top corners when hanging below, bottom
  // corners when flying above).
  b.corner = (sx) => {
    const c = rotPt(sx * bw * 0.36, (-side * bh) / 2, b.angle);
    return { x: b.x + c.x, y: b.y + c.y };
  };
  return b;
}

function runHelicopter({ w, h, refs, done }) {
  const W = w < 640 ? 96 : 150;
  const s = W / 150;
  const H = (W * 100) / 150;
  const plan = planFlight(w, h);
  const banner = makeBanner(refs.banner.current, 1);

  let raf = 0;
  let start = 0;
  let last = 0;
  let prev = null;
  let facing = plan.inPts[1].x >= plan.inPts[0].x ? 1 : -1;
  let tilt = 0;
  let loopDir = facing;
  let dropped = false;
  let lastSparkle = 0;
  let sparkleCount = 0;

  function heliPos(t) {
    if (t < T_IN) {
      const p = t / T_IN;
      return { ...spline(plan.inPts, 1 - (1 - p) * (1 - p)), spin: 0, phase: "in" };
    }
    if (t < T_IN + T_HOVER) {
      const p = (t - T_IN) / T_HOVER;
      return { x: plan.C.x + Math.sin(p * Math.PI * 2) * 16, y: plan.C.y + Math.sin(p * Math.PI * 4) * 6, spin: 0, phase: "hover" };
    }
    if (t < T_IN + T_HOVER + T_LOOP) {
      const p = (t - T_IN - T_HOVER) / T_LOOP;
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const th = e * Math.PI * 2;
      const R = plan.loopR;
      return { x: plan.C.x + loopDir * R * Math.sin(th), y: plan.C.y - R + R * Math.cos(th), spin: -360 * e * loopDir, phase: "loop" };
    }
    const p = Math.min(1, (t - T_IN - T_HOVER - T_LOOP) / T_OUT);
    return { ...spline(plan.outPts, p * p), spin: 0, phase: "out" };
  }

  function frame(now) {
    if (!start) {
      start = now;
      last = now;
    }
    const t = now - start;
    const dt = Math.min(0.033, (now - last) / 1000) || 0.016;
    last = now;
    const pos = heliPos(t);
    const bob = pos.phase === "loop" ? 0 : Math.sin(t / 140) * 3;
    const x = pos.x;
    const y = pos.y + bob;

    if (prev && dt > 0) {
      const vx = (x - prev.x) / (dt * 1000);
      if (pos.phase !== "loop") {
        if (vx > 0.05) facing = 1;
        else if (vx < -0.05) facing = -1;
        tilt += (clamp(vx * 28, -24, 24) - tilt) * 0.18;
      } else {
        tilt += (0 - tilt) * 0.3;
      }
    }
    if (pos.phase === "hover" && prev && prev.phase === "in") loopDir = facing;
    prev = { x, y, phase: pos.phase };
    const angle = tilt + pos.spin;

    if (refs.layer.current && now - lastSparkle > 55) {
      lastSparkle = now;
      sparkleCount += 1;
      const tail = rotPt(-62 * s * facing, -8 * s, angle);
      sparkle(refs.layer.current, x + tail.x, y + tail.y, sparkleCount);
    }
    if (refs.vehicle.current) refs.vehicle.current.style.transform = `translate(${x - W / 2}px, ${y - H / 2}px) rotate(${angle}deg)`;
    if (refs.face.current) refs.face.current.style.transform = `scaleX(${facing})`;

    const hang = rotPt(0, 36 * s, angle);
    banner.update(x + hang.x, y + hang.y, 34, dt);
    const a1 = rotPt(-34 * s * facing, 36 * s, angle);
    const a2 = rotPt(44 * s * facing, 36 * s, angle);
    const left = facing === 1 ? a1 : a2;
    const right = facing === 1 ? a2 : a1;
    setLine(refs.rope1.current, { x: x + left.x, y: y + left.y }, banner.corner(-1));
    setLine(refs.rope2.current, { x: x + right.x, y: y + right.y }, banner.corner(1));

    if (refs.bubble.current) {
      const on = pos.phase === "loop";
      refs.bubble.current.style.opacity = on ? "1" : "0";
      refs.bubble.current.style.transform = `translate(${x + 26}px, ${y - H / 2 - 40}px) scale(${on ? 1 : 0.6})`;
    }

    if (!dropped && pos.phase === "hover") {
      dropped = true;
      if (refs.layer.current) {
        burstConfetti(refs.layer.current, x, y);
        dropGift(refs.layer.current, x, y + 30, h);
      }
    }

    if (t < T_TOTAL + 250) raf = requestAnimationFrame(frame);
    else done();
  }
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

const CAR_T = { in: 750, jump: 850, land: 260, show: 1450, out: 1000 };

function runCar({ w, h, refs, done }) {
  const W = w < 640 ? 150 : 210;
  const s = W / 200;
  const H = (W * 84) / 200;
  const dir = Math.random() < 0.5 ? 1 : -1;
  const groundY = clamp(h * 0.6, 250, h - 90);
  const startX = dir > 0 ? -W : w + W;
  const jumpX = dir > 0 ? w * 0.18 : w * 0.82;
  const midX = w / 2;
  const exitX = dir > 0 ? w + W * 1.6 : -W * 1.6;
  const jumpH = Math.min(h * 0.24, 180);
  const t1 = CAR_T.in;
  const t2 = t1 + CAR_T.jump;
  const t3 = t2 + CAR_T.land;
  const t4 = t3 + CAR_T.show;
  const t5 = t4 + CAR_T.out;
  const banner = makeBanner(refs.banner.current, -1);
  const svg = refs.vehicle.current;
  const wheels = svg ? [...svg.querySelectorAll(".car-wheel")] : [];
  const flame = svg ? svg.querySelector(".car-flame-size") : null;
  if (refs.face.current) refs.face.current.style.transform = `scaleX(${dir})`;

  let raf = 0;
  let start = 0;
  let last = 0;
  let prevX = startX;
  let wheelDeg = 0;
  let spinRate = 0;
  let landed = false;
  let lastFx = 0;
  let fxCount = 0;

  function pose(t) {
    if (t < t1) {
      const p = t / t1;
      return { x: startX + (jumpX - startX) * p, y: groundY + Math.sin(t / 45) * 1.5, rot: -2 * dir, sx: 1, sy: 1, flame: 1.1, phase: "in" };
    }
    if (t < t2) {
      const p = (t - t1) / CAR_T.jump;
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      return { x: jumpX + (midX - jumpX) * p, y: groundY - jumpH * 4 * p * (1 - p), rot: 360 * dir * e, sx: 1, sy: 1, flame: 1.5, phase: "jump" };
    }
    if (t < t3) {
      const p = (t - t2) / CAR_T.land;
      const k = Math.sin(p * Math.PI);
      return { x: midX + dir * 10 * k, y: groundY + 4 * k, rot: 0, sx: 1 + 0.14 * k, sy: 1 - 0.2 * k, flame: 0.3, phase: "land" };
    }
    if (t < t4) {
      return {
        x: midX + Math.sin(t / 22) * 1.3,
        y: groundY - Math.abs(Math.sin(t / 90)) * 2,
        rot: Math.sin(t / 60),
        sx: 1,
        sy: 1,
        flame: 0.5 + 0.6 * Math.abs(Math.sin(t / 130)),
        phase: "show",
      };
    }
    const p = Math.min(1, (t - t4) / CAR_T.out);
    return {
      x: midX + (exitX - midX) * Math.pow(p, 2.2),
      y: groundY,
      rot: -14 * dir * Math.sin((Math.min(1, p * 1.6) * Math.PI) / 2),
      sx: 1,
      sy: 1,
      flame: 2.3,
      phase: "out",
    };
  }

  function frame(now) {
    if (!start) {
      start = now;
      last = now;
    }
    const t = now - start;
    const dt = Math.min(0.033, (now - last) / 1000) || 0.016;
    last = now;
    const ps = pose(t);
    const { x, y } = ps;

    // Wheels roll with the ground speed and keep spinning in the air.
    if (ps.phase !== "jump") spinRate = ps.phase === "show" ? 0 : ((x - prevX) / (2 * Math.PI * 14 * s)) * 360;
    wheelDeg += spinRate;
    prevX = x;
    for (const wEl of wheels) {
      wEl.setAttribute("transform", `rotate(${wheelDeg * dir} ${wEl.dataset.cx} ${wEl.dataset.cy})`);
    }
    if (flame) flame.setAttribute("transform", `translate(12 55) scale(${ps.flame}) translate(-12 -55)`);

    if (refs.vehicle.current) {
      refs.vehicle.current.style.transform = `translate(${x - W / 2}px, ${y - H / 2}px) rotate(${ps.rot}deg) scale(${ps.sx}, ${ps.sy})`;
    }

    // The banner flies above the car like a kite, tied to the roof.
    const roof = rotPt(10 * s * dir, -24 * s, ps.rot);
    banner.update(x + roof.x, y + roof.y, 46, dt);
    const r1 = rotPt((10 * dir - 6) * s, -24 * s, ps.rot);
    const r2 = rotPt((10 * dir + 6) * s, -24 * s, ps.rot);
    setLine(refs.rope1.current, { x: x + r1.x, y: y + r1.y }, banner.corner(-1));
    setLine(refs.rope2.current, { x: x + r2.x, y: y + r2.y }, banner.corner(1));

    const layer = refs.layer.current;
    if (layer && ps.phase !== "show" && ps.phase !== "land" && now - lastFx > 40) {
      lastFx = now;
      fxCount += 1;
      const rear = rotPt(-96 * s * dir, 12 * s, ps.rot);
      sparkle(layer, x + rear.x, y + rear.y, fxCount, CAR_SPARKLES);
      if (ps.phase !== "jump") streak(layer, x + rear.x, y + rear.y + (Math.random() - 0.5) * H * 0.8, dir, fxCount);
    }
    if (!landed && ps.phase === "land") {
      landed = true;
      if (layer) {
        dustPuff(layer, x - 50 * s, groundY + H / 2 - 4);
        dustPuff(layer, x + 50 * s, groundY + H / 2 - 4);
        burstConfetti(layer, x, y - H / 2);
      }
    }

    if (refs.bubble.current) {
      const on = ps.phase === "show";
      refs.bubble.current.style.opacity = on ? "1" : "0";
      const bw2 = refs.bubble.current.offsetWidth || 80;
      const bx = dir > 0 ? x + W * 0.5 + 6 : x - W * 0.5 - 6 - bw2;
      refs.bubble.current.style.transform = `translate(${clamp(bx, 4, w - bw2 - 4)}px, ${y - H * 0.55}px) scale(${on ? 1 : 0.6})`;
    }

    if (t < t5 + 250) raf = requestAnimationFrame(frame);
    else done();
  }
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

// ---------------------------------------------------------------------------
// Add-to-cart delivery: a small race car (the one from the "Cars 5" poster)
// picks the poster up from the button, carries it on its roof along a little
// arc to the cart icon (speed ghost + sparkles behind it), and the cart icon
// bumps when it arrives. The
// item is actually added on arrival, so the cart opens right as the car gets
// there. With reduced motion (or no cart icon on screen) it adds instantly.
// The race car from the "Cars 5" split poster (cut out of the poster art),
// facing right. 300x81 transparent WebP in /public.
const CART_CAR_SRC = "/cart-car.webp";
const CART_CAR_RATIO = 81 / 300;
// Fetch the little car once the page has loaded, so the first add-to-cart
// already has it.
if (typeof window !== "undefined") {
  window.addEventListener(
    "load",
    () => {
      const img = new Image();
      img.src = CART_CAR_SRC;
    },
    { once: true }
  );
}

function popAt(x, y) {
  for (let i = 0; i < 12; i += 1) {
    const el = document.createElement("span");
    el.textContent = "✦";
    const a = (i / 12) * Math.PI * 2;
    el.style.cssText =
      `position:fixed;left:${x}px;top:${y}px;font-size:${9 + Math.random() * 7}px;line-height:1;z-index:96;pointer-events:none;` +
      `color:${CAR_SPARKLES[i % CAR_SPARKLES.length]};text-shadow:0 0 8px currentColor;`;
    document.body.appendChild(el);
    el.animate(
      [
        { transform: "translate(-50%,-50%) scale(.4)", opacity: 1 },
        { transform: `translate(-50%,-50%) translate(${Math.cos(a) * 34}px, ${Math.sin(a) * 34}px) scale(1) rotate(160deg)`, opacity: 0 },
      ],
      { duration: 600, easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards" }
    )
      .finished.then(() => el.remove())
      .catch(() => el.remove());
  }
}

export function flyToCart({ from, image, onArrive }) {
  const icon = document.querySelector("[data-cart-icon]");
  if (!from || !icon || reducedMotion()) {
    onArrive();
    return;
  }
  const a = from.getBoundingClientRect();
  const b = icon.getBoundingClientRect();
  const S = { x: a.left + a.width / 2, y: a.top + a.height / 2 - 8 };
  const E = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  const dx = E.x - S.x;
  const dy = E.y - S.y;
  const len = Math.hypot(dx, dy) || 1;
  // Arc bulging upward (or sideways for a steep climb).
  let nx = -dy / len;
  let ny = dx / len;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const bend = Math.min(160, len * 0.28);
  const C = { x: (S.x + E.x) / 2 + nx * bend, y: (S.y + E.y) / 2 + ny * bend };
  const facing = dx >= 0 ? 1 : -1;
  const W = window.innerWidth < 640 ? 74 : 92;
  const H = W * CART_CAR_RATIO;

  // The poster rides on the roof. Reuse a copy of the picture the page has
  // already loaded (so it shows instantly), else a small fresh one.
  const base = image ? String(image).split("/upload/").pop() : "";
  const loaded = base ? [...document.images].find((im) => im.complete && im.naturalWidth && im.currentSrc.endsWith(base)) : null;
  const imgSrc = loaded ? loaded.currentSrc : image ? optimizedImage(image, 120) : "";
  const pw = W * 0.2;
  const ph = pw * 1.33;
  const boxH = H + ph - 2;
  const posterTop = 0;

  const car = document.createElement("div");
  car.setAttribute("aria-hidden", "true");
  car.style.cssText =
    `position:fixed;left:0;top:0;width:${W}px;height:${boxH}px;z-index:95;pointer-events:none;will-change:transform;` +
    `filter:drop-shadow(0 0 7px rgba(241,91,181,.45)) drop-shadow(0 5px 6px rgba(0,0,0,.6));`;
  car.innerHTML =
    `<div style="position:absolute;inset:0;transform:scaleX(${facing})">` +
    // speed ghost trailing behind
    `<img src="${CART_CAR_SRC}" alt="" style="position:absolute;left:${-W * 0.16}px;bottom:0;width:${W}px;height:${H}px;opacity:.28;filter:blur(2px)">` +
    (imgSrc
      ? `<img src="${imgSrc}" alt="" style="position:absolute;left:${W * 0.44}px;top:${posterTop}px;width:${pw}px;height:${ph}px;object-fit:cover;background:#18140f;border:1.5px solid #fff;transform:rotate(-6deg);box-shadow:0 2px 5px rgba(0,0,0,.6)">`
      : "") +
    `<img src="${CART_CAR_SRC}" alt="" style="position:absolute;left:0;bottom:0;width:${W}px;height:${H}px"></div>`;
  document.body.appendChild(car);

  const duration = Math.max(650, Math.min(950, len * 1.1));
  const at = (t) => ({
    x: (1 - t) * (1 - t) * S.x + 2 * (1 - t) * t * C.x + t * t * E.x,
    y: (1 - t) * (1 - t) * S.y + 2 * (1 - t) * t * C.y + t * t * E.y,
  });
  let start = 0;
  let lastFx = 0;
  let n = 0;
  function frame(now) {
    if (!start) start = now;
    const p = Math.min(1, (now - start) / duration);
    const t = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    const pos = at(t);
    const ahead = at(Math.min(1, t + 0.02));
    const vx = ahead.x - pos.x;
    const vy = ahead.y - pos.y;
    const heading = facing > 0 ? Math.atan2(vy, vx) : -Math.atan2(vy, -vx);
    const rot = clamp((heading * 180) / Math.PI, -55, 55);
    const scale = 1 - 0.45 * Math.max(0, (p - 0.55) / 0.45);
    car.style.transform = `translate(${pos.x - W / 2}px, ${pos.y - boxH / 2}px) rotate(${rot}deg) scale(${scale})`;
    car.style.opacity = p > 0.9 ? String(1 - (p - 0.9) / 0.1) : "1";
    if (now - lastFx > 35 && p < 0.92) {
      lastFx = now;
      n += 1;
      const rear = rotPt(-W * 0.5 * facing * scale, H * 0.25 * scale, rot);
      sparkle(document.body, pos.x + rear.x, pos.y + rear.y, n, CAR_SPARKLES);
    }
    if (p < 1) {
      requestAnimationFrame(frame);
      return;
    }
    car.remove();
    onArrive();
    popAt(E.x, E.y);
    icon.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.35) rotate(-10deg)" }, { transform: "scale(0.92) rotate(6deg)" }, { transform: "scale(1)" }],
      { duration: 450, easing: "ease-out" }
    );
  }
  requestAnimationFrame(frame);
}

// Random each time, but never the same one three times in a row.
let recentModes = [];
function pickMode() {
  let mode = Math.random() < 0.5 ? "heli" : "car";
  if (recentModes.length === 2 && recentModes[0] === mode && recentModes[1] === mode) mode = mode === "heli" ? "car" : "heli";
  recentModes = [mode, ...recentModes].slice(0, 2);
  return mode;
}

export default function DealCelebration() {
  const { celebration, clearCelebration } = useCart();
  const [show, setShow] = useState(null);
  const layerRef = useRef(null);
  const vehicleRef = useRef(null);
  const faceRef = useRef(null);
  const bannerRef = useRef(null);
  const bubbleRef = useRef(null);
  const rope1Ref = useRef(null);
  const rope2Ref = useRef(null);

  useEffect(() => {
    if (!celebration) return;
    setShow({ ...celebration, mode: pickMode(), w: window.innerWidth, h: window.innerHeight, reduced: reducedMotion() });
    clearCelebration();
    try {
      navigator.vibrate?.([25, 40, 25]);
    } catch {
      // Vibration isn't available everywhere - silently skip.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebration]);

  useEffect(() => {
    if (!show) return undefined;
    if (show.reduced) {
      const t = setTimeout(() => setShow(null), 2800);
      return () => clearTimeout(t);
    }
    const refs = { layer: layerRef, vehicle: vehicleRef, face: faceRef, banner: bannerRef, bubble: bubbleRef, rope1: rope1Ref, rope2: rope2Ref };
    const run = show.mode === "car" ? runCar : runHelicopter;
    return run({ w: show.w, h: show.h, refs, done: () => setShow(null) });
  }, [show]);

  if (!show) return null;

  const title =
    show.dealType === "b2g1"
      ? show.freeCount > 1
        ? `${show.freeCount} POSTERS FREE!`
        : "BUY 2 GET 1 UNLOCKED!"
      : "DEAL UNLOCKED!";
  const isCar = show.mode === "car";

  if (show.reduced) {
    return (
      <div className="pointer-events-none fixed inset-x-0 top-[5.5rem] z-[90] flex justify-center px-4" aria-live="polite">
        <div className="deal-banner-pop border border-[var(--xp-accent-bright)] bg-[#0c0b09]/95 px-6 py-3.5 text-center shadow-[0_10px_50px_rgba(201,162,76,0.45)]">
          <p className="font-display text-2xl leading-none tracking-wide text-[var(--xp-accent-bright)]">{title}</p>
          <p className="mt-1.5 text-sm text-[var(--xp-white)]">
            You save <span className="font-semibold text-[var(--xp-accent-bright)]">₹{show.saving}</span> on this order 🎉
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={layerRef} className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      <p className="sr-only" aria-live="polite">
        {title} You save ₹{show.saving} on this order.
      </p>
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        <line ref={rope1Ref} stroke="#f3ede2" strokeOpacity="0.75" strokeWidth="1.5" />
        <line ref={rope2Ref} stroke="#f3ede2" strokeOpacity="0.75" strokeWidth="1.5" />
      </svg>
      <div
        ref={bannerRef}
        className={`heli-banner absolute left-0 top-0 whitespace-nowrap px-7 py-2 text-center ${
          isCar
            ? "bg-[linear-gradient(90deg,#00f5d4,#fee440_50%,#f15bb5)] text-[#1a0b3d]"
            : "bg-[linear-gradient(90deg,#ffd400,#ff8a1a_55%,#ff2e93)] text-[#1a0526]"
        }`}
        style={{ transform: "translate(-999px,-999px)" }}
        aria-hidden="true"
      >
        <p className="font-display text-lg leading-none tracking-wide sm:text-xl">{title}</p>
        <p className="mt-0.5 text-[11px] font-bold">You save ₹{show.saving} 🎉</p>
      </div>
      <div
        ref={vehicleRef}
        className="absolute left-0 top-0"
        style={{
          transform: "translate(-999px,-999px)",
          filter: isCar
            ? "drop-shadow(0 0 14px rgba(0,245,212,0.6)) drop-shadow(0 10px 12px rgba(0,0,0,0.5))"
            : "drop-shadow(0 0 14px rgba(255,46,147,0.65)) drop-shadow(0 10px 14px rgba(0,0,0,0.5))",
        }}
        aria-hidden="true"
      >
        <div ref={faceRef} className={isCar ? "" : "heli-face"}>
          {isCar ? <Supercar width={show.w < 640 ? 150 : 210} /> : <Helicopter width={show.w < 640 ? 96 : 150} />}
        </div>
      </div>
      <div
        ref={bubbleRef}
        className={`absolute left-0 top-0 rounded-full border-2 bg-white px-3 py-1 font-display text-base text-[#2a0845] transition-[opacity] duration-200 ${
          isCar ? "border-[#00f5d4] shadow-[0_0_14px_rgba(0,245,212,0.6)]" : "border-[#ff2e93] shadow-[0_0_14px_rgba(255,46,147,0.6)]"
        }`}
        style={{ opacity: 0, transform: "translate(-999px,-999px)" }}
        aria-hidden="true"
      >
        {isCar ? "Vroom! 🏁" : "Wheee! 🎉"}
      </div>
    </div>
  );
}
