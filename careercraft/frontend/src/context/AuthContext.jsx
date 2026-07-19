import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const data = await api("/api/auth/me");
        setUser(data.user);
      } catch {
        setToken(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function signup({ name, email, password }) {
    const data = await api("/api/auth/signup", { method: "POST", body: { name, email, password }, auth: false });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function login({ email, password }) {
    const data = await api("/api/auth/login", { method: "POST", body: { email, password }, auth: false });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  async function updateProfile(fields) {
    const data = await api("/api/auth/profile", { method: "PATCH", body: fields });
    setUser(data.user);
    return data.user;
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
