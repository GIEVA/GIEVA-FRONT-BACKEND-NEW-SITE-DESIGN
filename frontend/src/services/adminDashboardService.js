import API
from "./api";



// ======================================================
// GET DASHBOARD SUMMARY
// ======================================================

export const getAdminDashboardSummary =
  async () => {

    const res =
      await API.get(

        "/api/admin/dashboard/summary"
      );



    return res.data;
  };