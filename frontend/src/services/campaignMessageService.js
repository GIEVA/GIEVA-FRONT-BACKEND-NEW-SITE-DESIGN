import API
from "./api";



// ======================================================
// GET ALL
// ======================================================

export const getCampaignMessages =
  async (
    campaignId
  ) => {

    const res =
      await API.get(

        "/api/campaign-messages",

        {

          params: {
            campaignId,
          },
        }
      );



    return res.data;
  };



// ======================================================
// GET ONE
// ======================================================

export const getCampaignMessage =
  async (id) => {

    const res =
      await API.get(

        `/api/campaign-messages/${id}`
      );



    return res.data;
  };



// ======================================================
// CREATE
// ======================================================

export const createCampaignMessage =
  async (data) => {

    const res =
      await API.post(

        "/api/campaign-messages",

        data
      );



    return res.data;
  };



// ======================================================
// UPDATE
// ======================================================

export const updateCampaignMessage =
  async (
    id,
    data
  ) => {

    const res =
      await API.put(

        `/api/campaign-messages/${id}`,

        data
      );



    return res.data;
  };



// ======================================================
// DELETE
// ======================================================

export const deleteCampaignMessage =
  async (id) => {

    const res =
      await API.delete(

        `/api/campaign-messages/${id}`
      );



    return res.data;
  };



// ======================================================
// SEND
// ======================================================

export const sendCampaignMessage =
  async (id) => {

    const res =
      await API.post(

        `/api/campaign-messages/${id}/send`
      );



    return res.data;
  };