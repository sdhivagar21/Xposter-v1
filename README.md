# XPOSTERS — Frontend

React (Vite + Tailwind) frontend for XPOSTERS, a poster e-commerce site.
Talks to the `xposters-backend` API for products, orders, and admin login —
see that project's README for backend setup (MongoDB Atlas + Cloudinary +
deploying to Render).

## Run it locally

1. Get the backend running first (see `xposters-backend/README.md`) — by
   default it runs on `http://localhost:4000`.
2. Copy `.env.example` to `.env`. The default `VITE_API_BASE_URL` already
   points at the local backend, so no changes needed for local dev.
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
4. Open the local URL Vite prints (usually `http://localhost:5173`).

## Admin panel

Visit `/admin/login` (also linked quietly at the bottom of the site footer)
and sign in with the admin email/password you set in the backend's `.env`.
From there:

- **Products** (`/admin`) — add, edit, or delete posters, upload their
  photo (stored on Cloudinary), set price/category/description, and toggle
  "featured" to control what shows in the homepage's scrolling wall.
- **Orders** (`/admin/orders`) — every order placed through checkout,
  newest first, with customer details and line items.

There's no local-file or filename-based product system anymore — every
poster's name, price, and photo are set directly through this panel and
stored in the database.

## Data & persistence

- **Products, reviews, and orders** live in the backend's MongoDB database
  — see `src/api/products.js`, `src/api/orders.js`, and `src/api/admin.js`
  for the API calls.
- **Cart** and **wishlist** still persist in the browser's `localStorage`
  — private to each visitor's device, not stored on the backend.
- **Admin login token** is stored in `localStorage` too, checked against
  the backend on each admin page load.

## Checkout

`/checkout` collects name, email, phone, and address (validated), shows an
order summary, and on "Place order" saves a real order to the database via
`POST /api/orders` and redirects to `/order-success` with the generated
order ID. No real payment is processed yet — the exact spot in
`src/pages/Checkout.jsx` where a real payment gateway call (Razorpay,
Stripe, etc.) would go is marked with a comment.

## Deploying

Deploy this to Vercel (or Netlify) as usual — framework preset Vite, build
command `npm run build`, output directory `dist`. Set `VITE_API_BASE_URL`
in the deploy platform's environment variables to your deployed backend's
URL (e.g. `https://xposters-backend.onrender.com/api`), and set the
backend's `CLIENT_URL` env var to match this frontend's deployed URL so
CORS allows it.
