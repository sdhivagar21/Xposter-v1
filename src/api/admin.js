import apiClient from "./client.js";

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
  const formData = buildProductFormData(fields, imageFile);
  const { data } = await apiClient.post("/admin/products", formData, {
    headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateAdminProduct(id, fields, imageFile) {
  const formData = buildProductFormData(fields, imageFile);
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