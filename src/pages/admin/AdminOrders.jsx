import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import SalesOverview from "../../components/admin/SalesOverview.jsx";
import { fetchAdminOrders, makePrintFile, fetchAiUsage, fetchPrintSource } from "../../api/admin.js";
import { fitForUpload } from "../../api/client.js";
import LoadingScreen from "../../components/LoadingScreen.jsx";
import PosterImage from "../../components/PosterImage.jsx";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdminOrders()
      .then(setOrders)
      .catch(() => setError("Couldn't load orders."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl">Orders</h1>

      <SalesOverview onReset={() => setOrders([])} />

      {error && <p role="alert" className="alert-error mt-6">{error}</p>}
      {loading && <LoadingScreen />}

      {!loading && orders.length === 0 && (
        <p className="mt-10 text-sm text-white/60">No orders placed yet.</p>
      )}

      {!loading && orders.length > 0 && (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-[var(--xp-border)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-lg tracking-wide">{order.orderId}</p>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-white/60">{new Date(order.createdAt).toLocaleString()}</p>
                  {/* Print-ready files (300 DPI for the ordered size, enhanced
                      where needed) - same links as in the order email. */}
                  {order.downloads?.all && order.items.length > 1 && (
                    <a href={order.downloads.all} download className="btn-primary px-3 py-1.5 text-xs font-semibold">
                      ⬇ Download all ({order.items.length})
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="text-sm text-white/70">
                  <p>{order.customer.name}</p>
                  <p className="text-white/60">{order.customer.email}</p>
                  <p className="text-white/60">{order.customer.phone}</p>
                  <p className="text-white/60">{order.customer.address}</p>
                </div>
                <div>
                  <ul className="space-y-3 text-sm">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        {/* Clicking the thumbnail opens the full-resolution
                            image in a new tab - important for customizable
                            posters, where you actually need to look closely
                            before printing. */}
                        <a
                          href={item.image}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0"
                          aria-label={`Open full-size image for ${item.name}`}
                        >
                          <PosterImage src={item.image} alt={item.name} aspect="aspect-[3/4]" className="w-12" width={100} />
                        </a>
                        <div className="flex-1">
                          <div className="flex justify-between text-white/70">
                            <span>
                              {item.name} × {item.qty}
                            </span>
                            <span>₹{item.qty * item.price}</span>
                          </div>
                          {item.width && item.height && (
                            <p className="text-xs text-white/60">{item.width} × {item.height}px</p>
                          )}
                          {item.notes && <p className="text-xs text-white/60">Notes: {item.notes}</p>}
                          {order.downloads?.items?.[i] && (
                            <a
                              href={order.downloads.items[i]}
                              download
                              className="mt-1 inline-block border border-[var(--xp-accent)] px-2 py-0.5 text-[11px] text-[var(--xp-accent-bright)] transition-colors hover:bg-[var(--xp-accent)] hover:text-[#0c0b09]"
                            >
                              ⬇ {String(item.size || "a4").toUpperCase()} print file
                            </a>
                          )}
                          {/* Small custom image ordered after the month's
                              cloud-AI limit: make the sharp version with the
                              free AI on this computer. */}
                          {item.sourceImage && (
                            <Link
                              to={`/admin/print?src=${encodeURIComponent(item.sourceImage)}&size=${item.size || "a4"}&engine=local`}
                              className="ml-2 mt-1 inline-block border border-emerald-400/60 px-2 py-0.5 text-[11px] text-emerald-300 transition-colors hover:bg-emerald-500 hover:text-[#06281c]"
                            >
                              ✨ Make sharper (free AI)
                            </Link>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {(order.discountAmount > 0 || order.packDealAmount > 0) && (
                    <>
                      <div className="mt-2 flex justify-between border-t border-[var(--xp-border)] pt-2 text-sm text-white/60">
                        <span>Items total</span>
                        <span>₹{order.items.reduce((sum, item) => sum + item.qty * item.price, 0)}</span>
                      </div>
                      {order.discountAmount > 0 && (
                        <div className="mt-1 flex justify-between text-sm text-[var(--xp-accent-bright)]">
                          <span>Bundle discount ({order.discountPercent}%)</span>
                          <span>-₹{order.discountAmount}</span>
                        </div>
                      )}
                      {order.packDealAmount > 0 && (
                        <div className="mt-1 flex justify-between text-sm text-[var(--xp-accent-bright)]">
                          <span>Pack deal (A4 / A5)</span>
                          <span>-₹{order.packDealAmount}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div
                    className={`flex justify-between text-sm font-medium ${
                      order.discountAmount > 0 || order.packDealAmount > 0 ? "mt-1" : "mt-2 border-t border-[var(--xp-border)] pt-2"
                    }`}
                  >
                    <span>Total</span>
                    <span>₹{order.subtotal}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}


// ---------------------------------------------------------------------------
// Admin "Print files" tool (/admin/print): upload any image or paste a link
// (Pinterest pins too), pick A3 / A4 / A5, and get a print-ready JPEG at
// 300 DPI. Small images are AI-upscaled so they print sharp:
//  - Cloud AI (Cloudinary) while this month's limit lasts - fastest;
//  - after that (or whenever chosen) a free AI that runs right here in the
//    browser on this computer (Real-ESRGAN, see public/models), unlimited.
// Lives in this file with the orders page since both are about getting
// files ready to print.
// ---------------------------------------------------------------------------
const PRINT_SIZES = [
  { slug: "a5", label: "A5", px: "1740 × 2490", w: 5.8, h: 8.3 },
  { slug: "a4", label: "A4", px: "2490 × 3510", w: 8.3, h: 11.7 },
  { slug: "a3", label: "A3", px: "3510 × 4950", w: 11.7, h: 16.5 },
];
const FITS = [
  { id: "", label: "Original shape", hint: "Whole image, no crop - at least 300 DPI" },
  { id: "fill", label: "Fill the page", hint: "Exact paper size - edges cropped" },
  { id: "fit", label: "Fit on page", hint: "Exact paper size - white border" },
];
const ENGINES = [
  { id: "auto", label: "Auto", hint: "Cloud AI while this month's limit lasts, then free AI on this computer" },
  { id: "local", label: "Free AI on this computer", hint: "Unlimited and free - uses this computer's graphics chip" },
];

function formatMB(bytes) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// --- Free AI upscaler that runs in this browser -----------------------------
// Real-ESRGAN "general x4v3" (BSD-3, ~5 MB, served from /models) run with
// ONNX Runtime Web - on the graphics chip (WebGPU) when the browser has it,
// otherwise on the processor (slower). The runtime (~30 MB) is fetched from
// a CDN the first time and then cached by the browser.
const ORT_BASE = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/";
const MODEL_URL = "/models/realesr-general-x4v3.onnx";
let upscalerPromise = null;

// A real graphics chip (not the slow software stand-in some browsers offer).
async function hasWebGPU() {
  try {
    const adapter = navigator.gpu && (await navigator.gpu.requestAdapter());
    return Boolean(adapter && !adapter.isFallbackAdapter && !adapter.info?.isFallbackAdapter);
  } catch {
    return false;
  }
}

function loadUpscaler() {
  if (!upscalerPromise) {
    upscalerPromise = (async () => {
      const ort = await import(/* @vite-ignore */ `${ORT_BASE}ort.webgpu.min.mjs`);
      ort.env.wasm.wasmPaths = ORT_BASE;
      ort.env.wasm.numThreads = globalThis.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 2) : 1;
      const gpu = await hasWebGPU();
      let session;
      try {
        session = await ort.InferenceSession.create(MODEL_URL, { executionProviders: gpu ? ["webgpu"] : ["wasm"], graphOptimizationLevel: "all" });
      } catch (err) {
        if (!gpu) throw err;
        session = await ort.InferenceSession.create(MODEL_URL, { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
        return { ort, session, gpu: false };
      }
      return { ort, session, gpu };
    })().catch((err) => {
      upscalerPromise = null;
      throw err;
    });
  }
  return upscalerPromise;
}

// One 4x AI pass over a canvas, tile by tile (keeps memory low and the page
// responsive); returns a new canvas 4x as wide and tall.
async function upscaleX4(up, srcCanvas, onProgress) {
  const { ort, session } = up;
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const src = srcCanvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  const T = up.gpu ? 256 : 128; // tile
  const P = 12; // overlap, so tile seams never show
  const out = document.createElement("canvas");
  out.width = w * 4;
  out.height = h * 4;
  const octx = out.getContext("2d");
  const total = Math.ceil(w / T) * Math.ceil(h / T);
  let done = 0;
  for (let ty = 0; ty < h; ty += T) {
    for (let tx = 0; tx < w; tx += T) {
      // Same-size windows where possible (the GPU reuses its compiled work).
      const ww = Math.min(w, T + 2 * P);
      const wh = Math.min(h, T + 2 * P);
      const x0 = Math.min(Math.max(0, tx - P), w - ww);
      const y0 = Math.min(Math.max(0, ty - P), h - wh);
      const plane = ww * wh;
      const input = new Float32Array(3 * plane);
      for (let y = 0; y < wh; y++) {
        for (let x = 0; x < ww; x++) {
          const si = ((y0 + y) * w + x0 + x) * 4;
          const di = y * ww + x;
          input[di] = src[si] / 255;
          input[plane + di] = src[si + 1] / 255;
          input[2 * plane + di] = src[si + 2] / 255;
        }
      }
      const result = await session.run({ input: new ort.Tensor("float32", input, [1, 3, wh, ww]) });
      const tensor = result.output;
      const od = tensor.data instanceof Float32Array ? tensor.data : await tensor.getData();
      const OW = ww * 4;
      const OP = OW * wh * 4;
      const ix0 = (tx - x0) * 4;
      const iy0 = (ty - y0) * 4;
      const iw = Math.min(T, w - tx) * 4;
      const ih = Math.min(T, h - ty) * 4;
      const img = octx.createImageData(iw, ih);
      for (let y = 0; y < ih; y++) {
        for (let x = 0; x < iw; x++) {
          const si = (iy0 + y) * OW + ix0 + x;
          const di = (y * iw + x) * 4;
          img.data[di] = od[si] * 255 + 0.5;
          img.data[di + 1] = od[OP + si] * 255 + 0.5;
          img.data[di + 2] = od[2 * OP + si] * 255 + 0.5;
          img.data[di + 3] = 255;
        }
      }
      octx.putImageData(img, tx * 4, ty * 4);
      tensor.dispose?.();
      onProgress(++done / total);
      await new Promise((r) => setTimeout(r));
    }
  }
  return out;
}

// Image -> AI-upscaled JPEG (close to the print size; the server then
// finishes it to exactly 300 DPI). Returns null when the image is already big
// enough not to need AI.
async function localAiUpscale(blob, sizeSlug, fit, onStage) {
  const bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
  const w = bmp.width;
  const h = bmp.height;
  const s = PRINT_SIZES.find((x) => x.slug === sizeSlug);
  const portrait = h >= w;
  const tw = Math.round((portrait ? s.w : s.h) * 300);
  const th = Math.round((portrait ? s.h : s.w) * 300);
  const scale = fit === "fit" ? Math.min(tw / w, th / h) : Math.max(tw / w, th / h);
  if (scale < 1.6) {
    bmp.close();
    return null;
  }
  onStage("Loading the free AI (first time only, ~30 MB)…");
  const up = await loadUpscaler();
  // Two passes (16x) only on a graphics chip; on the processor one pass
  // aimed a bit under print size keeps it to a couple of minutes.
  const passes = scale > 4.4 && up.gpu ? 2 : 1;
  const reach = up.gpu ? 1.05 : 0.75;
  const pre = Math.min(1, (reach * scale) / 4 ** passes);
  let canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * pre));
  canvas.height = Math.max(1, Math.round(h * pre));
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  for (let p = 0; p < passes; p++) {
    canvas = await upscaleX4(up, canvas, (f) =>
      onStage(`Free AI on this computer${up.gpu ? "" : " (no graphics chip - slower)"}: ${Math.round(((p + f) / passes) * 100)}%`)
    );
  }
  onStage("Finishing the print file…");
  const out = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));
  return { blob: out, width: w, height: h };
}

export function AdminPrintTool() {
  const [params] = useSearchParams();
  const startSrc = params.get("src") || "";
  const [mode, setMode] = useState(startSrc ? "link" : "upload"); // "upload" | "link"
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [link, setLink] = useState(startSrc);
  const [size, setSize] = useState(PRINT_SIZES.some((x) => x.slug === params.get("size")) ? params.get("size") : "a4");
  const [fit, setFit] = useState("");
  const [engine, setEngine] = useState(params.get("engine") === "local" ? "local" : "auto");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { url, info, name }
  const [usage, setUsage] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const autoRan = useRef(false);

  const refreshUsage = () => fetchAiUsage().then(setUsage).catch(() => {});
  useEffect(() => {
    refreshUsage();
  }, []);

  // Free the previews' memory when they're replaced.
  useEffect(() => () => filePreview && URL.revokeObjectURL(filePreview), [filePreview]);
  useEffect(() => () => result && URL.revokeObjectURL(result.url), [result]);

  function pick(f) {
    if (!f || !f.type.startsWith("image/")) {
      setError("Choose an image file (JPG, PNG, WEBP…).");
      return;
    }
    setFile(f);
    setFilePreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  }

  const hasSource = mode === "upload" ? !!file : link.trim().length > 4;
  const cloudLeft = usage ? usage.enabled && usage.used < usage.limit : true;

  function finish({ blob, info }, nextSize, local) {
    const base = mode === "upload" ? file.name.replace(/\.[^.]+$/, "") : "xposters";
    const label = PRINT_SIZES.find((x) => x.slug === nextSize).label;
    setResult({
      url: URL.createObjectURL(blob),
      info: { ...info, bytes: info.bytes || blob.size },
      name: `${base.replace(/[^\w-]+/g, "-").slice(0, 40)}_${label}${local ? "_AI" : ""}_print.jpg`,
    });
  }

  async function sendToServer(image, nextSize, extra = {}) {
    const fd = new FormData();
    fd.append("size", nextSize);
    fd.append("fit", fit);
    if (image) {
      const fitted = await fitForUpload(image);
      fd.append("image", fitted, fitted.name || "image.jpg");
    }
    else fd.append("imageLink", link.trim());
    for (const [k, v] of Object.entries(extra)) fd.append(k, v);
    return makePrintFile(fd);
  }

  // Free AI here in the browser, then the server finishes it to 300 DPI.
  async function runLocal(nextSize) {
    setStage("Getting the image…");
    const source = mode === "upload" ? file : await fetchPrintSource(link.trim());
    const ai = await localAiUpscale(source, nextSize, fit, setStage);
    setStage("Finishing the print file…");
    if (!ai) return { ...(await sendToServer(source, nextSize)), local: false };
    const out = await sendToServer(ai.blob, nextSize, { ai: "local" });
    // Report the real original size, not the AI-enlarged one we sent.
    return { ...out, info: { ...out.info, originalWidth: ai.width, originalHeight: ai.height, upscaled: true }, local: true };
  }

  async function run(nextSize = size) {
    if (!hasSource || busy) return;
    setSize(nextSize);
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      let out;
      if (engine === "local" || !cloudLeft) {
        out = await runLocal(nextSize);
      } else {
        setStage(`AI-enhancing to ${PRINT_SIZES.find((x) => x.slug === nextSize).label} at 300 DPI…`);
        out = await sendToServer(mode === "upload" ? file : null, nextSize);
        // The image needed AI but the cloud couldn't (limit reached / not
        // available): do it with the free AI on this computer instead.
        if (["limit", "error", "off"].includes(out.info.aiStatus)) {
          out = await runLocal(nextSize);
        }
        refreshUsage();
      }
      finish(out, nextSize, out.local || out.info.aiStatus === "local");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Couldn't make the print file - please try again.");
    } finally {
      setBusy(false);
      setStage("");
    }
  }

  // Opened from an order's "Make sharper" button: start straight away.
  useEffect(() => {
    if (startSrc && params.get("engine") === "local" && !autoRan.current) {
      autoRan.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sizeInfo = PRINT_SIZES.find((x) => x.slug === size);
  const resultLabel = result && PRINT_SIZES.find((x) => x.slug === result.info.size)?.label;
  const tab = (active) =>
    `flex-1 border px-4 py-2.5 text-sm transition-colors ${
      active ? "border-[var(--xp-accent)] bg-[var(--xp-accent)] text-[#0c0b09]" : "border-[var(--xp-border-strong)] hover:border-[var(--xp-accent)]"
    }`;
  const chip = (active) =>
    `border px-3 py-2 text-left text-xs transition-colors ${
      active ? "border-[var(--xp-accent)] bg-[var(--xp-accent)] text-[#0c0b09]" : "border-[var(--xp-border-strong)] hover:border-[var(--xp-accent)]"
    }`;
  const aiText = (info) => {
    if (!info.upscaled) return `Original was already ${info.originalWidth} × ${info.originalHeight}px - kept sharp, no upscaling needed`;
    const how = info.aiStatus === "local" ? "AI-enhanced on this computer" : info.ai ? "AI-enhanced (cloud)" : "Enhanced";
    return `${how} from ${info.originalWidth} × ${info.originalHeight}px`;
  };

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl">Print files</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/65">
        Upload any image or paste a link (Pinterest pins work too). Pick A3, A4 or A5 and you get a print-ready JPEG at 300 DPI - small or blurry
        images are rebuilt with AI upscaling, so even a 140p image prints sharp. A4 comes out bigger than a 4K screen; A3 is about twice that.
      </p>
      {usage && (
        <p className="mt-3 text-xs text-white/60">
          Cloud AI this month:{" "}
          <span className={cloudLeft ? "text-emerald-300" : "text-amber-300"}>
            {usage.enabled ? `${usage.used} of ${usage.limit} used` : "not available"}
          </span>
          {!cloudLeft && " - the free AI on this computer is used instead (unlimited)."}
        </p>
      )}

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.1fr]">
        {/* Before / after */}
        <div>
          <div className="poster-frame relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-black/30">
            {result ? (
              <img src={result.url} alt="Print file preview" className="loaded h-full w-full object-contain" />
            ) : mode === "upload" && filePreview ? (
              <img src={filePreview} alt="Your image" className="loaded h-full w-full object-contain" />
            ) : mode === "link" && /^https:\/\/res\.cloudinary\.com\//.test(link.trim()) ? (
              <img src={link.trim()} alt="Your image" className="loaded h-full w-full object-contain" />
            ) : (
              <span className="poster-fallback px-6 text-center">The print file will appear here</span>
            )}
            {busy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 px-6 text-center">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--xp-accent)] border-t-transparent" />
                <p className="text-sm text-[var(--xp-accent-bright)]">{stage || `AI-enhancing to ${sizeInfo.label} at 300 DPI…`}</p>
                <p className="text-xs text-white/55">Big sizes can take a minute or two.</p>
              </div>
            )}
          </div>
          {result && !busy && (
            <div className="mt-3 border border-[var(--xp-accent-dim)] bg-[var(--xp-accent)]/10 px-3 py-2.5 text-xs text-[var(--xp-accent-bright)]">
              <p>
                ✓ {resultLabel} print file · {result.info.width} × {result.info.height}px · {result.info.dpi || 300} DPI · {formatMB(result.info.bytes)}
              </p>
              {result.info.originalWidth && <p className="mt-0.5 text-white/60">{aiText(result.info)}</p>}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-6">
          <div>
            <div className="flex gap-2">
              <button type="button" className={tab(mode === "upload")} onClick={() => { setMode("upload"); setResult(null); setError(null); }}>
                Upload a file
              </button>
              <button type="button" className={tab(mode === "link")} onClick={() => { setMode("link"); setResult(null); setError(null); }}>
                Paste a link / Pinterest
              </button>
            </div>
            {mode === "upload" ? (
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  pick(e.dataTransfer.files?.[0]);
                }}
                className={`mt-3 flex cursor-pointer flex-col items-center justify-center gap-1 border border-dashed px-4 py-7 text-center text-sm transition-colors ${
                  dragOver ? "border-[var(--xp-accent)] bg-[var(--xp-accent)]/10" : "border-[var(--xp-border-strong)] hover:border-[var(--xp-accent)]"
                }`}
              >
                <span className="text-[var(--xp-accent-bright)]">{file ? file.name : "Drop an image here or click to choose"}</span>
                <span className="text-xs text-white/50">{file ? `${formatMB(file.size)} · click to change` : "JPG, PNG or WEBP - big files are resized to upload"}</span>
                <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
              </label>
            ) : (
              <>
                <input
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  value={link}
                  onChange={(e) => {
                    setLink(e.target.value);
                    setResult(null);
                  }}
                  placeholder="Image link or Pinterest pin (pin.it/…)"
                  className="mt-3 w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
                />
                <p className="mt-2 text-xs text-white/55">Pinterest: open the pin → Share → Copy link. The full-size original is used, not the small preview.</p>
              </>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs text-white/60">Print size (300 DPI)</p>
            <div className="grid grid-cols-3 gap-2">
              {PRINT_SIZES.map((x) => (
                <button key={x.slug} type="button" className={chip(size === x.slug)} onClick={() => { setSize(x.slug); setResult(null); }}>
                  <span className="block text-sm font-semibold">{x.label}</span>
                  <span className="block opacity-75">{x.px}px</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs text-white/60">Page</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {FITS.map((f) => (
                <button key={f.id || "keep"} type="button" className={chip(fit === f.id)} onClick={() => { setFit(f.id); setResult(null); }}>
                  <span className="block font-semibold">{f.label}</span>
                  <span className="block opacity-75">{f.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs text-white/60">AI for small images</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ENGINES.map((e) => (
                <button key={e.id} type="button" className={chip(engine === e.id)} onClick={() => { setEngine(e.id); setResult(null); }}>
                  <span className="block font-semibold">{e.label}</span>
                  <span className="block opacity-75">{e.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <p role="alert" className="form-error">{error}</p>}

          <div className="flex flex-wrap gap-3 border-t border-[var(--xp-border)] pt-5">
            {result && !busy ? (
              <>
                <a href={result.url} download={result.name} className="btn-primary px-6 py-3 text-sm font-semibold">
                  ⬇ Download {resultLabel} print file
                </a>
                {PRINT_SIZES.filter((x) => x.slug !== result.info.size).map((x) => (
                  <button key={x.slug} type="button" onClick={() => run(x.slug)} className="btn-outline px-4 py-3 text-sm">
                    Make {x.label} too
                  </button>
                ))}
              </>
            ) : (
              <button type="button" onClick={() => run()} disabled={!hasSource || busy} className="btn-primary px-6 py-3 text-sm font-semibold disabled:opacity-50">
                {busy ? "Working…" : `Enhance & make ${sizeInfo.label} print file`}
              </button>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
