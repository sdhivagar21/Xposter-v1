// Tiny fetch-based API client for the XPOSTERS backend (replaces axios, which
// was ~14KB of JavaScript every visitor had to download just to make a few
// JSON calls). Point VITE_API_BASE_URL (see .env) at your deployed backend,
// e.g. https://xposters-backend.onrender.com/api
//
// Same call shape the rest of the app already uses:
//   apiClient.get(url, { params, headers }), .delete(url, config),
//   .post(url, body, config), .put(url, body, config)  ->  resolves { data }
// Non-2xx responses reject with an Error carrying err.response = { status, data },
// so existing `err.response?.data?.message` handling keeps working. A FormData
// body is sent as-is so the browser adds the multipart boundary itself.

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

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
