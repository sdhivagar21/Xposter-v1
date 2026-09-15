// Axios instance for the XPOSTERS backend. Point VITE_API_BASE_URL (see
// .env) at your deployed backend URL, e.g. https://xposters-backend.onrender.com/api

import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
