// services/healsPublicService.js  (no login needed)
import api from "./api";

export const getPublicHealsInfo = () => api.get("/api/heals-public/info").then((r) => r.data);
