import API from "./api";

export const getStudentDashboard = async () => {
  const res = await API.get("/api/student/dashboard");
  return res.data;
};