// services/api.js

import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
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

// ── RESPONSE: auto-logout on expired/invalid token ──────────────────
//
// Your `authenticate` middleware returns 401 for every case that means
// "this token is no good" (missing, expired, malformed, invalid
// payload, account not found) and 403 for every case that means
// "you're authenticated fine, but not allowed to do this" (disabled
// account, unverified email, wrong role via authorizeRoles). So this
// interceptor only needs to react to 401 — 403s are left alone and
// handled wherever the failing request originated, which is correct:
// a disabled-account or wrong-role error shouldn't force a logout.
//
// Guards in place:
//   - Skip entirely if already on /login, so a 401 from a stray
//     background poll (this app has several: waiting-room polling,
//     admission-status polling in LiveClassroom.jsx) never causes a
//     redirect loop or interrupts an in-progress login attempt.
//   - `loggingOut` flag ensures a burst of 401s firing at once (e.g.
//     several polling intervals failing together right after expiry)
//     only triggers ONE redirect.
//   - The backend's specific message (e.g. "Session expired, please
//     login again" vs "Invalid token, please login again") is passed
//     through via the redirect's query string, so the login page can
//     show the real reason instead of a generic message.

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