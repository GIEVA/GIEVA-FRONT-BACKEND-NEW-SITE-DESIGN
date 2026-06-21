import API
from "./api";



// ======================================================
// GET ALL
// ======================================================

export const getAdminCampaignRegistrations =
  async (params = {}) => {

    const res =
      await API.get(

        "/api/admin/campaign-registrations",

        { params }
      );



    return res.data;
  };



// ======================================================
// GET ONE
// ======================================================

export const getAdminCampaignRegistration =
  async (id) => {

    const res =
      await API.get(

        `/api/admin/campaign-registrations/${id}`
      );



    return res.data;
  };



// ======================================================
// UPDATE
// ======================================================

export const updateAdminCampaignRegistration =
  async (
    id,
    data
  ) => {

    const res =
      await API.put(

        `/api/admin/campaign-registrations/${id}`,

        data
      );



    return res.data;
  };



// ======================================================
// DELETE
// ======================================================

export const deleteAdminCampaignRegistration =
  async (id) => {

    const res =
      await API.delete(

        `/api/admin/campaign-registrations/${id}`
      );



    return res.data;
  };

  // ======================================================
// ANALYTICS
// ======================================================

export const getRegistrationAnalytics =
  async (params = {}) => {

    const res =
      await API.get(

        "/api/admin/campaign-registrations/analytics",

        { params }
      );



    return res.data;
  };