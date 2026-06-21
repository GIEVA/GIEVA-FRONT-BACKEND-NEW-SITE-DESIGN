import models
from "../models/index.js";

import { Op } from "sequelize";

const {

  CampaignRegistration,
  Campaign,
  ActivityLog,

} = models;



// ======================================================
// GET ALL
// ======================================================

export const getAllRegistrations =
  async (req, res) => {

    try {

      const where = {};



      if (
        req.query.campaignId
      ) {

        where.campaignId =
          req.query.campaignId;
      }



      const registrations =
        await CampaignRegistration.findAll({

          where,

          include: [

            {

              model:
                Campaign,

              as:
                "campaign",
            },
          ],

          order: [
            ["createdAt", "DESC"]
          ],
        });



      res.json({
        registrations,
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        message:
          "Server error",
      });
    }
  };



// ======================================================
// GET ONE
// ======================================================

export const getRegistrationById =
  async (req, res) => {

    try {

      const registration =
        await CampaignRegistration.findByPk(

          req.params.id,

          {

            include: [

              {

                model:
                  Campaign,

                as:
                  "campaign",
              },
            ],
          }
        );



      if (!registration) {

        return res.status(404)
          .json({

            message:
              "Registration not found",
          });
      }



      res.json({
        registration,
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        message:
          "Server error",
      });
    }
  };



// ======================================================
// UPDATE
// ======================================================

export const updateRegistration =
  async (req, res) => {

    try {

      const registration =
        await CampaignRegistration.findByPk(
          req.params.id
        );



      if (!registration) {

        return res.status(404)
          .json({

            message:
              "Registration not found",
          });
      }



      await registration.update(
        req.body
      );



      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "CAMPAIGN_REGISTRATION_UPDATED",

        meta: {

          registrationId:
            registration.id,
        },
      });



      res.json({

        message:
          "Registration updated",

        registration,
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        message:
          "Server error",
      });
    }
  };



// ======================================================
// DELETE
// ======================================================

export const deleteRegistration =
  async (req, res) => {

    try {

      const registration =
        await CampaignRegistration.findByPk(
          req.params.id
        );



      if (!registration) {

        return res.status(404)
          .json({

            message:
              "Registration not found",
          });
      }



      await registration.destroy();



      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "CAMPAIGN_REGISTRATION_DELETED",

        meta: {

          registrationId:
            registration.id,
        },
      });



      res.json({

        message:
          "Registration deleted",
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        message:
          "Server error",
      });
    }
  };

  // ======================================================
// ANALYTICS
// ======================================================

export const getRegistrationAnalytics =
  async (req, res) => {

    try {

      const { campaignId } =
        req.query;



      const where = {};



      if (campaignId) {

        where.campaignId =
          campaignId;
      }



      // ======================================================
      // GET ALL REGISTRATIONS
      // ======================================================

      const registrations =
        await CampaignRegistration.findAll({

          where,

          include: [

            {

              model:
                Campaign,

              as:
                "campaign",
            },
          ],

          order: [
            ["createdAt", "ASC"]
          ],
        });



      // ======================================================
      // TOTALS
      // ======================================================

      const totalRegistrations =
        registrations.length;



      // ======================================================
      // DAILY TREND
      // ======================================================

      const dailyMap = {};



      registrations.forEach(
        (reg) => {

          const day =
            new Date(
              reg.createdAt
            ).toLocaleDateString();



          if (!dailyMap[day]) {

            dailyMap[day] = 0;
          }



          dailyMap[day]++;
        }
      );



      const dailyTrend =
        Object.entries(
          dailyMap
        ).map(
          ([date, total]) => ({

            date,
            total,
          })
        );



      // ======================================================
      // AGE DEMOGRAPHICS
      // ======================================================

      const demographics = {

        under18: 0,

        between18And24: 0,

        between25And34: 0,

        between35And44: 0,

        above45: 0,
      };



      registrations.forEach(
        (reg) => {

          if (!reg.dob) return;



          const age =
            new Date().getFullYear() -

            new Date(
              reg.dob
            ).getFullYear();



          if (age < 18) {

            demographics.under18++;

          } else if (
            age <= 24
          ) {

            demographics.between18And24++;

          } else if (
            age <= 34
          ) {

            demographics.between25And34++;

          } else if (
            age <= 44
          ) {

            demographics.between35And44++;

          } else {

            demographics.above45++;
          }
        }
      );



      // ======================================================
      // HOURLY REGISTRATIONS
      // ======================================================

      const hourlyMap = {};



      registrations.forEach(
        (reg) => {

          const hour =
            new Date(
              reg.createdAt
            ).getHours();



          if (!hourlyMap[hour]) {

            hourlyMap[hour] = 0;
          }



          hourlyMap[hour]++;
        }
      );



      const hourlyTrend =
        Object.entries(
          hourlyMap
        ).map(
          ([hour, total]) => ({

            hour,
            total,
          })
        );



      // ======================================================
      // RECENT REGISTRATIONS
      // ======================================================

      const recentRegistrations =
        registrations
          .slice(-5)
          .reverse();



      // ======================================================
      // RESPONSE
      // ======================================================

      res.json({

        totalRegistrations,

        demographics,

        dailyTrend,

        hourlyTrend,

        recentRegistrations,
      });

    } catch (error) {

      console.error(error);



      res.status(500).json({

        message:
          "Server error",
      });
    }
  };