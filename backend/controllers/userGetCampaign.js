import { Op } from "sequelize";

import models
from "../models/index.js";



const {
  Campaign,
} = models;



// ======================================================
// PUBLIC CAMPAIGNS
// ======================================================

export const getPublicCampaigns =
  async (req, res) => {

    try {

      const {

        type,
        featured,
        search,

      } = req.query;



      // ======================================================
      // FILTERS
      // ======================================================

      const where = {

        status: "active",
      };



      // campaign type filter
      if (type) {

        where.type = type;
      }



      // featured filter
      if (
        featured === "true"
      ) {

        where.featured = true;
      }



      // search filter
      if (search) {

        where[Op.or] = [

          {

            title: {

              [Op.like]:
                `%${search}%`,
            },
          },

          {

            description: {

              [Op.like]:
                `%${search}%`,
            },
          },
        ];
      }



      // ======================================================
      // GET CAMPAIGNS
      // ======================================================

      const campaigns =
        await Campaign.findAll({

          where,

          order: [

            ["featured", "DESC"],

            ["startDate", "ASC"],

            ["createdAt", "DESC"],
          ],
        });



      // ======================================================
      // RESPONSE
      // ======================================================

      res.status(200).json(campaigns);

    } catch (error) {

      console.error(
        "Get Public Campaigns Error:",
        error
      );



      res.status(500).json({

        message:
          "Failed to fetch campaigns",
      });
    }
  };



// ======================================================
// PUBLIC CAMPAIGN DETAILS
// ======================================================

export const getPublicCampaignDetails =
  async (req, res) => {

    try {

      const campaign =
        await Campaign.findOne({

          where: {

            [Op.and]: [

              {

                [Op.or]: [

                  {
                    id:
                      req.params.id,
                  },

                  {
                    slug:
                      req.params.id,
                  },
                ],
              },

              {
                status:
                  "active",
              },
            ],
          },
        });



      // ======================================================
      // NOT FOUND
      // ======================================================

      if (!campaign) {

        return res.status(404)
          .json({

            message:
              "Campaign not found",
          });
      }



      // ======================================================
      // AUTO INCREMENT VIEW
      // ======================================================

      await campaign.increment(
        "views"
      );



      // refresh
      await campaign.reload();



      // ======================================================
      // RESPONSE
      // ======================================================

      res.status(200).json(campaign);

    } catch (error) {

      console.error(
        "Get Campaign Details Error:",
        error
      );



      res.status(500).json({

        message:
          "Failed to fetch campaign",
      });
    }
  };



// ======================================================
// INCREMENT CAMPAIGN VIEWS
// ======================================================

export const incrementCampaignViews =
  async (req, res) => {

    try {

      const campaign =
        await Campaign.findByPk(
          req.params.id
        );



      if (!campaign) {

        return res.status(404)
          .json({

            message:
              "Campaign not found",
          });
      }



      await campaign.increment(
        "views"
      );



      res.status(200).json({

        success: true,

        views:
          campaign.views + 1,
      });

    } catch (error) {

      console.error(
        "Increment Views Error:",
        error
      );



      res.status(500).json({

        message:
          "Failed to increment views",
      });
    }
  };



// ======================================================
// INCREMENT CAMPAIGN CLICKS
// ======================================================

export const incrementCampaignClicks =
  async (req, res) => {

    try {

      const campaign =
        await Campaign.findByPk(
          req.params.id
        );



      if (!campaign) {

        return res.status(404)
          .json({

            message:
              "Campaign not found",
          });
      }



      await campaign.increment(
        "clicks"
      );



      res.status(200).json({

        success: true,

        clicks:
          campaign.clicks + 1,
      });

    } catch (error) {

      console.error(
        "Increment Clicks Error:",
        error
      );



      res.status(500).json({

        message:
          "Failed to increment clicks",
      });
    }
  };