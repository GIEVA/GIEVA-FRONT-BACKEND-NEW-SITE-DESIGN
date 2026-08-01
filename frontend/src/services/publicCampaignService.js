// services/publicCampaignService.js
// Public endpoints — no auth required
// Maps to: app.use("/api/campaigns", userGetCampaignRoutes)

import api from "./api";

const BASE = "/api/user/campaigns";

/**
 * Fetch all active campaigns
 * GET /api/campaigns
 */
export const getPublicCampaigns = async (params = {}) => {
  const { data } = await api.get(BASE, { params });
  return data; // array of Campaign objects
};

/**
 * Fetch a single active campaign by id or slug
 * GET /api/campaigns/:id
 */
export const getPublicCampaign = async (id) => {
  const { data } = await api.get(`${BASE}/${id}`);
  return data; // single Campaign object
};

/**
 * Track a view
 * POST /api/campaigns/:id/view
 */
export const trackCampaignView = async (id) => {
  const { data } = await api.post(`${BASE}/${id}/view`);
  return data;
};

/**
 * Track a click
 * POST /api/campaigns/:id/click
 */
export const trackCampaignClick = async (id) => {
  const { data } = await api.post(`${BASE}/${id}/click`);
  return data;
};