import API from "./api";



export const getTutorDashboard =
  async () => {

    const res =
      await API.get(
        "/api/tutor/dashboard/me"
      );

    return res.data;
  };