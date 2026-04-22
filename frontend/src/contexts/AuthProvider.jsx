import { useState } from "react";
import { AuthContext } from "./AuthContext";
import api from "../api/axios";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token } = res.data;
    localStorage.setItem("token", token);
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userData = {
      email: payload.username,
      roles: payload.roles,
    };
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const isAdmin = () => user?.roles?.includes("ROLE_ADMIN");
  const isTresorier = () =>
    user?.roles?.includes("ROLE_TRESORIER") || isAdmin();

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isTresorier }}>
      {children}
    </AuthContext.Provider>
  );
}
