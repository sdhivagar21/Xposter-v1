import imageManifest from "./imageManifest.json";
import { CATEGORIES, getCategoryName } from "./categories.js";
import { getStoredReviews, addStoredReview } from "./reviewsStorage.js";

function filenameToTitle(filename) {
  const stem = filename.replace(/\.[^.]+$/, "");
  return stem
    .replace(/[-_]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function filenameToPrice(filename) {
  let hash = 0;
  for (let i = 0; i < filename.length; i++) {
    hash = (hash * 31 + filename.charCodeAt(i)) >>> 0;
  }
  const steps = [249, 269, 289, 299, 319, 339, 349, 369, 379, 399, 419, 449, 479, 499];
  return steps[hash % steps.length];
}

function productFromImage(categorySlug, filename, index) {
  const id = `${categorySlug}__${filename}`;
  return {
    id,
    name: filenameToTitle(filename),
    price: filenameToPrice(filename),
    category: categorySlug,
    image: `/images/${categorySlug}/${filename}`,
    featured: index === 0,
    description: "",
    reviews: getStoredReviews(id),
  };
}

function buildCatalog() {
  const catalog = [];
  for (const cat of CATEGORIES) {
    const images = imageManifest[cat.slug] || [];
    images.forEach((filename, i) => catalog.push(productFromImage(cat.slug, filename, i)));
  }
  return catalog;
}

export function getProductById(id) {
  return buildCatalog().find((p) => p.id === id);
}

export function getProductsByCategory(slug, sort) {
  let list = buildCatalog().filter((p) => p.category === slug);
  if (sort === "price-asc") list = list.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") list = list.sort((a, b) => b.price - a.price);
  return list;
}

export function getAllProducts() {
  return buildCatalog();
}

export function getFeaturedProducts() {
  return buildCatalog().filter((p) => p.featured);
}

export function getRelatedProducts(product, limit = 6) {
  return buildCatalog()
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}

export function searchProducts(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return buildCatalog().filter((p) => {
    if (p.name.toLowerCase().includes(q)) return true;
    return getCategoryName(p.category).toLowerCase().includes(q);
  });
}

export function averageRating(product) {
  if (!product?.reviews || product.reviews.length === 0) return 0;
  const sum = product.reviews.reduce((acc, r) => acc + r.rating, 0);
  return sum / product.reviews.length;
}

export function addReview(productId, review) {
  addStoredReview(productId, review);
  return getProductById(productId);
}