# XPOSTERS — Frontend

A standalone React (Vite + Tailwind) frontend for XPOSTERS, a poster
e-commerce site. Runs entirely on local mock data — no backend required.

## Run it locally

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

`npm run dev` and `npm run build` both automatically regenerate the image
manifest first (via a `pre` script), so you never need to run it manually
unless you're adding photos mid-session — see below.

## Adding real poster photos

Each category has its own folder under `public/images/`:

```
public/images/tamil-movies/
public/images/english-movies/
public/images/cars-bikes/
public/images/marvel-dc/
public/images/anime/
public/images/cartoon/
public/images/motivational/
```

Drop `.jpg` (or `.png`/`.webp`) files into the matching folder — **any
filename works**, no code editing required. Each image automatically
becomes a product: its filename (converted to Title Case) becomes the
poster's display name, and the first image in a category becomes that
category's "featured" pick for the homepage wall. So `u1.jpg` shows up as
"U1", `better-call-saul.jpg` as "Better Call Saul", and so on.

A category with real photos in it stops showing the placeholder demo
posters entirely and only shows your real ones; a category still empty
keeps showing its placeholders so the site never looks bare.

After adding or renaming photos, run:

```bash
npm run manifest
```

then restart `npm run dev` (or refresh if you're mid-session — JSON
imports need a restart to pick up). `npm run build` regenerates it
automatically too.

### Renaming a batch of photos at once

If your photos come out of your phone/WhatsApp with names like
`WhatsApp Image 2026-09-07 at 7.32.47.jpg`, use the included PowerShell
helper instead of renaming by hand. From inside one category's folder:

```powershell
cd "C:\path\to\xposters\public\images\tamil-movies"
powershell -ExecutionPolicy Bypass -File ..\..\..\scripts\rename-posters.ps1
```

It opens each photo in your default viewer, asks what to call it, and
renames the file to a clean, web-safe version of that name
(`U1` → `u1.jpg`). Skip a file by pressing Enter with no name. Run it
again per category folder. Nothing else needs to change afterward — just
`npm run manifest` and restart `npm run dev`.

## Data & persistence

- **Products**: for categories with real photos, products are generated
  automatically from `src/data/imageManifest.json` (see "Adding real
  poster photos" above). Categories with no photos yet fall back to the
  curated demo entries in `src/data/mockProducts.js`. Swap this whole
  layer for real API calls later — `src/api/client.js` already has an
  axios instance pointed at `VITE_API_BASE_URL` (see `.env`) ready to
  wire up.
- **Cart** and **wishlist** persist in the browser's `localStorage`, so they
  survive refreshes but are per-browser, not synced anywhere.
- **Reviews** submitted via the "leave a review" form on a product page are
  also saved to `localStorage`; auto-generated products start with no seed
  reviews, so the first one is whoever leaves it.

## Checkout

`/checkout` collects name, email, phone, and address (validated), shows an
order summary, and on "Place order":

- logs the full order object to the browser console
- generates a mock order ID
- clears the cart and navigates to `/order-success`

No real payment is processed. The exact spot in `src/pages/Checkout.jsx`
where a real payment gateway call (Razorpay, Stripe, etc.) would go is
marked with a comment.

## Admin-style "featured" flag

The homepage's auto-scrolling poster wall pulls from each category's
featured pick. For auto-generated products, that's simply the first image
in the category's folder; for the curated demo data it's the products with
`featured: true` in `src/data/mockProducts.js`. Either way it simulates
what an admin would later toggle from a dashboard.
