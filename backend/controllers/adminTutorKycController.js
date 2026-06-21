import models from "../models/index.js";
import { cloudinary } from "../config/cloudinary.js";
import { Op } from "sequelize";

const {
  TutorProfile,
  ActivityLog,
  Notification,
  User,
  TutorStudent,
  ClassSession,
} = models;



// ======================================================
// GET ALL TUTOR PROFILES
// ======================================================

export const getAllTutorProfiles =
  async (req, res) => {

    try {

      let {
        page = 1,
        limit = 10,
        search,
        verificationStatus,
        availabilityStatus,
      } = req.query;

      page =
        parseInt(page);

      limit =
        parseInt(limit);

      const offset =
        (page - 1) * limit;

      const where = {};

      // ======================================================
      // SEARCH
      // ======================================================

      if (search) {

        where[Op.or] = [

          {
            fullName: {
              [Op.like]:
                `%${search}%`,
            },
          },

          {
            email: {
              [Op.like]:
                `%${search}%`,
            },
          },
        ];
      }

      // ======================================================
      // FILTERS
      // ======================================================

      if (verificationStatus) {
        where.verificationStatus =
          verificationStatus;
      }

      if (availabilityStatus) {
        where.availabilityStatus =
          availabilityStatus;
      }

      // ======================================================
      // QUERY
      // ======================================================

      const {
        rows,
        count,
      } =
        await TutorProfile.findAndCountAll({

          where,

          limit,

          offset,

          order: [
            ["createdAt", "DESC"],
          ],

          include: [

            {
              model: User,
              attributes: [
                "id",
                "email",
                "role",
              ],
            },

            {
              model: TutorStudent,
            },

            {
              model: ClassSession,
            },
          ],
        });

      res.json({

        total:
          count,

        currentPage:
          page,

        totalPages:
          Math.ceil(
            count / limit
          ),

        tutors:
          rows,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch tutors",
      });
    }
  };



// ======================================================
// GET TUTOR PROFILE BY ID
// ======================================================

export const getTutorProfileById =
  async (req, res) => {

    try {

      const profile =
        await TutorProfile.findByPk(
          req.params.id,
          {

            include: [

              {
                model: User,
                attributes: [
                  "id",
                  "email",
                  "role",
                ],
              },

              {
                model: TutorStudent,
              },

              {
                model: ClassSession,
              },
            ],
          }
        );

      if (!profile) {

        return res.status(404).json({
          message:
            "Tutor profile not found",
        });
      }

      res.json({
        profile,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch tutor profile",
      });
    }
  };



// ======================================================
// UPDATE TUTOR PROFILE (ADMIN)
// ======================================================

export const updateTutorProfileAdmin =
  async (req, res) => {

    try {

      const profile =
        await TutorProfile.findByPk(
          req.params.id
        );

      if (!profile) {

        return res.status(404).json({
          message:
            "Tutor profile not found",
        });
      }

      // ======================================================
      // PARSE JSON
      // ======================================================

      const expertise =
        req.body.expertise
          ? JSON.parse(req.body.expertise)
          : profile.expertise;

      const certifications =
        req.body.certifications
          ? JSON.parse(req.body.certifications)
          : profile.certifications;

      const socialLinks =
        req.body.socialLinks
          ? JSON.parse(req.body.socialLinks)
          : profile.socialLinks;

      // ======================================================
      // IMAGE
      // ======================================================

      if (req.file) {

        if (
          profile.cloudinary_id
        ) {

          await cloudinary.uploader.destroy(
            profile.cloudinary_id
          );
        }

        profile.profilePicUrl =
          req.file.path;

        profile.cloudinary_id =
          req.file.filename;
      }

      // ======================================================
      // UPDATE
      // ======================================================

      profile.phone =
        req.body.phone ??
        profile.phone;

      profile.bio =
        req.body.bio ??
        profile.bio;

      profile.address =
        req.body.address ??
        profile.address;

      profile.hourlyRate =
        req.body.hourlyRate ??
        profile.hourlyRate;

      profile.linkedinUrl =
        req.body.linkedinUrl ??
        profile.linkedinUrl;

      profile.websiteUrl =
        req.body.websiteUrl ??
        profile.websiteUrl;

      profile.availabilityStatus =
        req.body.availabilityStatus ??
        profile.availabilityStatus;

      profile.verificationStatus =
        req.body.verificationStatus ??
        profile.verificationStatus;

      profile.verificationNotes =
        req.body.verificationNotes ??
        profile.verificationNotes;

      profile.approved =
        req.body.approved ??
        profile.approved;

      profile.expertise =
        expertise;

      profile.certifications =
        certifications;

      profile.socialLinks =
        socialLinks;

      await profile.save();

      // ======================================================
      // ACTIVITY LOG
      // ======================================================

      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "ADMIN_UPDATED_TUTOR_PROFILE",

        meta: {
          tutorProfileId:
            profile.id,
        },
      });

      res.json({

        message:
          "Tutor profile updated successfully",

        profile,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to update tutor profile",
      });
    }
  };



