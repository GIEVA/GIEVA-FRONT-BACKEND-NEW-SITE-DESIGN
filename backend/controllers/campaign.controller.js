import models from "../models/index.js";
import { cloudinary } from "../config/cloudinary.js";
import {
  Op,
} from "sequelize";

import slugify
from "slugify";

const { Campaign, ActivityLog } = models;

// ---------------- CREATE ----------------
// ---------------- CREATE ----------------
export const createCampaign =
  async (req, res) => {

    const transaction =
      await Campaign
        .sequelize
        .transaction();

    try {

      // ======================================================
      // AUTHORIZATION
      // ======================================================

      if (
        ![
          "admin",
          "superadmin",
          "agent",
        ].includes(
          req.user.role
        )
      ) {

        return res.status(403)
          .json({
            message:
              "Not authorized",
          });
      }



      const {

        title,
        description,
        type,
        registrationLink,
        requiresRegistration,
        startDate,
        endDate,
        status,

      } = req.body;



      if (!title) {

        return res.status(400)
          .json({
            message:
              "Title is required",
          });
      }



      // ======================================================
      // GENERATE UNIQUE SLUG
      // ======================================================

      const baseSlug =
        slugify(title, {

          lower: true,

          strict: true,
        });



      let slug = baseSlug;

      let counter = 1;



      while (

        await Campaign.findOne({
          where: { slug }
        })
      ) {

        slug =
          `${baseSlug}-${counter}`;

        counter++;
      }



      // ======================================================
      // IMAGE
      // ======================================================

      let imageUrl = null;

      let imagePublicId =
        null;



      if (req.file) {

        imageUrl =
          req.file.path;

        imagePublicId =
          req.file.filename;
      }



      // ======================================================
      // CREATE
      // ======================================================

      const campaign =
        await Campaign.create({

          userId:
            req.user.id,

          title,

          slug,

          description,

          type,

          registrationLink,

          requiresRegistration,

          startDate,

          endDate,

          imageUrl,

          imagePublicId,

          status:
            status || "draft",

        }, { transaction });



      // ======================================================
      // LOG
      // ======================================================

      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "CAMPAIGN_CREATED",

        meta: {

          campaignId:
            campaign.id,
        },

      }, { transaction });



      await transaction.commit();



      res.status(201).json({

        message:
          "Campaign created successfully",

        campaign,
      });

    } catch (error) {

      await transaction.rollback();

      console.error(
        "Create Campaign Error:",
        error
      );

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };

// ---------------- UPDATE ----------------
// ---------------- UPDATE ----------------
export const updateCampaign =
  async (req, res) => {

    const transaction =
      await Campaign
        .sequelize
        .transaction();

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



      // ======================================================
      // OWNERSHIP
      // ======================================================

      if (

        campaign.userId !==
          req.user.id &&

        ![
          "admin",
          "superadmin",
        ].includes(
          req.user.role
        )
      ) {

        return res.status(403)
          .json({
            message:
              "Not authorized",
          });
      }



      let updateData = {
        ...req.body
      };



      // ======================================================
      // UPDATE SLUG IF TITLE CHANGED
      // ======================================================

      if (
        updateData.title &&
        updateData.title !==
        campaign.title
      ) {

        const baseSlug =
          slugify(
            updateData.title,
            {

              lower: true,

              strict: true,
            }
          );



        let slug =
          baseSlug;

        let counter = 1;



        while (

          await Campaign.findOne({

            where: {

              slug,

              id: {
                [Op.ne]:
                  campaign.id,
              },
            },
          })
        ) {

          slug =
            `${baseSlug}-${counter}`;

          counter++;
        }



        updateData.slug =
          slug;
      }



      // ======================================================
      // IMAGE UPDATE
      // ======================================================

      if (req.file) {

        if (
          campaign.imagePublicId
        ) {

          await cloudinary
            .uploader
            .destroy(

              campaign
                .imagePublicId
            );
        }



        updateData.imageUrl =
          req.file.path;

        updateData.imagePublicId =
          req.file.filename;
      }



      await campaign.update(
        updateData,
        { transaction }
      );



      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "CAMPAIGN_UPDATED",

        meta: {

          campaignId:
            campaign.id,
        },

      }, { transaction });



      await transaction.commit();



      res.json({

        message:
          "Campaign updated successfully",

        campaign,
      });

    } catch (error) {

      await transaction.rollback();

      console.error(
        "Update Campaign Error:",
        error
      );

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };

