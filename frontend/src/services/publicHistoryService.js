import api from "./api";

export const getHistory = async () => {
  const { data } = await api.get("/gieva/history");
  return data;
};