import api from "./api";
const BASE = "/api/admin/projects/all";

export const getAdminProjects = async () => {
  const { data } = await api.get(BASE);
  return data;
};
export const getAdminProject = async (id) => {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
};
export const createProject = async (formData) => {
  const { data } = await api.post(BASE, formData);
  return data;
};
export const updateProject = async (id, formData) => {
  const { data } = await api.put(`${BASE}/${id}`, formData);
  return data;
};
export const deleteProject = async (id) => {
  const { data } = await api.delete(`${BASE}/${id}`);
  return data;
};
export const getProjectStats = async () => {
  const { data } = await api.get(`${BASE}/stats`);
  return data;
};