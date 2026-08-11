import api from "./api";
const BASE = "/api/projects/all";

export const getProjects = async () => {
  const { data } = await api.get(BASE);
  return data;
};
export const getProject = async (slug) => {
  const { data } = await api.get(`${BASE}/${slug}`);
  return data;
};