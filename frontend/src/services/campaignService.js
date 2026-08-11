import API from "./api";




/**
 * PUBLIC – list active campaigns
 */
// export const getPublicCampaigns = async () => {
//   const res = await API.get("/api/campaigns");
//   return res.data; // plain array from getPublicCampaigns
// };

// /**
//  * PUBLIC – single campaign
//  */
// export const getPublicCampaignById = async (id) => {
//   const res = await API.get(`/api/campaigns/${id}`);
//   return res.data;
// };


// ======================================================
// ADMIN GET ALL CAMPAIGNS
// ======================================================

export const getCampaigns =
  async (params = {}) => {

    const res =
      await API.get(

        "/api/campaigns",

        { params }
      );

    return res.data;
  };



// ======================================================
// GET SINGLE CAMPAIGN
// ======================================================

export const getCampaign =
  async (id) => {

    const res =
      await API.get(
        `/api/campaigns/${id}`
      );

    return res.data;
  };



// ======================================================
// CREATE CAMPAIGN
// ======================================================

export const createCampaign =
  async (formData) => {

    const res =
      await API.post(

        "/api/campaigns",

        formData,

        {

          headers: {

            "Content-Type":
              "multipart/form-data",
          },
        }
      );

    return res.data;
  };



// ======================================================
// UPDATE CAMPAIGN
// ======================================================

export const updateCampaign =
  async (
    id,
    formData
  ) => {

    const res =
      await API.put(

        `/api/campaigns/${id}`,

        formData,

        {

          headers: {

            "Content-Type":
              "multipart/form-data",
          },
        }
      );

    return res.data;
  };



// ======================================================
// DELETE CAMPAIGN
// ======================================================

export const deleteCampaign =
  async (id) => {

    const res =
      await API.delete(
        `/api/campaigns/${id}`
      );

    return res.data;
  };



// ======================================================
// FEATURE / UNFEATURE CAMPAIGN
// ======================================================

export const featureCampaign =
  async (id) => {

    const res =
      await API.put(
        `/api/campaigns/${id}/feature`
      );

    return res.data;
  };



// ======================================================
// PUBLISH CAMPAIGN
// ======================================================

export const publishCampaign =
  async (id) => {

    const res =
      await API.put(
        `/api/campaigns/${id}/publish`
      );

    return res.data;
  };



// ======================================================
// ARCHIVE CAMPAIGN
// ======================================================

export const archiveCampaign =
  async (id) => {

    const res =
      await API.put(
        `/api/campaigns/${id}/archive`
      );

    return res.data;
  };



// ======================================================
// INCREMENT VIEWS
// ======================================================

export const incrementCampaignViews =
  async (id) => {

    const res =
      await API.post(
        `/api/campaigns/${id}/view`
      );

    return res.data;
  };



// ======================================================
// INCREMENT CLICKS
// ======================================================

export const incrementCampaignClicks =
  async (id) => {

    const res =
      await API.post(
        `/api/campaigns/${id}/click`
      );

    return res.data;
  };



// ======================================================
// GET FEATURED CAMPAIGNS
// ======================================================

export const getFeaturedCampaigns =
  async () => {

    const res =
      await API.get(

        "/api/campaigns",

        {

          params: {

            featured: true,

            status:
              "active",
          },
        }
      );

    return res.data;
  };



// ======================================================
// GET ACTIVE CAMPAIGNS
// ======================================================

export const getActiveCampaigns =
  async () => {

    const res =
      await API.get(

        "/api/campaigns",

        {

          params: {

            status:
              "active",
          },
        }
      );

    return res.data;
  };



// ======================================================
// SEARCH CAMPAIGNS
// ======================================================

export const searchCampaigns =
  async (search) => {

    const res =
      await API.get(

        "/api/campaigns",

        {

          params: {

            search,
          },
        }
      );

    return res.data;
  };



// ======================================================
// FILTER CAMPAIGNS
// ======================================================

export const filterCampaigns =
  async ({
    type,
    status,
    page,
    limit,
  }) => {

    const res =
      await API.get(

        "/api/campaigns",

        {

          params: {

            type,

            status,

            page,

            limit,
          },
        }
      );

    return res.data;
  };



// ======================================================
// GET CAMPAIGN ANALYTICS
// ======================================================

export const getCampaignAnalytics =
  async (campaign) => {

    return {

      totalViews:
        campaign.views || 0,

      totalClicks:
        campaign.clicks || 0,

      totalRegistrations:
        campaign.registrationCount || 0,

      conversionRate:

        campaign.views > 0

          ? (

              (
                campaign.registrationCount /
                campaign.views
              ) * 100

            ).toFixed(2)

          : 0,
    };
  };