import models
from "../models/index.js";

import sendEmail
from "../utils/sendMail.js";

import {

  registrationSuccessTemplate,

} from "../utils/emailTemplates.js";



const {

  CampaignRegistration,
  Campaign,
  ActivityLog,
  Notification,

} = models;



// ======================================================
// CREATE REGISTRATION
// ======================================================

export const createRegistration =
  async (req, res) => {

    const transaction =
      await CampaignRegistration
        .sequelize
        .transaction();



    try {

      const {

        campaignId,
        fullName,
        email,
        phoneNumber,
        dob,
        extraData,

      } = req.body;



      // ======================================================
      // VALIDATION
      // ======================================================

      if (

        !campaignId ||

        !fullName ||

        !email ||

        !phoneNumber

      ) {

        return res.status(400)
          .json({

            message:
              "All required fields must be provided",
          });
      }



      // ======================================================
      // FIND CAMPAIGN
      // ======================================================

      const campaign =
        await Campaign.findByPk(
          campaignId
        );



      if (
        !campaign
      ) {

        return res.status(404)
          .json({

            message:
              "Campaign not found",
          });
      }



      // ======================================================
      // STATUS CHECK
      // ======================================================

      if (
        campaign.status !==
        "active"
      ) {

        return res.status(400)
          .json({

            message:
              "Campaign is not active",
          });
      }



      // ======================================================
      // EXTERNAL REGISTRATION
      // ======================================================

      if (

        !campaign.requiresRegistration &&

        campaign.registrationLink

      ) {

        return res.status(400)
          .json({

            message:
              "Registration handled externally",

            link:
              campaign.registrationLink,
          });
      }



      // ======================================================
      // DUPLICATE CHECK
      // ======================================================

      const existing =
        await CampaignRegistration.findOne({

          where: {

            campaignId,

            email,
          },
        });



      if (existing) {

        return res.status(400)
          .json({

            message:
              "You have already registered for this campaign",
          });
      }



      // ======================================================
      // CREATE
      // ======================================================

      const registration =
        await CampaignRegistration.create({

          campaignId,

          userId:
            req.user?.id || null,

          fullName,

          email,

          phoneNumber,

          dob,

          extraData,

        }, {
          transaction,
        });



      // ======================================================
      // EMAIL
      // ======================================================

      await sendEmail(

        email,

        "Registration Successful 🎉",

        registrationSuccessTemplate(

          fullName,

          campaign.title
        )
      );



      // ======================================================
      // ACTIVITY LOG
      // ======================================================

      await ActivityLog.create({

        userId:
          req.user?.id || null,

        action:
          "CAMPAIGN_REGISTRATION_CREATED",

        meta: {

          campaignId,

          email,
        },

      }, {
        transaction,
      });



      // ======================================================
      // ADMIN NOTIFICATION
      // ======================================================

      await Notification.create({

        title:
          "New Campaign Registration",

        message:
          `${fullName} registered for ${campaign.title}`,

        type:
          "campaign_registration",

        entityId:
          campaign.id,

        entityType:
          "campaign",

      }, {
        transaction,
      });



      await transaction.commit();



      res.status(201).json({

        message:
          "Registration successful",

        registration,
      });

    } catch (error) {

      await transaction.rollback();

      console.error(error);



      res.status(500).json({

        message:
          "Server error",
      });
    }
  };



// ======================================================
// GET MY REGISTRATIONS
// ======================================================

export const getMyRegistrations =
  async (req, res) => {

    try {

      const registrations =
        await CampaignRegistration.findAll({

          where: {

            userId:
              req.user.id,
          },

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

  