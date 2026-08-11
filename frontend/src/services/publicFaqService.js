import api from "./api";
const BASE = "/api/faqs/all";

export const getFaqs = async () => {
  const { data } = await api.get(BASE);
  return data;
};