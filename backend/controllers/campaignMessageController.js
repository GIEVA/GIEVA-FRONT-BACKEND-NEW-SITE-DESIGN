import models
from "../models/index.js";

import sendEmail
from "../utils/sendMail.js";

import {

  webinarCampaignTemplate,

  satCampaignTemplate,

  campaignReminderTemplate,

  thankYouCampaignTemplate,

} from "../utils/emailTemplates.js";

const {

  Campaign,
  CampaignMessage,
  CampaignRegistration,
  Notification,
  ActivityLog,

} = models;



// ======================================================
// CREATE MESSAGE
// ======================================================

export const createCampaignMessage =
  async (req, res) => {

    try {

      const {

        campaignId,
        subject,
        message,
        status,
        scheduledAt,

      } = req.body;



      const campaign =
        await Campaign.findByPk(
          campaignId
        );



      if (!campaign) {

        return res.status(404)
          .json({
            message:
              "Campaign not found",
          });
      }



      const newMessage =
        await CampaignMessage.create({

          campaignId,

          subject,

          message,

          status:
            status || "draft",

          scheduledAt,

          sentBy:
            req.user.id,
        });



      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "CAMPAIGN_MESSAGE_CREATED",

        meta: {

          campaignId,

          messageId:
            newMessage.id,
        },
      });



      res.status(201).json({

        message:
          "Campaign message created",

        data:
          newMessage,
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
// GET ALL CAMPAIGN MESSAGES
// ======================================================

export const getCampaignMessages =
  async (req, res) => {

    try {

      const where = {};

      if (
        req.query.campaignId
      ) {

        where.campaignId =
          req.query.campaignId;
      }



      const messages =
        await CampaignMessage.findAll({

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
        messages,
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
// GET SINGLE MESSAGE
// ======================================================

export const getCampaignMessageById =
  async (req, res) => {

    try {

      const message =
        await CampaignMessage.findByPk(

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



      if (!message) {

        return res.status(404)
          .json({
            message:
              "Message not found",
          });
      }



      res.json(message);

    } catch (error) {

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };



// ======================================================
// UPDATE MESSAGE
// ======================================================

export const updateCampaignMessage =
  async (req, res) => {

    try {

      const message =
        await CampaignMessage.findByPk(
          req.params.id
        );



      if (!message) {

        return res.status(404)
          .json({
            message:
              "Message not found",
          });
      }



      await message.update(
        req.body
      );



      res.json({

        message:
          "Campaign message updated",

        data:
          message,
      });

    } catch (error) {

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };



// ======================================================
// DELETE MESSAGE
// ======================================================

export const deleteCampaignMessage =
  async (req, res) => {

    try {

      const message =
        await CampaignMessage.findByPk(
          req.params.id
        );



      if (!message) {

        return res.status(404)
          .json({
            message:
              "Message not found",
          });
      }



      await message.destroy();



      res.json({
        message:
          "Message deleted",
      });

    } catch (error) {

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };



// ======================================================
// SEND MESSAGE
// ======================================================

export const sendCampaignMessage =
  async (req, res) => {

    try {

      // ======================================================
      // LOAD MESSAGE + CAMPAIGN
      // ======================================================

      const message =
        await CampaignMessage.findByPk(

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



      if (!message) {

        return res.status(404)
          .json({

            message:
              "Message not found",
          });
      }



      // ======================================================
      // EXTRACT CAMPAIGN
      // ======================================================

      const campaign =
        message.campaign;



      // ======================================================
      // LOAD REGISTRATIONS
      // ======================================================

      const registrations =
        await CampaignRegistration.findAll({

          where: {

            campaignId:
              message.campaignId,
          },
        });



      let successCount = 0;

      let failedCount = 0;



      // ======================================================
      // SEND EMAILS
      // ======================================================

      for (
        const reg
        of registrations
      ) {

        try {

          let htmlContent =
            message.message;



          // ======================================================
          // WEBINAR TEMPLATE
          // ======================================================

          if (
            campaign.type ===
            "webinar"
          ) {

            htmlContent =
              webinarCampaignTemplate({

                name:
                  reg.fullName,

                campaignTitle:
                  campaign.title,

                description:
                  campaign.description,

                startDate:
                  campaign.startDate,

                joinLink:
                  campaign.registrationLink,

                imageUrl:
                  campaign.imageUrl,
              });
          }



          // ======================================================
          // SAT TEMPLATE
          // ======================================================

          else if (
            campaign.type ===
            "sat"
          ) {

            htmlContent =
              satCampaignTemplate({

                name:
                  reg.fullName,

                campaignTitle:
                  campaign.title,

                startDate:
                  campaign.startDate,

                registrationLink:
                  campaign.registrationLink,
              });
          }



          // ======================================================
          // DEFAULT TEMPLATE
          // ======================================================

          else {

            htmlContent =
              campaignBroadcastTemplate(

                message.message,

                campaign.title
              );
          }



          // ======================================================
          // SEND EMAIL
          // ======================================================

          await sendEmail(

            reg.email,

            message.subject,

            htmlContent
          );



          successCount++;

        } catch (error) {

          console.error(
            `Failed for ${reg.email}`,
            error
          );

          failedCount++;
        }
      }



      // ======================================================
      // UPDATE MESSAGE STATUS
      // ======================================================

      await message.update({

        status: "sent",

        sentAt:
          new Date(),

        totalRecipients:
          registrations.length,

        successCount,

        failedCount,
      });



      // ======================================================
      // NOTIFICATION
      // ======================================================

      await Notification.create({

        title:
          "Campaign Message Sent",

        message:
          `${message.subject} sent successfully`,

        type:
          "campaign_registration",
      });



      // ======================================================
      // RESPONSE
      // ======================================================

      res.json({

        message:
          "Campaign email sent successfully",

        stats: {

          total:
            registrations.length,

          successCount,

          failedCount,
        },
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        message:
          "Server error",
      });
    }
  };