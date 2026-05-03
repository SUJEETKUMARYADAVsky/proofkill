import React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginUser, registerUser } from "../services/authService";

const TOKEN_KEY = "auth_token";
const AuthContext = createContext(null);

const decodeToken = (token) => {
  if (!token) {
    return null;
  }

  try {
    const payloadBase64Url = token.split(".")[1];

    if (!payloadBase64Url) {
      return null;
    }

    const base64 = payloadBase64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payloadJson = atob(padded);
    return JSON.parse(payloadJson);
  } catch (error) {
    return null;
  }
};

const isTokenExpired = (payload) => {
  if (!payload || typeof payload.exp !== "number") {
    return true;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
};

const getInitialToken = () => {
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const payload = decodeToken(storedToken);

  if (!payload || isTokenExpired(payload)) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }

  return storedToken;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getInitialToken);
  const [loading, setLoading] = useState(false);
  const currentUser = useMemo(() => decodeToken(token), [token]);
  const isAuthenticated = Boolean(token && currentUser && !isTokenExpired(currentUser));

  useEffect(() => {
    if (!token) {
      return;
    }

    if (!currentUser || isTokenExpired(currentUser)) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
  }, [token, currentUser]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await loginUser({ email, password });
      const nextToken = response.token;
      localStorage.setItem(TOKEN_KEY, nextToken);
      setToken(nextToken);
      return response;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      return await registerUser({ name, email, password });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  const value = useMemo(
    () => ({
      token,
      currentUser,
      isAuthenticated,
      loading,
      login,
      register,
      logout,
    }),
    [token, currentUser, isAuthenticated, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
};
