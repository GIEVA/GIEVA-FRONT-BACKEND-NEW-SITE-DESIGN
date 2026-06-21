import API
from "./api";



// ======================================================
// GET PUBLIC CAMPAIGNS
// ======================================================

export const getPublicCampaigns =
  async (params = {}) => {

    const res =
      await API.get(

        "/api/campaigns",

        { params }
      );



    return res.data;
  };



// ======================================================
// GET PUBLIC CAMPAIGN DETAILS
// ======================================================

export const getPublicCampaignDetails =
  async (id) => {

    const res =
      await API.get(

        `/api/campaigns/${id}`
      );



    return res.data;
  };



// ======================================================
// TRACK VIEW
// ======================================================

export const trackCampaignView =
  async (id) => {

    const res =
      await API.post(

        `/api/campaigns/${id}/view`
      );



    return res.data;
  };



// ======================================================
// TRACK CLICK
// ======================================================

export const trackCampaignClick =
  async (id) => {

    const res =
      await API.post(

        `/api/campaigns/${id}/click`
      );



    return res.data;
  };