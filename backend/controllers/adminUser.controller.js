import bcrypt
from "bcryptjs";

import validator
from "validator";

import { Op }
from "sequelize";

import models
from "../models/index.js";



const {

  User,
  ActivityLog,
  StudentProfile,
  TutorProfile,

} = models;



// ======================================================
// CREATE USER (ADMIN)
// ======================================================

export const createUserByAdmin =
  async (req, res) => {

    try {

      let {

        fullName,
        email,
        password,
        role,

      } = req.body;



      // ======================================================
      // SANITIZE
      // ======================================================

      fullName =
        fullName?.trim();

      email =
        email?.trim()
          .toLowerCase();

      password =
        password?.trim();



      // ======================================================
      // VALIDATE
      // ======================================================

      if (
        !fullName ||
        !email ||
        !password
      ) {

        return res.status(400)
          .json({

            message:
              "Full name, email and password are required",
          });
      }



      if (
        !validator.isEmail(
          email
        )
      ) {

        return res.status(400)
          .json({

            message:
              "Invalid email",
          });
      }



      const existingUser =
        await User.findOne({

          where: { email },
        });



      if (existingUser) {

        return res.status(400)
          .json({

            message:
              "User already exists",
          });
      }



      // ======================================================
      // HASH PASSWORD
      // ======================================================

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );



      // ======================================================
      // CREATE USER
      // ======================================================

      const user =
        await User.create({

          fullName,

          email,

          passwordHash,

          role:
            role || "student",

          isVerified:
            true,

          isActive:
            true,

          verificationToken:
            null,

          verificationTokenExpiry:
            null,
        });



      // ======================================================
      // AUTO PROFILE
      // ======================================================

      if (
        user.role ===
        "student"
      ) {

        await StudentProfile.create({

          userId:
            user.id,

          fullName:
            user.fullName,

          email:
            user.email,
        });
      }



      if (
        user.role ===
        "tutor"
      ) {

        await TutorProfile.create({

          userId:
            user.id,

          fullName:
            user.fullName,

          email:
            user.email,
        });
      }



      // ======================================================
      // LOG
      // ======================================================

      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "ADMIN_CREATED_USER",

        meta: {

          createdUserId:
            user.id,

          createdUserEmail:
            user.email,

          role:
            user.role,
        },
      });



      const safeUser =
        user.toJSON();

      delete safeUser.passwordHash;



      return res.status(201)
        .json({

          message:
            "User created successfully",

          user:
            safeUser,
        });

    } catch (error) {

      console.error(error);

      return res.status(500)
        .json({

          message:
            "Server error",
        });
    }
  };



// ======================================================
// GET USERS
// ======================================================

export const getUsers =
  async (req, res) => {

    try {

      const {

        page = 1,
        limit = 20,
        role,
        isActive,
        isVerified,
        search,

      } = req.query;



      const offset =
        (page - 1) * limit;



      let where = {};



      // ======================================================
      // ROLE
      // ======================================================

      if (role) {

        where.role = role;
      }



      // ======================================================
      // ACTIVE
      // ======================================================

      if (
        isActive !== undefined
      ) {

        where.isActive =
          isActive === "true";
      }



      // ======================================================
      // VERIFIED
      // ======================================================

      if (
        isVerified !== undefined
      ) {

        where.isVerified =
          isVerified === "true";
      }



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
      // QUERY
      // ======================================================

      const {

        count,
        rows,

      } = await User.findAndCountAll({

        where,

        attributes: {

          exclude: [
            "passwordHash",
            "verificationToken",
            "resetToken",
          ],
        },

        order: [
          ["createdAt", "DESC"]
        ],

        limit:
          parseInt(limit),

        offset:
          parseInt(offset),
      });



      return res.json({

        total:
          count,

        page:
          parseInt(page),

        pages:
          Math.ceil(
            count / limit
          ),

        users:
          rows,
      });

    } catch (error) {

      console.error(error);

      return res.status(500)
        .json({

          message:
            "Server error",
        });
    }
  };



// ======================================================
// TOGGLE ACTIVE STATUS
// ======================================================

export const toggleUserStatus =
  async (req, res) => {

    try {

      const user =
        await User.findByPk(
          req.params.id
        );



      if (!user) {

        return res.status(404)
          .json({

            message:
              "User not found",
          });
      }



      user.isActive =
        !user.isActive;

      await user.save();



      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "USER_STATUS_UPDATED",

        meta: {

          targetUserId:
            user.id,

          isActive:
            user.isActive,
        },
      });



      return res.json({

        message:
          `User ${user.isActive ? "activated" : "deactivated"}`,

        user,
      });

    } catch (error) {

      console.error(error);

      return res.status(500)
        .json({

          message:
            "Server error",
        });
    }
  };



// ======================================================
// UPDATE ROLE
// ======================================================

export const updateUserRole =
  async (req, res) => {

    try {

      const {
        role,
      } = req.body;



      const user =
        await User.findByPk(
          req.params.id
        );



      if (!user) {

        return res.status(404)
          .json({

            message:
              "User not found",
          });
      }



      user.role = role;

      await user.save();



      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "USER_ROLE_UPDATED",

        meta: {

          targetUserId:
            user.id,

          role,
        },
      });



      return res.json({

        message:
          "User role updated",

        user,
      });

    } catch (error) {

      console.error(error);

      return res.status(500)
        .json({

          message:
            "Server error",
        });
    }
  };