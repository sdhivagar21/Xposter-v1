import apiClient, { fitForUpload } from "./client.js";

const TOKEN_KEY = "xposters_admin_token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// The timeout turns a backend that never answers into a clear error instead
// of an endless "Signing in…" - long enough for Render's free tier to wake.
export async function adminLogin(email, password) {
  const { data } = await apiClient.post("/admin/login", { email, password }, { timeout: 90000 });
  return data; // { token, admin }
}

export async function fetchAdminMe() {
  const { data } = await apiClient.get("/admin/me", { headers: authHeaders() });
  return data;
}

// Returns { products, total, page, pageSize, totalPages }
export async function fetchAdminProducts({ category, q, page, limit } = {}) {
  const params = {};
  if (category) params.category = category;
  if (q) params.q = q;
  if (page) params.page = page;
  if (limit) params.limit = limit;
  const { data } = await apiClient.get("/admin/products", { headers: authHeaders(), params });
  return data;
}

// `fields` is a plain object; `imageFile` is an optional File from an <input type="file">.
function buildProductFormData(fields, imageFile) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  if (imageFile) formData.append("image", imageFile);
  return formData;
}

export async function createAdminProduct(fields, imageFile) {
  const formData = buildProductFormData(fields, await fitForUpload(imageFile));
  const { data } = await apiClient.post("/admin/products", formData, {
    headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateAdminProduct(id, fields, imageFile) {
  const formData = buildProductFormData(fields, await fitForUpload(imageFile));
  const { data } = await apiClient.put(`/admin/products/${id}`, formData, {
    headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteAdminProduct(id) {
  const { data } = await apiClient.delete(`/admin/products/${id}`, { headers: authHeaders() });
  return data;
}

export async function fetchAdminOrders() {
  const { data } = await apiClient.get("/admin/orders", { headers: authHeaders() });
  return data;
}

// Returns { total, orders, month, monthOrders, since, milestones: { reached: [{ amount, reachedAt }], next } }
// since is when the total was last reset to zero, or null.
export async function fetchAdminStats() {
  const { data } = await apiClient.get("/admin/stats", { headers: authHeaders() });
  return data;
}

// Permanently deletes every order and starts the total and milestones from
// zero. Returns the fresh stats (same shape as fetchAdminStats) plus
// deletedOrders, the number of orders removed.
export async function resetAdminStats() {
  const { data } = await apiClient.post("/admin/stats/reset", { confirm: "DELETE" }, { headers: authHeaders() });
  return data;
}
// Admin "Print files" tool: sends an image (or a link - Pinterest pins work)
// with the size (a3/a4/a5) and page fit, and gets back the enhanced
// print-ready JPEG plus its details (pixel size, original size...). Uses
// fetch directly because the answer is an image, not JSON.
export async function makePrintFile(formData) {
  let res;
  try {
    res = await fetch(`${apiClient.defaults.baseURL}/admin/print`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
      signal: AbortSignal.timeout(240000),
    });
  } catch (cause) {
    throw new Error(cause?.name === "TimeoutError" ? "That took too long - try again, or a smaller image." : "Couldn't reach the server - check your connection.");
  }
  if (!res.ok) {
    let message = "";
    try {
      message = (await res.json()).message;
    } catch {
      // not JSON
    }
    const err = new Error(message || `Request failed (${res.status})`);
    err.response = { status: res.status, data: { message } };
    throw err;
  }
  let info = {};
  try {
    info = JSON.parse(res.headers.get("X-Print-Info") || "{}");
  } catch {
    // details are optional
  }
  return { blob: await res.blob(), info };
}

// { month, used, limit, enabled } - Cloudinary AI upscales used this month.
export async function fetchAiUsage() {
  const { data } = await apiClient.get("/admin/ai-usage", { headers: authHeaders() });
  return data;
}

// The original image behind a link (Pinterest pins resolved to the full-size
// original), as a Blob - for the free AI that runs in this browser.
export async function fetchPrintSource(imageLink) {
  const res = await fetch(`${apiClient.defaults.baseURL}/admin/print/source`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ imageLink }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) {
    let message = "";
    try {
      message = (await res.json()).message;
    } catch {
      // not JSON
    }
    throw new Error(message || "Couldn't load that image link.");
  }
  return res.blob();
}
