import models from "../models/index.js";
import { cloudinary } from "../config/cloudinary.js";
//import pool from "../config/db.js"; // your mysql pool connection

const { StudentProfile, ActivityLog } = models;


//
// ================= CREATE PROFILE =================
//
export const createStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const existing = await StudentProfile.findOne({ where: { userId } });
    if (existing) {
      return res.status(400).json({ message: "Profile already exists" });
    }

    const user = await models.User.findByPk(userId);

    let profilePicUrl = null;
    let cloudinaryId = null;

    if (req.file) {
      profilePicUrl = req.file.path;
      cloudinaryId = req.file.filename;
    }

    if (!req.body.phone) {
        return res.status(400).json({
          message: "Phone number required",
        });
      }

      if (!req.body.school) {
        return res.status(400).json({
          message: "School required",
        });
      }

    const profile = await StudentProfile.create({
      userId,
      fullName: user.fullName,
      email: user.email,
      profilePicUrl,
      cloudinary_id: cloudinaryId,
      phone: req.body.phone,
      bio: req.body.bio,
      dob: req.body.dob,
      level: req.body.level,
      school: req.body.school,
      address: req.body.address,
      guardianName: req.body.guardianName,
      guardianPhone: req.body.guardianPhone,
    });

    await ActivityLog.create({
      userId,
      action: "CREATE_STUDENT_PROFILE",
      meta: { profileId: profile.id },
    });

    res.status(201).json({ profile });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


//
// ================= GET PROFILE BY ID =================
//
export const getStudentProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await StudentProfile.findByPk(id);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.json({
      ...profile.toJSON(),
      profilePicUrl: profile.profilePicUrl || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};





//
// ================= UPDATE PROFILE =================
//
export const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await StudentProfile.findOne({ where: { userId } });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // ===== RESYNC USER DATA FROM USERS TABLE =====
    const user = await models.User.findByPk(
      userId
    );

    if (user) {
      profile.fullName = user.fullName;
      profile.email = user.email;
    }

    // ===== IMAGE UPDATE =====
    if (req.file) {
      if (profile.cloudinary_id) {
        await cloudinary.uploader.destroy(profile.cloudinary_id);
      }

      profile.profilePicUrl = req.file.path;
      profile.cloudinary_id = req.file.filename;
    }

    // ===== UPDATE OTHER FIELDS =====
    profile.phone = req.body.phone ?? profile.phone;
    profile.bio = req.body.bio ?? profile.bio;
    profile.dob = req.body.dob ?? profile.dob;
    profile.level = req.body.level ?? profile.level;
    profile.school = req.body.school ?? profile.school;
    profile.address = req.body.address ?? profile.address;
    profile.guardianName = req.body.guardianName ?? profile.guardianName;
    profile.guardianPhone = req.body.guardianPhone ?? profile.guardianPhone;

    await profile.save();

    await ActivityLog.create({
      userId,
      action: "UPDATE_STUDENT_PROFILE",
      meta: { profileId: profile.id },
    });

    return res.json({
      message: "Profile updated",
      profile,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};


//
// ================= DELETE PROFILE =================
//
export const deleteStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await StudentProfile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (profile.cloudinary_id) {
      try {
          await cloudinary.uploader.destroy(profile.cloudinary_id);
        } catch (err) {
          console.warn("Cloudinary delete failed", err);
        }
    }

    await profile.destroy();

    await ActivityLog.create({
      userId,
      action: "DELETE_STUDENT_PROFILE",
      meta: { profileId: profile.id },
    });

    return res.json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};


//
// ================= GET MY PROFILE =================
//
export const getMyStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile =
  await StudentProfile.findOne({
    where: { userId },

    include: [
      {
        model: models.Enrollment,
        include: [
          {
            model: models.Course,
          },
        ],
      },

      {
        model: models.Payment,
        where: {
          status: "success",
        },
        required: false,
      },
    ],
  });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.json({
    id: profile.id,
    userId: profile.userId,
    fullName: profile.fullName,
    email: profile.email,
    profilePicUrl:
      profile.profilePicUrl || null,

    phone: profile.phone,
    bio: profile.bio,
    dob: profile.dob,

    level: profile.level,
    school: profile.school,
    address: profile.address,

    guardianName:
      profile.guardianName,

    guardianPhone:
      profile.guardianPhone,

    enrollments:
      profile.Enrollments || [],

    payments:
      profile.Payments || [],

    createdAt: profile.createdAt,
  });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};