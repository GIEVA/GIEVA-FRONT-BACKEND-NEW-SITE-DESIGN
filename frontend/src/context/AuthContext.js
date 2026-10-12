import { createContext, useContext, useEffect, useState } from "react";
import { isTokenExpired, msUntilExpiry } from "../utils/authRedirect";

const AuthContext = createContext();

const clearSession = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  sessionStorage.removeItem("gieva_landed");
};

// Returns the stored user only if the session is still valid; otherwise wipes it
const readValidUser = () => {
  try {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!storedUser) return null;
    if (!token || isTokenExpired(token)) {
      clearSession();
      return null;
    }
    return JSON.parse(storedUser);
  } catch {
    clearSession();
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readValidUser);
  const [loading] = useState(false); // the check is now synchronous

  // Log out the moment the token expires, even if the tab stays open
  useEffect(() => {
    if (!user) return;
    const ms = msUntilExpiry(localStorage.getItem("token"));
    if (ms === null) return;
    const t = setTimeout(
      () => { clearSession(); setUser(null); },
      Math.min(Math.max(ms, 0), 2147483000) // setTimeout's maximum delay
    );
    return () => clearTimeout(t);
  }, [user]);

  // Keep several open tabs in sync (logging out in one logs out all)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token" || e.key === "user") setUser(readValidUser());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);