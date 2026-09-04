// controllers/userGetCampaign.js
// FIXES:
//   1. getPublicCampaigns — was likely crashing on a bad Sequelize
//      include (wrong alias or missing association). Added safe fallback.
//   2. getPublicCampaignDetails — id validation added; handles numeric
//      id AND slug lookup so both work.
//   3. Both functions now return consistent { campaigns } / { campaign } shape.

import models from "../models/index.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";

const { Campaign, User, ActivityLog } = models;

// ─────────────────────────────────────────────────────────────
// GET ALL PUBLIC/ACTIVE CAMPAIGNS
// ─────────────────────────────────────────────────────────────
export const getPublicCampaigns = async (req, res) => {
  try {
    const {
      page     = 1,
      limit    = 20,
      type,
      search,
    } = req.query;

    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit) || 20);
    const lim    = Math.min(50, parseInt(limit) || 20);

    const where = {
      status:    "active",
      // only show campaigns that haven't expired
      [Op.or]: [
        { endDate: null },
        { endDate: { [Op.gte]: new Date() } },
      ],
    };

    if (type)   where.type   = type;
    if (search) where.title  = { [Op.like]: `%${search}%` };

    // Try with creator include first; fall back without if alias is wrong
    let rows, count;
    try {
      ({ rows, count } = await Campaign.findAndCountAll({
        where,
        order:  [["createdAt", "DESC"]],
        limit:  lim,
        offset,
        include: [{
          model:      User,
          as:         "creator",       // adjust to match your Campaign.belongsTo alias
          required:   false,
          attributes: ["id", "fullName"],
        }],
      }));
    } catch (includeErr) {
      console.warn("getPublicCampaigns include error, retrying without:", includeErr.message);
      ({ rows, count } = await Campaign.findAndCountAll({
        where,
        order:  [["createdAt", "DESC"]],
        limit:  lim,
        offset,
      }));
    }

    res.json({
      campaigns:   rows,
      total:       count,
      currentPage: parseInt(page),
      totalPages:  Math.ceil(count / lim),
    });
  } catch (error) {
    console.error("getPublicCampaigns error:", error);
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
};

// ─────────────────────────────────────────────────────────────
// GET SINGLE CAMPAIGN (by id or slug)
// ─────────────────────────────────────────────────────────────
export const getPublicCampaignDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Support both numeric id and slug
    const isNumeric = /^\d+$/.test(id);
    const where     = isNumeric
      ? { id: parseInt(id), status: "active" }
      : { slug: id,         status: "active" };

    let campaign;
    try {
      campaign = await Campaign.findOne({
        where,
        include: [{
          model:      User,
          as:         "creator",
          required:   false,
          attributes: ["id", "fullName"],
        }],
      });
    } catch (includeErr) {
      console.warn("getPublicCampaignDetails include error, retrying without:", includeErr.message);
      campaign = await Campaign.findOne({ where });
    }

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    res.json({ campaign });
  } catch (error) {
    console.error("getPublicCampaignDetails error:", error);
    res.status(500).json({ message: "Failed to fetch campaign" });
  }
};

// ─────────────────────────────────────────────────────────────
// INCREMENT VIEWS
// ─────────────────────────────────────────────────────────────
export const incrementCampaignViews = async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Not found" });

    await campaign.increment("views", { by: 1 });
    res.json({ success: true, views: (campaign.views || 0) + 1 });
  } catch (error) {
    console.error("incrementCampaignViews error:", error);
    res.status(500).json({ message: "Failed to track view" });
  }
};

// ─────────────────────────────────────────────────────────────
// INCREMENT CLICKS
// ─────────────────────────────────────────────────────────────
export const incrementCampaignClicks = async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Not found" });

    await campaign.increment("clicks", { by: 1 });
    res.json({ success: true, clicks: (campaign.clicks || 0) + 1 });
  } catch (error) {
    console.error("incrementCampaignClicks error:", error);
    res.status(500).json({ message: "Failed to track click" });
  }
};