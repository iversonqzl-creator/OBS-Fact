import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = checking, false = anon, obj = user
  const [ready, setReady] = useState(false);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem("w2e_token");
    if (!token) {
      setUser(false);
      setReady(true);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      localStorage.removeItem("w2e_token");
      setUser(false);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  const login = async (username, password) => {
    const { data } = await api.post("/auth/login", { username, password });
    localStorage.setItem("w2e_token", data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("w2e_token");
    setUser(false);
  };

  const value = useMemo(() => ({ user, ready, login, logout }), [user, ready]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
