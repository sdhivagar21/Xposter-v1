import apiClient from "./client.js";

// Returns { products, total, page, pageSize, totalPages }
export async function fetchProducts({ category, sort, q, page, limit } = {}) {
  const params = {};
  if (category) params.category = category;
  if (sort) params.sort = sort;
  if (q) params.q = q;
  if (page) params.page = page;
  if (limit) params.limit = limit;
  const { data } = await apiClient.get("/products", { params });
  return data;
}

export async function fetchFeaturedProducts() {
  const { data } = await apiClient.get("/products/featured");
  return data;
}

// Returns { [categorySlug]: [product, ...] } - up to `limit` newest per
// category, for the homepage collection rows.
export async function fetchHomeSections(limit = 10) {
  const { data } = await apiClient.get("/products/sections", { params: { limit } });
  return data;
}

// Returns { [categorySlug]: { count, cover } } for the /collections tiles.
export async function fetchCollectionsSummary() {
  const { data } = await apiClient.get("/products/collections-summary");
  return data;
}

export async function fetchProduct(id) {
  const { data } = await apiClient.get(`/products/${id}`);
  return data;
}

export async function fetchRelatedProducts(id, limit = 6) {
  const { data } = await apiClient.get(`/products/${id}/related`, { params: { limit } });
  return data;
}

export async function submitReview(id, { name, rating, comment }) {
  const { data } = await apiClient.post(`/products/${id}/reviews`, { name, rating, comment });
  return data;
}

export function averageRating(product) {
  if (!product?.reviews || product.reviews.length === 0) return 0;
  const sum = product.reviews.reduce((acc, r) => acc + r.rating, 0);
  return sum / product.reviews.length;
}