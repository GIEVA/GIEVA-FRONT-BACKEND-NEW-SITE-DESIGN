import API
from "./api";



// ======================================================
// CREATE REGISTRATION
// ======================================================

export const createCampaignRegistration =
  async (data) => {

    const res =
      await API.post(

        "/api/campaign-registrations",

        data
      );



    return res.data;
  };



// ======================================================
// GET MY REGISTRATIONS
// ======================================================

export const getMyCampaignRegistrations =
  async () => {

    const res =
      await API.get(

        "/api/campaign-registrations/my"
      );



    return res.data;
  };