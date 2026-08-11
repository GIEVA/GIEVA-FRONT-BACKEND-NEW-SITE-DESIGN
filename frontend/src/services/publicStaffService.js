// services/publicStaffService.js
import api from "./api";

const BASE = "/api/staff/all";

export const getStaffList = async () => {
  const { data } = await api.get(BASE);
  return data;
};

export const getStaffMember = async (id) => {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
};