// ======================================================
// DELETE TUTOR PROFILE (ADMIN)
// ======================================================

export const deleteTutorProfileAdmin =
  async (req, res) => {

    try {

      const profile =
        await TutorProfile.findByPk(
          req.params.id
        );

      if (!profile) {

        return res.status(404).json({
          message:
            "Tutor profile not found",
        });
      }

      // ======================================================
      // DELETE CLOUDINARY IMAGE
      // ======================================================

      if (
        profile.cloudinary_id
      ) {

        await cloudinary.uploader.destroy(
          profile.cloudinary_id
        );
      }

      await profile.destroy();

      // ======================================================
      // LOG
      // ======================================================

      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "ADMIN_DELETED_TUTOR_PROFILE",

        meta: {
          tutorProfileId:
            profile.id,
        },
      });

      res.json({
        message:
          "Tutor profile deleted successfully",
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to delete tutor profile",
      });
    }
  };



// ======================================================
// APPROVE TUTOR PROFILE
// ======================================================

export const approveTutorProfile =
  async (req, res) => {

    try {

      const profile =
        await TutorProfile.findByPk(
          req.params.id
        );

      if (!profile) {

        return res.status(404).json({
          message:
            "Tutor not found",
        });
      }

      profile.approved =
        true;

      profile.verificationStatus =
        "verified";

      profile.verificationNotes =
        req.body.verificationNotes || null;

      await profile.save();

      // ======================================================
      // NOTIFICATION
      // ======================================================

      await Notification.create({

        title:
          "Tutor Approved",

        message:
          `${profile.fullName} has been approved as a tutor`,

        type:
          "support",

        entityId:
          profile.id,

        entityType:
          "tutor_profile",
      });

      // ======================================================
      // ACTIVITY LOG
      // ======================================================

      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "APPROVE_TUTOR_PROFILE",

        meta: {
          profileId:
            profile.id,
        },
      });

      res.json({

        message:
          "Tutor approved successfully",

        profile,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to approve tutor",
      });
    }
  };



// ======================================================
// REJECT TUTOR PROFILE
// ======================================================

export const rejectTutorProfile =
  async (req, res) => {

    try {

      const profile =
        await TutorProfile.findByPk(
          req.params.id
        );

      if (!profile) {

        return res.status(404).json({
          message:
            "Tutor not found",
        });
      }

      profile.approved =
        false;

      profile.verificationStatus =
        "rejected";

      profile.verificationNotes =
        req.body.verificationNotes;

      await profile.save();

      // ======================================================
      // NOTIFICATION
      // ======================================================

      await Notification.create({

        title:
          "Tutor Verification Rejected",

        message:
          `${profile.fullName}'s tutor verification was rejected`,

        type:
          "support",

        entityId:
          profile.id,

        entityType:
          "tutor_profile",
      });

      // ======================================================
      // LOG
      // ======================================================

      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "REJECT_TUTOR_PROFILE",

        meta: {
          profileId:
            profile.id,
        },
      });

      res.json({

        message:
          "Tutor profile rejected",

        profile,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to reject tutor",
      });
    }
  };