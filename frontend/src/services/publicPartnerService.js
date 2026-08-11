// services/publicPartnerService.js
import api from "./api";
const BASE = "/api/partners/all";

export const getPartners = async () => {
  const { data } = await api.get(BASE);
  return data;
};