// ---------------- DELETE ----------------
// ---------------- DELETE ----------------
export const deleteCampaign = async (req, res) => {
  const transaction = await Campaign.sequelize.transaction();

  try {
    const campaign = await Campaign.findByPk(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // 🔐 Ownership check
    if (
      campaign.userId !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (campaign.imagePublicId) {
      await cloudinary.uploader.destroy(campaign.imagePublicId);
    }

    await campaign.destroy({ transaction });

    await ActivityLog.create({
      userId: req.user.id,
      action: "CAMPAIGN_DELETED",
      meta: { campaignId: campaign.id },
    }, { transaction });

    await transaction.commit();

    res.json({ message: "Campaign deleted successfully" });

  } catch (error) {
    await transaction.rollback();
    console.error("Delete Campaign Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- READ ALL ----------------


export const getAllCampaigns = async (req, res) => {
  try {
    let {

  page = 1,

  limit = 10,

  type,

  status,

  search,

} = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const offset = (page - 1) * limit;

    const where = {};

    if (type) where.type = type;
    if (status) where.status = status;

    if (search) {

      where.title = {

        [Op.like]:
          `%${search}%`,
      };
    }

    const { rows, count } = await Campaign.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [

          {

            association:
              "creator",

            attributes: [
              "id",
              "fullName",
              "email",
            ],
          },
        ],
    });

    res.json({
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      campaigns: rows,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- READ ONE ----------------
export const getCampaignById =
  async (req, res) => {

    try {

      const campaign =
        await Campaign.findOne({

          where: {

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

          include: [

            {

              association:
                "registrations",

              attributes: [
                "id",
              ],
            },

            {

              association:
                "creator",

              attributes: [
                "id",
                "fullName",
                "email",
              ],
            },
          ],
        });



      if (!campaign) {

        return res.status(404)
          .json({
            message:
              "Campaign not found",
          });
      }



      const response = {

        ...campaign.toJSON(),

        registrationCount:
          campaign.registrations
            ?.length || 0,
      };



      res.json(response);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };

  export const featureCampaign =
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



      await campaign.update({

        featured:
          !campaign.featured,
      });



      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          campaign.featured
            ? "CAMPAIGN_FEATURED"
            : "CAMPAIGN_UNFEATURED",

        meta: {

          campaignId:
            campaign.id,
        },
      });



      res.json({

        message:
          campaign.featured
            ? "Campaign featured"
            : "Campaign unfeatured",

        featured:
          campaign.featured,
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };

  export const publishCampaign =
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



      await campaign.update({

        status:
          "active",
      });



      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "CAMPAIGN_PUBLISHED",

        meta: {

          campaignId:
            campaign.id,
        },
      });



      res.json({

        message:
          "Campaign published successfully",

        campaign,
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };

  export const archiveCampaign =
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



      await campaign.update({

        status:
          "archived",
      });



      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "CAMPAIGN_ARCHIVED",

        meta: {

          campaignId:
            campaign.id,
        },
      });



      res.json({

        message:
          "Campaign archived successfully",

        campaign,
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };

  export const incrementCampaignViews =
  async (req, res) => {

    try {

      const campaign =
        await Campaign.findOne({

          where: {

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
        });



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



      res.json({

        message:
          "View counted",
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };

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



      res.json({
        message:
          "Click counted",
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };


  // USERS//

  /**
 * PUBLIC – only active campaigns
 */
export const getPublicCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({
      where: {
        status: "active",          // only public ones
      },
      order: [["createdAt", "DESC"]],
      attributes: {
        exclude: [],               // or hide sensitive fields if needed
      },
    });

    return res.json(campaigns);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUBLIC – single active campaign
 */
export const getPublicCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      where: {
        [Op.or]: [
          { id: req.params.id },
          { slug: req.params.id },
        ],
        status: "active",
      },
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    return res.json(campaign);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};