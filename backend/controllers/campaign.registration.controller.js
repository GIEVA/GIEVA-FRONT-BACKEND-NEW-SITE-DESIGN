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

export const createRegistration = async (req, res) => {
  try {
    const { campaignId, fullName, email, extraData } = req.body;

    if (!campaignId || !fullName?.trim() || !email?.trim()) {
      return res.status(400).json({ message: "Full name and email are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (campaign.status !== "active") {
      return res.status(400).json({ message: "Campaign is not active" });
    }

    if (!campaign.requiresRegistration && campaign.registrationLink) {
      return res.status(400).json({
        message: "Registration handled externally",
        link: campaign.registrationLink,
      });
    }

    const existing = await CampaignRegistration.findOne({
      where: { campaignId, email: cleanEmail },
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "You have already registered for this campaign" });
    }

    // Transaction only wraps DB writes
    const transaction = await CampaignRegistration.sequelize.transaction();
    let registration;

    try {
      registration = await CampaignRegistration.create(
        {
          campaignId,
          userId: req.user?.id || null,
          fullName: fullName.trim(),
          email: cleanEmail,
          extraData,
        },
        { transaction }
      );

      await ActivityLog.create(
        {
          userId: req.user?.id || null,
          action: "CAMPAIGN_REGISTRATION_CREATED",
          meta: { campaignId, email: cleanEmail },
        },
        { transaction }
      );

      await Notification.create(
        {
          title: "New Campaign Registration",
          message: `${fullName} registered for ${campaign.title}`,
          type: "campaign_registration",
          entityId: campaign.id,
          entityType: "campaign",
        },
        { transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    // Email AFTER commit, fire-and-forget: a failure can't break registration
    Promise.resolve(
      sendEmail(
        cleanEmail,
        "Registration Successful 🎉",
        registrationSuccessTemplate(fullName, campaign.title)
      )
    ).catch((err) =>
      console.error("Registration email failed:", err?.message || err)
    );

    return res.status(201).json({
      message: "Registration successful",
      registration,
    });
  } catch (error) {
    console.error("Create Registration Error:", error);
    return res.status(500).json({ message: "Server error" });
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

  