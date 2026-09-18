# XPOSTERS FRONTEND - performance fix (paginated pages, lightweight home/collections fetch, admin filters)
# Run this from INSIDE your project folder (same place you'd run 'npm install').
# It overwrites the listed files with the updated versions, nothing else.

try {
    $Utf8NoBom = New-Object System.Text.UTF8Encoding $false
    $ProjectDir = (Get-Location).Path
    Write-Host "Working in: $ProjectDir" -ForegroundColor Cyan

    $target = Join-Path $ProjectDir "src\api\products.js"
    Write-Host "Writing src\api\products.js ..." -ForegroundColor Yellow
    $content = @'
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
'@
    $targetDir = Split-Path $target -Parent
    if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
    [System.IO.File]::WriteAllText($target, $content, $Utf8NoBom)

    $target = Join-Path $ProjectDir "src\api\admin.js"
    Write-Host "Writing src\api\admin.js ..." -ForegroundColor Yellow
    $content = @'
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

export async function adminLogin(email, password) {
  const { data } = await apiClient.post("/admin/login", { email, password });
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
'@
    $targetDir = Split-Path $target -Parent
    if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
    [System.IO.File]::WriteAllText($target, $content, $Utf8NoBom)

    $target = Join-Path $ProjectDir "src\pages\Home.jsx"
    Write-Host "Writing src\pages\Home.jsx ..." -ForegroundColor Yellow
    $content = @'
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { CATEGORIES } from "../data/categories.js";
import { fetchHomeSections, fetchFeaturedProducts } from "../api/products.js";
import PosterWallRow from "../components/PosterWallRow.jsx";
import CategoryChip from "../components/CategoryChip.jsx";
import ProductCard from "../components/ProductCard.jsx";

export default function Home() {
  const [sections, setSections] = useState({});
  const [rows, setRows] = useState({ rowA: [], rowB: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Only pulls up to 10 newest posters per category (server-side) plus the
    // featured set for the wall - not the entire catalog.
    Promise.all([fetchHomeSections(10), fetchFeaturedProducts()])
      .then(([sectionsData, featured]) => {
        if (cancelled) return;
        setSections(sectionsData);
        // Shuffled between two marquee rows scrolling in opposite directions.
        const shuffled = [...featured].sort(() => Math.random() - 0.5);
        const mid = Math.ceil(shuffled.length / 2);
        setRows({ rowA: shuffled.slice(0, mid), rowB: shuffled.slice(mid) });
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load the catalog right now - try refreshing.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const categoriesWithProducts = CATEGORIES.map((cat) => ({
    ...cat,
    products: sections[cat.slug] || [],
  })).filter((cat) => cat.products.length > 0);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-16 pt-20 sm:pt-28">
        <div
          className="animate-glow-pulse pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--xp-accent)]/[0.12] blur-[110px]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="animate-hero-rise font-display text-6xl leading-none sm:text-8xl">
            XPOSTERS
          </h1>
          <p
            className="animate-hero-rise mx-auto mt-5 max-w-md text-balance text-white/60"
            style={{ animationDelay: "0.15s" }}
          >
            Big, bold prints for people who like their walls loud. Movies, machines, heroes and mantras - framed for people with taste.
          </p>
          <div className="animate-hero-rise mt-8" style={{ animationDelay: "0.3s" }}>
            <Link
              to="/collections"
              className="btn-primary inline-block px-8 py-3.5 text-sm font-medium"
            >
              Explore Collections
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <p className="mx-auto max-w-6xl px-5 pb-10 text-center text-sm text-white/40">{error}</p>
      )}

      {/* Auto-scrolling poster wall */}
      {(rows.rowA.length > 0 || rows.rowB.length > 0) && (
        <section className="space-y-4 py-4">
          {rows.rowA.length > 0 && <PosterWallRow products={rows.rowA} direction="left" />}
          {rows.rowB.length > 0 && <PosterWallRow products={rows.rowB} direction="right" />}
        </section>
      )}

      {/* Quick category chips */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="rail flex gap-3 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <CategoryChip key={cat.slug} slug={cat.slug} name={cat.name} />
          ))}
        </div>
      </section>

      {/* Collection sections */}
      <section className="mx-auto max-w-6xl space-y-14 px-5 pb-20">
        {loading && <p className="text-sm text-white/40">Loading posters...</p>}
        {!loading &&
          categoriesWithProducts.map((cat) => (
            <div key={cat.slug}>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-display text-2xl sm:text-3xl">{cat.name}</h2>
                <Link to={`/collections/${cat.slug}`} className="text-sm text-white/50 transition-colors hover:text-white">
                  View all
                </Link>
              </div>
              <div className="rail flex gap-4 overflow-x-auto pb-2">
                {cat.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))}
      </section>
    </div>
  );
}
'@
    $targetDir = Split-Path $target -Parent
    if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
    [System.IO.File]::WriteAllText($target, $content, $Utf8NoBom)

    $target = Join-Path $ProjectDir "src\pages\Collections.jsx"
    Write-Host "Writing src\pages\Collections.jsx ..." -ForegroundColor Yellow
    $content = @'
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "../data/categories.js";
import { fetchCollectionsSummary } from "../api/products.js";
import PosterImage from "../components/PosterImage.jsx";

export default function Collections() {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // One cover image + count per category - not every product.
    fetchCollectionsSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load collections right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-display text-4xl sm:text-5xl">Collections</h1>
      <p className="mt-3 max-w-md text-white/50">Seven worlds. Pick one and start filling your walls.</p>

      {loading && <p className="mt-10 text-sm text-white/40">Loading collections...</p>}
      {error && <p className="mt-10 text-sm text-white/40">{error}</p>}

      {!loading && !error && (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const info = summary[cat.slug];
            const count = info?.count || 0;
            return (
              <Link key={cat.slug} to={`/collections/${cat.slug}`} className="group block">
                {info?.cover ? (
                  <PosterImage src={info.cover} alt={cat.name} aspect="aspect-[3/4]" />
                ) : (
                  <div className="poster-frame flex aspect-[3/4] items-center justify-center">
                    <span className="poster-fallback">{cat.name}</span>
                  </div>
                )}
                <p className="mt-3 font-display text-lg tracking-wide">{cat.name}</p>
                <p className="text-xs text-white/40">
                  {count} {count === 1 ? "poster" : "posters"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
'@
    $targetDir = Split-Path $target -Parent
    if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
    [System.IO.File]::WriteAllText($target, $content, $Utf8NoBom)

    $target = Join-Path $ProjectDir "src\pages\CategoryPage.jsx"
    Write-Host "Writing src\pages\CategoryPage.jsx ..." -ForegroundColor Yellow
    $content = @'
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCategoryName } from "../data/categories.js";
import { fetchProducts } from "../api/products.js";
import ProductCard from "../components/ProductCard.jsx";

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
];

const PAGE_SIZE = 24;

export default function CategoryPage() {
  const { slug } = useParams();
  const [sort, setSort] = useState("newest");
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const categoryName = getCategoryName(slug);

  // Reset to page 1 whenever the category or sort changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProducts({ category: slug, sort, page: 1, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(1);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this category right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, sort]);

  function loadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    fetchProducts({ category: slug, sort, page: nextPage, limit: PAGE_SIZE })
      .then((data) => {
        setProducts((prev) => [...prev, ...data.products]);
        setPage(nextPage);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError("Couldn't load more posters right now."))
      .finally(() => setLoadingMore(false));
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">{categoryName}</h1>
          <p className="mt-2 text-sm text-white/40">
            {loading ? "Loading..." : `${total} ${total === 1 ? "poster" : "posters"}`}
          </p>
        </div>

        <div className="flex gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSort(opt.id)}
              className={`border px-3 py-2 text-xs transition-colors ${
                sort === opt.id
                  ? "border-[var(--xp-accent)] bg-[var(--xp-accent)] text-[#0c0b09]"
                  : "border-[var(--xp-border-strong)] text-white/70 hover:border-[var(--xp-accent)] hover:text-[var(--xp-accent-bright)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-10 text-sm text-white/40">{error}</p>}

      {!error && !loading && products.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-white/50">No posters in this category yet.</p>
          <Link to="/collections" className="btn-outline mt-4 inline-block px-5 py-2.5 text-sm">
            Browse other collections
          </Link>
        </div>
      )}

      {!error && products.length > 0 && (
        <>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} className="w-full" />
            ))}
          </div>

          {page < totalPages && (
            <div className="mt-10 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-outline px-6 py-2.5 text-sm disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
'@
    $targetDir = Split-Path $target -Parent
    if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
    [System.IO.File]::WriteAllText($target, $content, $Utf8NoBom)

    $target = Join-Path $ProjectDir "src\pages\SearchResults.jsx"
    Write-Host "Writing src\pages\SearchResults.jsx ..." -ForegroundColor Yellow
    $content = @'
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchProducts } from "../api/products.js";
import ProductCard from "../components/ProductCard.jsx";

const PAGE_SIZE = 24;

export default function SearchResults() {
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchProducts({ q: query, page: 1, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setResults(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(1);
      })
      .catch(() => {
        if (!cancelled) setError("Search isn't working right now - try again in a moment.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  function loadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    fetchProducts({ q: query, page: nextPage, limit: PAGE_SIZE })
      .then((data) => {
        setResults((prev) => [...prev, ...data.products]);
        setPage(nextPage);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError("Couldn't load more results right now."))
      .finally(() => setLoadingMore(false));
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-display text-3xl sm:text-4xl">
        Results for "{query}"
      </h1>
      <p className="mt-2 text-sm text-white/40">
        {loading ? "Searching..." : `${total} ${total === 1 ? "poster" : "posters"} found`}
      </p>

      {error && <p className="mt-10 text-sm text-white/40">{error}</p>}

      {!error && !loading && results.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-white/50">Nothing matched that search.</p>
          <Link to="/collections" className="btn-outline mt-4 inline-block px-5 py-2.5 text-sm">
            Browse collections
          </Link>
        </div>
      )}

      {!error && results.length > 0 && (
        <>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} className="w-full" />
            ))}
          </div>

          {page < totalPages && (
            <div className="mt-10 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-outline px-6 py-2.5 text-sm disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
'@
    $targetDir = Split-Path $target -Parent
    if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
    [System.IO.File]::WriteAllText($target, $content, $Utf8NoBom)

    $target = Join-Path $ProjectDir "src\pages\admin\AdminDashboard.jsx"
    Write-Host "Writing src\pages\admin\AdminDashboard.jsx ..." -ForegroundColor Yellow
    $content = @'
import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import ProductFormModal from "../../components/admin/ProductFormModal.jsx";
import { fetchAdminProducts, deleteAdminProduct } from "../../api/admin.js";
import { CATEGORIES, getCategoryName } from "../../data/categories.js";

const PAGE_SIZE = 50;

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [modalMode, setModalMode] = useState(null); // null | "create" | product object being edited
  const [deletingId, setDeletingId] = useState(null);

  function load() {
    setLoading(true);
    fetchAdminProducts({ category: category || undefined, q: q || undefined, page: 1, limit: PAGE_SIZE })
      .then((data) => {
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(1);
      })
      .catch(() => setError("Couldn't load products."))
      .finally(() => setLoading(false));
  }

  // Re-runs whenever the category filter or search term changes.
  useEffect(load, [category, q]);

  function loadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    fetchAdminProducts({ category: category || undefined, q: q || undefined, page: nextPage, limit: PAGE_SIZE })
      .then((data) => {
        setProducts((prev) => [...prev, ...data.products]);
        setPage(nextPage);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError("Couldn't load more products."))
      .finally(() => setLoadingMore(false));
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setQ(searchInput.trim());
  }

  function handleSaved() {
    // Refetch rather than guessing whether the saved product belongs in the
    // current filtered/sorted view.
    setModalMode(null);
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this poster? This can't be undone.")) return;
    setDeletingId(id);
    try {
      await deleteAdminProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch {
      setError("Couldn't delete that product - try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Products</h1>
        <button
          onClick={() => setModalMode("create")}
          className="btn-primary px-4 py-2 text-sm font-medium"
        >
          + Add poster
        </button>
      </div>

      {/* Filter by category and search by name - with 1500+ products this is
          the fastest way to find the poster you want to edit or delete. */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-[var(--xp-border-strong)] bg-transparent px-3 py-2 text-sm text-white/80"
        >
          <option value="" className="bg-[#0c0b09]">All categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.slug} value={cat.slug} className="bg-[#0c0b09]">
              {cat.name}
            </option>
          ))}
        </select>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name..."
            className="border border-[var(--xp-border-strong)] bg-transparent px-3 py-2 text-sm text-white/80 placeholder:text-white/30"
          />
          <button type="submit" className="btn-outline px-4 py-2 text-xs">
            Search
          </button>
          {q && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setQ("");
              }}
              className="text-xs text-white/50 underline-offset-2 hover:text-white hover:underline"
            >
              Clear
            </button>
          )}
        </form>

        {!loading && (
          <span className="text-xs text-white/40">
            {total} {total === 1 ? "product" : "products"}
          </span>
        )}
      </div>

      {error && <p className="mt-6 text-sm text-white/50">{error}</p>}
      {loading && <p className="mt-6 text-sm text-white/40">Loading...</p>}

      {!loading && products.length === 0 && (
        <p className="mt-10 text-sm text-white/40">
          {category || q ? "No products match that filter." : "No products yet - add your first poster above."}
        </p>
      )}

      {!loading && products.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--xp-border)] text-white/40">
                <th className="py-3 pr-4 font-normal">Photo</th>
                <th className="py-3 pr-4 font-normal">Name</th>
                <th className="py-3 pr-4 font-normal">Category</th>
                <th className="py-3 pr-4 font-normal">Price</th>
                <th className="py-3 pr-4 font-normal">Featured</th>
                <th className="py-3 pr-4 font-normal">Reviews</th>
                <th className="py-3 pr-4 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-[var(--xp-border)]">
                  <td className="py-3 pr-4">
                    <img src={p.image} alt={p.name} className="h-14 w-11 object-cover" />
                  </td>
                  <td className="py-3 pr-4">{p.name}</td>
                  <td className="py-3 pr-4 text-white/60">{getCategoryName(p.category)}</td>
                  <td className="py-3 pr-4">₹{p.price}</td>
                  <td className="py-3 pr-4">{p.featured ? "Yes" : "-"}</td>
                  <td className="py-3 pr-4 text-white/60">{p.reviews.length}</td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setModalMode(p)}
                        className="text-xs text-white/60 underline-offset-2 hover:text-white hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        className="text-xs text-white/60 underline-offset-2 hover:text-white hover:underline disabled:opacity-50"
                      >
                        {deletingId === p.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {page < totalPages && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-outline px-6 py-2.5 text-sm disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : `Load more (${products.length} of ${total})`}
              </button>
            </div>
          )}
        </div>
      )}

      {modalMode && (
        <ProductFormModal
          product={modalMode === "create" ? null : modalMode}
          onClose={() => setModalMode(null)}
          onSaved={handleSaved}
        />
      )}
    </AdminLayout>
  );
}
'@
    $targetDir = Split-Path $target -Parent
    if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
    [System.IO.File]::WriteAllText($target, $content, $Utf8NoBom)

    Write-Host ""
    Write-Host "Done - 7 file(s) updated." -ForegroundColor Green
    Write-Host ""
    Write-Host "Now review with: git status" -ForegroundColor Cyan
    Write-Host "Then commit and push with:" -ForegroundColor Cyan
    Write-Host "  git add ." -ForegroundColor Cyan
    Write-Host '  git commit -m "Fix slow loading - add pagination"' -ForegroundColor Cyan
    Write-Host "  git push" -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Write-Host ""
    Read-Host "Press Enter to close this window"
}
