// services/publicServiceService.js
// Public endpoints — no auth required
// Maps to: app.use("/api/service", serviceRoutes)

import api from "./api";

const BASE = "/api/service";

/**
 * Fetch all published services (for the grid)
 * GET /api/service
 */
export const getServices = async () => {
   console.log("✅ getServices reached");
  const { data } = await api.get("/api/service/services");
  return data; // array of Service objects
};

/**
 * Fetch a single published service by ID
 * GET /api/service/:id
 */
export const getService = async (id) => {
  const { data } = await api.get(`${BASE}/service/${id}`);
  return data; // single Service object
};
