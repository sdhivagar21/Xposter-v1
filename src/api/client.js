// Tiny fetch-based API client for the XPOSTERS backend (replaces axios, which
// was ~14KB of JavaScript every visitor had to download just to make a few
// JSON calls). See LIVE_API below for where the live site's backend is.
//
// Same call shape the rest of the app already uses:
//   apiClient.get(url, { params, headers }), .delete(url, config),
//   .post(url, body, config), .put(url, body, config)  ->  resolves { data }
// Non-2xx responses reject with an Error carrying err.response = { status, data },
// so existing `err.response?.data?.message` handling keeps working. A FormData
// body is sent as-is so the browser adds the multipart boundary itself.

// The live backend: the "xposters-backend" project on Vercel (moved from
// Render on 30 Oct 2026). Production builds always use it unless VITE_API_URL
// is set; local dev keeps using VITE_API_BASE_URL (see test-locally.bat).
export const LIVE_API = "https://xposters-backend.vercel.app/api";
const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? LIVE_API : import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api");

// The backend host accepts at most ~4.5 MB per request, so images are
// re-encoded (and only if still needed, scaled down) to stay under 4 MB
// before uploading. Small files pass through untouched.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export async function fitForUpload(file, maxBytes = MAX_UPLOAD_BYTES) {
  if (!file || file.size <= maxBytes || !/^image\//.test(file.type || "")) return file;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  const name = String(file.name || "image").replace(/\.[^.]+$/, "") + ".jpg";
  let scale = Math.min(1, 6000 / Math.max(bitmap.width, bitmap.height));
  let quality = 0.92;
  try {
    for (let attempt = 0; attempt < 10; attempt++) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= maxBytes) return new File([blob], name, { type: "image/jpeg" });
      if (quality > 0.83) quality -= 0.04;
      else scale *= 0.85;
    }
  } finally {
    bitmap.close();
  }
  return file;
}

async function request(method, url, { body, params, headers, timeout } = {}) {
  let full = baseURL + url;
  if (params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") qs.append(k, v);
    }
    const s = qs.toString();
    if (s) full += (full.includes("?") ? "&" : "?") + s;
  }

  const init = { method, headers: { ...(headers || {}) } };
  if (body !== undefined) {
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      init.body = body;
      // Let the browser set multipart/form-data with its boundary.
      for (const k of Object.keys(init.headers)) if (k.toLowerCase() === "content-type") delete init.headers[k];
    } else {
      init.body = JSON.stringify(body);
      if (!init.headers["Content-Type"]) init.headers["Content-Type"] = "application/json";
    }
  }
  if (timeout) init.signal = AbortSignal.timeout(timeout);

  let res;
  try {
    res = await fetch(full, init);
  } catch (cause) {
    const err = new Error(cause && cause.name === "TimeoutError" ? "Request timed out" : "Network Error");
    err.cause = cause;
    throw err;
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const err = new Error(`Request failed with status code ${res.status}`);
    err.response = { status: res.status, data };
    throw err;
  }
  return { data, status: res.status };
}

const apiClient = {
  defaults: { baseURL },
  get: (url, config) => request("GET", url, config),
  delete: (url, config) => request("DELETE", url, config),
  post: (url, body, config) => request("POST", url, { ...config, body }),
  put: (url, body, config) => request("PUT", url, { ...config, body }),
};

export default apiClient;
