import api from "./api";

export const adminGetHistory = async () => {
  const { data } = await api.get("/api/admin/gieva/history");
  return data;
};

export const saveHistory = async (formData) => {
  // formData is a FormData instance: append sidebarImage, introParagraphs (JSON.stringify), timeline (JSON.stringify), etc.
  const { data } = await api.put("/api/admin/gieva/history", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const resetHistory = async () => {
  const { data } = await api.post("/api/admin/gieva/history/reset");
  return data;
};