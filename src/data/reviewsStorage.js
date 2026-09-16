const STORAGE_KEY = "xposters_reviews";

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getStoredReviews(productId) {
  const all = loadAll();
  return all[productId] || [];
}

export function addStoredReview(productId, review) {
  const all = loadAll();
  const existing = all[productId] || [];
  const newReview = { id: `local-${Date.now()}`, ...review };
  all[productId] = [...existing, newReview];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return newReview;
}