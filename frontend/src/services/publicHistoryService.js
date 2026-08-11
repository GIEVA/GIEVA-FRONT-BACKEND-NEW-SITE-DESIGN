import api from "./api";

export const getHistory = async () => {
  const { data } = await api.get("/api/gieva/history");
  return data;
};