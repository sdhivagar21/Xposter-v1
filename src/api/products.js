import * as localCatalog from "../data/localCatalog.js";

export async function fetchProducts({ category, sort, q } = {}) {
  if (q) return localCatalog.searchProducts(q);
  if (category) return localCatalog.getProductsByCategory(category, sort);
  return localCatalog.getAllProducts();
}

export async function fetchFeaturedProducts() {
  return localCatalog.getFeaturedProducts();
}

export async function fetchProduct(id) {
  const product = localCatalog.getProductById(id);
  if (!product) throw new Error("Product not found");
  return product;
}

export async function fetchRelatedProducts(id, limit = 6) {
  const product = localCatalog.getProductById(id);
  if (!product) return [];
  return localCatalog.getRelatedProducts(product, limit);
}

export async function submitReview(id, { name, rating, comment }) {
  const updated = localCatalog.addReview(id, { name, rating: Number(rating), comment });
  if (!updated) throw new Error("Product not found");
  return updated;
}

export function averageRating(product) {
  return localCatalog.averageRating(product);
}