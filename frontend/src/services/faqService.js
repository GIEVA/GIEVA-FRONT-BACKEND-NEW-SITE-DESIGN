import api from "./api";
const BASE = "/api/admin/faqs";

export const getAdminFaqs = async () => {
  const { data } = await api.get(BASE);
  return data;
};

export const getAdminFaq = async (id) => {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
};

export const createFaq = async (payload) => {
  const { data } = await api.post(BASE, payload);
  return data;
};

export const updateFaq = async (id, payload) => {
  const { data } = await api.put(`${BASE}/${id}`, payload);
  return data;
};

export const deleteFaq = async (id) => {
  const { data } = await api.delete(`${BASE}/${id}`);
  return data;
};

export const getFaqStats = async () => {
  const { data } = await api.get(`${BASE}/stats`);
  return data;
};