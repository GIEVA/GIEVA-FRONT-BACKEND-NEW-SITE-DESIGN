import cron
from "node-cron";

import { Op }
from "sequelize";

import models
from "../models/index.js";

import sendEmail
from "../utils/sendMail.js";

import {

  campaignReminderTemplate,

  thankYouCampaignTemplate,

} from "../utils/emailTemplates.js";



const {

  Campaign,
  CampaignRegistration,

} = models;



// ======================================================
// START CAMPAIGN EMAIL SCHEDULER
// ======================================================

export const
startCampaignEmailScheduler =
() => {

  cron.schedule(

    "*/10 * * * *",

    async () => {

      console.log(
        "Running campaign email scheduler..."
      );



      try {

        const now =
          new Date();



        // ======================================================
        // 24 HOURS FROM NOW
        // ======================================================

        const in24Hours =
          new Date(

            now.getTime() +

            24 * 60 * 60 * 1000
          );



        // ======================================================
        // 1 HOUR FROM NOW
        // ======================================================

        const in1Hour =
          new Date(

            now.getTime() +

            60 * 60 * 1000
          );



        // ======================================================
        // 30 MINUTES AGO
        // ======================================================

        const thirtyMinutesAgo =
          new Date(

            now.getTime() -

            30 * 60 * 1000
          );



        // ======================================================
        // 24H REMINDERS
        // ======================================================

        const campaigns24h =
          await Campaign.findAll({

            where: {

              status:
                "active",



              reminder24hSent:
                false,



              startDate: {

                [Op.between]: [

                  new Date(

                    in24Hours.getTime()

                    - 5 * 60 * 1000
                  ),

                  new Date(

                    in24Hours.getTime()

                    + 5 * 60 * 1000
                  ),
                ],
              },
            },
          });



        for (
          const campaign
          of campaigns24h
        ) {

          const registrations =
            await CampaignRegistration.findAll({

              where: {

                campaignId:
                  campaign.id,
              },
            });



          for (
            const reg
            of registrations
          ) {

            try {

              await sendEmail(

                reg.email,

                `Reminder: ${campaign.title} starts tomorrow`,

                campaignReminderTemplate({

                  name:
                    reg.fullName,

                  campaignTitle:
                    campaign.title,

                  startDate:
                    campaign.startDate,
                })
              );

            } catch (error) {

              console.error(
                `24h reminder failed for ${reg.email}`,
                error
              );
            }
          }



          // ======================================================
          // MARK SENT
          // ======================================================

          await campaign.update({

            reminder24hSent:
              true,
          });
        }



        // ======================================================
        // 1H REMINDERS
        // ======================================================

        const campaigns1h =
          await Campaign.findAll({

            where: {

              status:
                "active",



              reminder1hSent:
                false,



              startDate: {

                [Op.between]: [

                  new Date(

                    in1Hour.getTime()

                    - 5 * 60 * 1000
                  ),

                  new Date(

                    in1Hour.getTime()

                    + 5 * 60 * 1000
                  ),
                ],
              },
            },
          });



        for (
          const campaign
          of campaigns1h
        ) {

          const registrations =
            await CampaignRegistration.findAll({

              where: {

                campaignId:
                  campaign.id,
              },
            });



          for (
            const reg
            of registrations
          ) {

            try {

              await sendEmail(

                reg.email,

                `Starting Soon: ${campaign.title}`,

                campaignReminderTemplate({

                  name:
                    reg.fullName,

                  campaignTitle:
                    campaign.title,

                  startDate:
                    campaign.startDate,
                })
              );

            } catch (error) {

              console.error(
                `1h reminder failed for ${reg.email}`,
                error
              );
            }
          }



          // ======================================================
          // MARK SENT
          // ======================================================

          await campaign.update({

            reminder1hSent:
              true,
          });
        }



        // ======================================================
        // THANK YOU EMAILS
        // ======================================================

        const completedCampaigns =
          await Campaign.findAll({

            where: {

              status:
                "completed",



              thankYouSent:
                false,



              endDate: {

                [Op.between]: [

                  new Date(

                    thirtyMinutesAgo.getTime()

                    - 5 * 60 * 1000
                  ),

                  new Date(

                    thirtyMinutesAgo.getTime()

                    + 5 * 60 * 1000
                  ),
                ],
              },
            },
          });



        for (
          const campaign
          of completedCampaigns
        ) {

          const registrations =
            await CampaignRegistration.findAll({

              where: {

                campaignId:
                  campaign.id,
              },
            });



          for (
            const reg
            of registrations
          ) {

            try {

              await sendEmail(

                reg.email,

                `Thank you for attending ${campaign.title}`,

                thankYouCampaignTemplate({

                  name:
                    reg.fullName,

                  campaignTitle:
                    campaign.title,
                })
              );

            } catch (error) {

              console.error(
                `Thank-you email failed for ${reg.email}`,
                error
              );
            }
          }



          // ======================================================
          // MARK SENT
          // ======================================================

          await campaign.update({

            thankYouSent:
              true,
          });
        }



        console.log(
          "Campaign email scheduler completed"
        );

      } catch (error) {

        console.error(
          "Campaign scheduler error:",
          error
        );
      }
    }
  );
};