import API
from "./api";



// ======================================================
// GET ACTIVITY LOGS
// ======================================================

export const getActivityLogs =
  async (params = {}) => {

    const res =
      await API.get(

        "/api/admin/activity-logs",

        { params }
      );



    return res.data;
  };