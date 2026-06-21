// jobs/campaignAutoClose.js

import cron from "node-cron";
import models from "../models/index.js";
import pkg from "sequelize";

const { Op } = pkg;
const { Campaign } = models;

export const startCampaignAutoCloseJob = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("Running campaign auto-close job...");

      const updated = await Campaign.update(
        { isActive: false },
        {
          where: {
            isActive: true,
            endDate: {
              [Op.lt]: new Date(),
            },
          },
        }
      );

      console.log(`Campaigns auto-closed: ${updated[0]}`);
    } catch (error) {
      console.error("Auto-close error:", error);
    }
  });
};