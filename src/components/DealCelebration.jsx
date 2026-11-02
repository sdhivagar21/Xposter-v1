import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext.jsx";

// The "deal unlocked" show: a cheeky little gold helicopter (blinking eyes,
// big grin) flies in from a random side, swoops around, hovers to drop a
// parachute gift, does a loop-de-loop ("Wheee!") and zooms off in another
// direction - with the deal hanging underneath it on a swinging banner.
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

// Glittery sparkle trail left behind the helicopter.
function sparkle(container, x, y, i) {
  const el = document.createElement("span");
  const size = 10 + Math.random() * 10;
  el.textContent = "✦";
  el.style.cssText =
    `position:absolute;left:${x}px;top:${y}px;font-size:${size}px;line-height:1;color:${SPARKLE_COLORS[i % SPARKLE_COLORS.length]};` +
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

export default function DealCelebration() {
  const { celebration, clearCelebration } = useCart();
  const [show, setShow] = useState(null);
  const layerRef = useRef(null);
  const heliRef = useRef(null);
  const faceRef = useRef(null);
  const bannerRef = useRef(null);
  const bubbleRef = useRef(null);
  const rope1Ref = useRef(null);
  const rope2Ref = useRef(null);

  useEffect(() => {
    if (!celebration) return;
    setShow({ ...celebration, w: window.innerWidth, h: window.innerHeight, reduced: reducedMotion() });
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
    const { w, h } = show;
    const W = w < 640 ? 96 : 150;
    const s = W / 150;
    const H = (W * 100) / 150;
    const plan = planFlight(w, h);
    const bw = bannerRef.current?.offsetWidth || 200;
    const bh = bannerRef.current?.offsetHeight || 50;
    const ropeLen = 34;

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
    const banner = { x: 0, y: 0, vx: 0, vy: 0, init: false };

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

    function rot(x, y, deg) {
      const a = (deg * Math.PI) / 180;
      return { x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) };
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

      if (layerRef.current && now - lastSparkle > 55) {
        lastSparkle = now;
        sparkleCount += 1;
        const tail = rot(-62 * s * facing, -8 * s, angle);
        sparkle(layerRef.current, x + tail.x, y + tail.y, sparkleCount);
      }
      if (heliRef.current) heliRef.current.style.transform = `translate(${x - W / 2}px, ${y - H / 2}px) rotate(${angle}deg)`;
      if (faceRef.current) faceRef.current.style.transform = `scaleX(${facing})`;

      // The banner hangs on two ropes and swings like a pendulum (a damped
      // spring pulling it to the spot right under the helicopter).
      const hang = rot(0, 36 * s, angle);
      const hx = x + hang.x;
      const hy = y + hang.y;
      const tx = hx;
      const ty = hy + ropeLen + bh / 2;
      if (!banner.init) {
        banner.x = tx;
        banner.y = ty;
        banner.init = true;
      }
      const k = 60;
      const c = 5.2;
      banner.vx += (k * (tx - banner.x) - c * banner.vx) * dt;
      banner.vy += (k * (ty - banner.y) - c * banner.vy) * dt;
      banner.x += banner.vx * dt;
      banner.y += banner.vy * dt;
      const swing = clamp((Math.atan2(banner.x - hx, banner.y - hy) * 180) / Math.PI, -40, 40);
      if (bannerRef.current) {
        bannerRef.current.style.transform = `translate(${banner.x - bw / 2}px, ${banner.y - bh / 2}px) rotate(${-swing}deg)`;
      }
      const a1 = rot(-34 * s * facing, 36 * s, angle);
      const a2 = rot(44 * s * facing, 36 * s, angle);
      const c1 = rot(-bw * 0.36, -bh / 2, -swing);
      const c2 = rot(bw * 0.36, -bh / 2, -swing);
      const setLine = (el, p, q) => {
        if (!el) return;
        el.setAttribute("x1", p.x);
        el.setAttribute("y1", p.y);
        el.setAttribute("x2", q.x);
        el.setAttribute("y2", q.y);
      };
      const left = facing === 1 ? a1 : a2;
      const right = facing === 1 ? a2 : a1;
      setLine(rope1Ref.current, { x: x + left.x, y: y + left.y }, { x: banner.x + c1.x, y: banner.y + c1.y });
      setLine(rope2Ref.current, { x: x + right.x, y: y + right.y }, { x: banner.x + c2.x, y: banner.y + c2.y });

      if (bubbleRef.current) {
        const on = pos.phase === "loop";
        bubbleRef.current.style.opacity = on ? "1" : "0";
        bubbleRef.current.style.transform = `translate(${x + 26}px, ${y - H / 2 - 40}px) scale(${on ? 1 : 0.6})`;
      }

      if (!dropped && pos.phase === "hover") {
        dropped = true;
        if (layerRef.current) {
          burstConfetti(layerRef.current, x, y);
          dropGift(layerRef.current, x, y + 30, h);
        }
      }

      if (t < T_TOTAL + 250) raf = requestAnimationFrame(frame);
      else setShow(null);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [show]);

  if (!show) return null;

  const title =
    show.dealType === "b2g1"
      ? show.freeCount > 1
        ? `${show.freeCount} POSTERS FREE!`
        : "BUY 2 GET 1 UNLOCKED!"
      : "DEAL UNLOCKED!";
  const width = show.w < 640 ? 96 : 150;

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
        className="heli-banner absolute left-0 top-0 whitespace-nowrap bg-[linear-gradient(90deg,#ffd400,#ff8a1a_55%,#ff2e93)] px-7 py-2 text-center text-[#1a0526]"
        style={{ transform: "translate(-999px,-999px)" }}
        aria-hidden="true"
      >
        <p className="font-display text-lg leading-none tracking-wide sm:text-xl">{title}</p>
        <p className="mt-0.5 text-[11px] font-bold">You save ₹{show.saving} 🎉</p>
      </div>
      <div
        ref={heliRef}
        className="absolute left-0 top-0"
        style={{
          transform: "translate(-999px,-999px)",
          filter: "drop-shadow(0 0 14px rgba(255,46,147,0.65)) drop-shadow(0 10px 14px rgba(0,0,0,0.5))",
        }}
        aria-hidden="true"
      >
        <div ref={faceRef} className="heli-face">
          <Helicopter width={width} />
        </div>
      </div>
      <div
        ref={bubbleRef}
        className="absolute left-0 top-0 rounded-full border-2 border-[#ff2e93] bg-white px-3 py-1 font-display text-base text-[#2a0845] shadow-[0_0_14px_rgba(255,46,147,0.6)] transition-[opacity] duration-200"
        style={{ opacity: 0, transform: "translate(-999px,-999px)" }}
        aria-hidden="true"
      >
        Wheee! 🎉
      </div>
    </div>
  );
}
