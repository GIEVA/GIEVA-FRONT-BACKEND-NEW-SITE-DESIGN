// services/staffService.js
import api from "./api";

const BASE = "/api/admin/staff";

export const getAdminStaffList = async () => {
  const { data } = await api.get(BASE);
  return data;
};

export const getAdminStaff = async (id) => {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
};

export const createStaff = async (formData) => {
  const { data } = await api.post(BASE, formData);
  return data;
};

export const updateStaff = async (id, formData) => {
  const { data } = await api.put(`${BASE}/${id}`, formData);
  return data;
};

export const deleteStaff = async (id) => {
  const { data } = await api.delete(`${BASE}/${id}`);
  return data;
};

export const getStaffStats = async () => {
  const { data } = await api.get(`${BASE}/stats`);
  return data;
};