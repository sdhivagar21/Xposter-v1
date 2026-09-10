// Axios instance pre-wired for a future backend. Nothing in the UI calls
// this yet — the app currently runs entirely off src/data/mockProducts.js —
// but the base URL is already env-driven so swapping in a real API later
// means pointing VITE_API_BASE_URL at it and writing the fetch calls,
// with no other code changes required.

import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
