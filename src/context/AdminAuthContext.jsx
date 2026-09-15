import { createContext, useContext, useEffect, useState } from "react";
import { getStoredToken, setStoredToken, clearStoredToken, fetchAdminMe, adminLogin } from "../api/admin.js";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setChecking(false);
      return;
    }
    fetchAdminMe()
      .then((data) => setAdmin(data.admin))
      .catch(() => clearStoredToken())
      .finally(() => setChecking(false));
  }, []);

  async function login(email, password) {
    const data = await adminLogin(email, password);
    setStoredToken(data.token);
    setAdmin(data.admin);
  }

  function logout() {
    clearStoredToken();
    setAdmin(null);
  }

  const value = { admin, checking, isLoggedIn: !!admin, login, logout };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
