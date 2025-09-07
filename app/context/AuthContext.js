"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");
    const userData = localStorage.getItem("userData");

    if (token && userType && userData) {
      const parsedUserData = JSON.parse(userData);
      setUser({
        token,
        type: userType,
        id: parsedUserData.id,
        username: parsedUserData.username,
      });
    }
    setLoading(false);
  }, []);

  const login = async (username, password, type = "admin") => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, type }),
      });

      const data = await res.json();

      if (data.status === "success") {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("userType", data.data.type);
        localStorage.setItem("userData", JSON.stringify(data.data.user));
        setUser({
          token: data.data.token,
          type: data.data.type,
          id: data.data.user.id,
          username: data.data.user.username,
        });

        // Redirect based on user type
        switch (data.data.type) {
          case "shop":
            router.push("/cashier");
            break;
          case "backoffice":
            router.push("/backoffice/dashboard");
            break;
          default:
            router.push("/dashboard");
        }

        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "An error occurred during login" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("userData");
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
