import api from "./api"; // your existing axios instance

export const getHistory = async () => {
  const { data } = await api.get("/api/gieva/history/all");
  return data;
};