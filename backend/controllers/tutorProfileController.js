import models from "../models/index.js";
import { cloudinary } from "../config/cloudinary.js";

const {
  TutorProfile,
  ActivityLog,
  Notification,
  User,
} = models;



// ======================================================
// CREATE TUTOR PROFILE
// ======================================================

export const createTutorProfile =
  async (req, res) => {

    try {

      console.log(
  "AUTH USER:",
  req.user
);

      const userId =
        req.user.id;

        console.log(
  "USER ID:",
  req.user.id
);

      // ======================================================
      // CHECK EXISTING
      // ======================================================

      const existing =
        await TutorProfile.findOne({
          where: { userId },
        });
        console.log(
  "FOUND PROFILE:",
  existing
);

      if (existing) {
        return res.status(400).json({
          message:
            "Tutor profile already exists",
        });
      }

      // ======================================================
      // USER
      // ======================================================

      const user =
        await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      // ======================================================
      // PARSE JSON FIELDS
      // ======================================================

      const expertise =
        req.body.expertise
          ? JSON.parse(req.body.expertise)
          : [];

      const certifications =
        req.body.certifications
          ? JSON.parse(req.body.certifications)
          : [];

      const socialLinks =
        req.body.socialLinks
          ? JSON.parse(req.body.socialLinks)
          : {};

      // ======================================================
      // IMAGE
      // ======================================================

      let profilePicUrl = null;
      let cloudinaryId = null;

      if (req.file) {

        profilePicUrl =
          req.file.path;

        cloudinaryId =
          req.file.filename;
      }

      // ======================================================
      // CREATE PROFILE
      // ======================================================

      const profile =
        await TutorProfile.create({

          userId,

          fullName:
            user.fullName,

          email:
            user.email,

          profilePicUrl,

          cloudinary_id:
            cloudinaryId,

          phone:
            req.body.phone,

          bio:
            req.body.bio,

          dob:
            req.body.dob,

          address:
            req.body.address,

          expertise,

          certifications,

          yearsOfExperience:
            req.body.yearsOfExperience || 0,

          linkedinUrl:
            req.body.linkedinUrl,

          websiteUrl:
            req.body.websiteUrl,

          socialLinks,

          hourlyRate:
            req.body.hourlyRate || 0,

          availabilityStatus:
            req.body.availabilityStatus || "available",

          lastActiveAt:
            new Date(),
        });

        console.log(
  "CREATED PROFILE USER ID:",
  profile.userId
);

      // ======================================================
      // ACTIVITY LOG
      // ======================================================

      await ActivityLog.create({
        userId,

        action:
          "CREATE_TUTOR_PROFILE",

        meta: {
          profileId:
            profile.id,
        },
      });

      // ======================================================
      // NOTIFICATION
      // ======================================================

      console.log(
  "SENDING SUCCESS RESPONSE"
);

     res.status(201).json({
  message:
    "Tutor profile created successfully",
  profile,
});

// fire-and-forget notification
// Notification.create({
//   title:
//     "Tutor Profile Created",

//   message:
//     `${profile.fullName} created a tutor profile`,

//   type:
//     "tutor_profile",

//   entityId:
//     profile.id,

//   entityType:
//     "tutor_profile",
// }).catch(console.error);

      // res.status(201).json({

      //   message:
      //     "Tutor profile created successfully",

      //   profile,
      // });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to create tutor profile",
      });
    }
  };



// ======================================================
// GET MY PROFILE
// ======================================================

export const getMyTutorProfile =
  async (req, res) => {

    try {

      console.log(
        "AUTH USER:",
        req.user
      );

      const userId =
        req.user.id;

      console.log(
        "USER ID:",
        userId
      );



      // ======================================================
      // FIND PROFILE
      // ======================================================

      const profile =
        await TutorProfile.findOne({

          where: {
            userId,
          },
        });

      console.log(
        "FOUND PROFILE:",
        profile
      );



      // ======================================================
      // NO PROFILE
      // ======================================================

      if (!profile) {

        return res.status(200).json({

          success: true,

          profile: null,
        });
      }



      // ======================================================
      // SUCCESS
      // ======================================================

      return res.status(200).json({

        success: true,

        profile,
      });

    } catch (err) {

      console.error(err);

      return res.status(500).json({

        success: false,

        message:
          "Failed to fetch profile",
      });
    }
  };



// ======================================================
// GET PROFILE BY ID
// ======================================================

export const getTutorProfileById =
  async (req, res) => {

    try {

      const profile =
        await TutorProfile.findByPk(
          req.params.id
        );

      if (!profile) {
        return res.status(404).json({
          message:
            "Profile not found",
        });
      }

      res.json({
        profile,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch profile",
      });
    }
  };



// ======================================================
// UPDATE PROFILE
// ======================================================

export const updateTutorProfile =
  async (req, res) => {

    try {

      const userId =
        req.user.id;

      const profile =
        await TutorProfile.findOne({
          where: { userId },
        });

      if (!profile) {
        return res.status(404).json({
          message:
            "Profile not found",
        });
      }

      // ======================================================
      // RESYNC USER DATA
      // ======================================================

      const user =
        await User.findByPk(userId);

      if (user) {

        profile.fullName =
          user.fullName;

        profile.email =
          user.email;
      }

      // ======================================================
      // IMAGE UPDATE
      // ======================================================

      if (req.file) {

        if (profile.cloudinary_id) {

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
      // PARSE JSON FIELDS
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
      // UPDATE FIELDS
      // ======================================================

      profile.phone =
        req.body.phone ??
        profile.phone;

      profile.bio =
        req.body.bio ??
        profile.bio;

      profile.dob =
        req.body.dob ??
        profile.dob;

      profile.address =
        req.body.address ??
        profile.address;

      profile.expertise =
        expertise;

      profile.certifications =
        certifications;

      profile.socialLinks =
        socialLinks;

      profile.linkedinUrl =
        req.body.linkedinUrl ??
        profile.linkedinUrl;

      profile.websiteUrl =
        req.body.websiteUrl ??
        profile.websiteUrl;

      profile.hourlyRate =
        req.body.hourlyRate ??
        profile.hourlyRate;

      profile.yearsOfExperience =
        req.body.yearsOfExperience ??
        profile.yearsOfExperience;

      profile.availabilityStatus =
        req.body.availabilityStatus ??
        profile.availabilityStatus;

      profile.lastActiveAt =
        new Date();

      await profile.save();

      // ======================================================
      // LOG
      // ======================================================

      await ActivityLog.create({

        userId,

        action:
          "UPDATE_TUTOR_PROFILE",

        meta: {
          profileId:
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
          "Failed to update profile",
      });
    }
  };



// ======================================================
// DELETE PROFILE
// ======================================================

export const deleteTutorProfile =
  async (req, res) => {

    try {

      const userId =
        req.user.id;

      const profile =
        await TutorProfile.findOne({
          where: { userId },
        });

      if (!profile) {
        return res.status(404).json({
          message:
            "Profile not found",
        });
      }

      // ======================================================
      // DELETE IMAGE
      // ======================================================

      if (profile.cloudinary_id) {

        await cloudinary.uploader.destroy(
          profile.cloudinary_id
        );
      }

      await profile.destroy();

      // ======================================================
      // LOG
      // ======================================================

      await ActivityLog.create({

        userId,

        action:
          "DELETE_TUTOR_PROFILE",

        meta: {
          profileId:
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
          "Failed to delete profile",
      });
    }
  };



