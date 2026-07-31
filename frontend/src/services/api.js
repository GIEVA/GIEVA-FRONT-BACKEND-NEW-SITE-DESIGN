// services/api.js

import axios from "axios";

const API = axios.create({
  baseURL: "https://gieva-front-backend-new-site-design-production.up.railway.app/",
  // headers: {
  //   "Content-Type": "application/json",
  // },
  withCredentials: true,
});

// ── REQUEST: attach the bearer token (unchanged) ────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


let loggingOut = false;

const LOGIN_PATH = "/login";

const isOnLoginPage = () =>
  window.location.pathname === LOGIN_PATH;

const handleSessionExpired = (message) => {
  if (loggingOut || isOnLoginPage()) return;
  loggingOut = true;

  localStorage.removeItem("token");
  // Remove any other auth-related cached data here if you store it,
  // e.g. localStorage.removeItem("user"); localStorage.removeItem("role");

  const params = new URLSearchParams({
    reason: "session_expired",
    message: message || "Your session has expired. Please log in again.",
  });

  window.location.href = `${LOGIN_PATH}?${params.toString()}`;
};

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      const backendMessage = error?.response?.data?.message;
      handleSessionExpired(backendMessage);
    }

    return Promise.reject(error);
  }
);

export default API;