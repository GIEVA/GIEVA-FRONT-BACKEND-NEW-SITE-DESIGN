import cron from "node-cron";
import { Op } from "sequelize";
import models from "../models/index.js";

const { CampaignMessage } = models;

export const startEmailScheduler = () => {
  cron.schedule("* * * * *", async () => {
    const messages = await CampaignMessage.findAll({
      where: {
        status: "scheduled",
        scheduledAt: { [Op.lte]: new Date() },
      },
    });

    for (const msg of messages) {
      await sendCampaignMessage(msg); // reuse logic
    }
  });
};