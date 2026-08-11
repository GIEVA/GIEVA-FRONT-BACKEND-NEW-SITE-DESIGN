// services/partnerService.js (admin)
import api from "./api";
const BASE = "/api/admin/partners/all";

export const getAdminPartners = async () => {
  const { data } = await api.get(BASE);
  return data;
};

export const getAdminPartner = async (id) => {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
};

export const createPartner = async (formData) => {
  const { data } = await api.post(BASE, formData);
  return data;
};

export const updatePartner = async (id, formData) => {
  const { data } = await api.put(`${BASE}/${id}`, formData);
  return data;
};

export const deletePartner = async (id) => {
  const { data } = await api.delete(`${BASE}/${id}`);
  return data;
};

export const getPartnerStats = async () => {
  const { data } = await api.get(`${BASE}/stats`);
  return data;
};