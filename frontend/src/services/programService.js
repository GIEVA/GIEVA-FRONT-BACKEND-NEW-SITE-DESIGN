// services/programService.js (admin)
import api from "./api";
const BASE = "/api/admin/programs";

export const getAdminPrograms = async () => {
  const { data } = await api.get(BASE);
  return data;
};

export const getAdminProgram = async (id) => {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
};

export const createProgram = async (formData) => {
  const { data } = await api.post(BASE, formData);
  return data;
};

export const updateProgram = async (id, formData) => {
  const { data } = await api.put(`${BASE}/${id}`, formData);
  return data;
};

export const deleteProgram = async (id) => {
  const { data } = await api.delete(`${BASE}/${id}`);
  return data;
};

export const getProgramStats = async () => {
  const { data } = await api.get(`${BASE}/stats`);
  return data;
};