// services/publicProgramService.js
import api from "./api";
const BASE = "/api/programs/all";

export const getPrograms = async () => {
  const { data } = await api.get(BASE);
  return data;
};

export const getProgram = async (slug) => {
  const { data } = await api.get(`${BASE}/${slug}`);
  return data;
};