// controllers/user.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendMail.js";
import crypto from "crypto";
import { Op } from "sequelize";
import { passwordResetTemplate, verificationTemplate } from "../utils/emailTemplates.js";
import validator from "validator";
import models from '../models/index.js';
import dotenv from "dotenv";
//import { Op } from "sequelize";

const { ActivityLog, User, TutorProfile, StudentProfile, Notification, PendingRegistration } = models;

dotenv.config();

const FRONTEND_URL= "https://gieva.ng"



// ---------------- CREATE USER ----------------

export const createUser = async (req, res) => {
  try {
    let { fullName, email, password, role } = req.body;

    // 1. Normalize input
    fullName = fullName?.trim();
    email = email?.trim().toLowerCase();
    role = role || "student";

    // Do not silently trim the password; validate what the user submitted.
    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !fullName ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        message: "Full name, email and password are required.",
      });
    }

    // 2. Validate full name
    if (fullName.length < 3) {
      return res.status(400).json({
        message: "Full name must be at least 3 characters long.",
      });
    }

    // 3. Validate email
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format.",
      });
    }

    const blockedDomains = [
      "mailinator.com",
      "tempmail.com",
      "10minutemail.com",
    ];

    const emailDomain = email.split("@")[1]?.toLowerCase();

    if (blockedDomains.includes(emailDomain)) {
      return res.status(400).json({
        message: "Disposable email addresses are not allowed.",
      });
    }

    // 4. Validate role against roles permitted for public registration.
    const allowedRoles = ["student", "tutor", "applicant"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid registration role.",
      });
    }

    // 5. Validate password BEFORE touching the database.
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
      });
    }

    if (!validator.isStrongPassword(password)) {
      return res.status(400).json({
        message: "Password is too weak. Try a stronger combination.",
      });
    }

    // 6. Check whether a fully registered account already exists.
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser?.isVerified) {
      return res.status(409).json({
        message:
          "An account with this email already exists. Please sign in instead.",
      });
    }

    /*
     * IMPORTANT:
     * An unverified User row from your OLD registration system must be
     * migrated/cleaned up before deploying this new flow. See the migration
     * instructions below. Do not silently delete it here because other tables
     * may reference that user's ID.
     */
    if (existingUser && !existingUser.isVerified) {
      return res.status(409).json({
        message:
          "This email has an old, unverified registration. Please contact support while we restore the registration for this email.",
      });
    }

    // 7. Look up a pending registration.
    let pending = await PendingRegistration.findOne({
      where: { email },
    });

    const now = new Date();

    // 8. Enforce the cooldown if the email has already used five sends.
    if (pending?.cooldownUntil) {
      const cooldownEnd = new Date(pending.cooldownUntil);

      if (cooldownEnd > now) {
        const remainingMs = cooldownEnd.getTime() - now.getTime();
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        const remainingHours = Math.floor(remainingMinutes / 60);
        const minutes = remainingMinutes % 60;

        const remainingText =
          remainingHours > 0
            ? `${remainingHours} hour(s) and ${minutes} minute(s)`
            : `${remainingMinutes} minute(s)`;

        return res.status(429).json({
          code: "REGISTRATION_COOLDOWN",
          message:
            `Too many registration attempts. This email is under a ` +
            `cooldown period. Please try again in ${remainingText}.`,
          retryAfterSeconds: Math.ceil(remainingMs / 1000),
        });
      }

      // Cooldown expired: allow a fresh five-send window.
      pending.registrationAttempts = 0;
      pending.cooldownUntil = null;
    }

    // 9. Generate a fresh token and hash the password.
    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(
      now.getTime() + 60 * 60 * 1000
    ); // Link expires after 1 hour.

    const nextAttempt = (pending?.registrationAttempts || 0) + 1;

    // After the fifth verification email is sent, cooldown begins.
    const cooldownUntil =
      nextAttempt >= 5
        ? new Date(now.getTime() + 2 * 60 * 60 * 1000)
        : null;

    // 10. Create or update the pending record; DO NOT create a User yet.
    if (pending) {
      pending.fullName = fullName;
      pending.passwordHash = passwordHash;
      pending.role = role;
      pending.verificationToken = verificationToken;
      pending.verificationTokenExpiry = verificationTokenExpiry;
      pending.registrationAttempts = nextAttempt;
      pending.cooldownUntil = cooldownUntil;
      pending.verifiedAt = null;

      await pending.save();
    } else {
      pending = await PendingRegistration.create({
        fullName,
        email,
        passwordHash,
        role,
        verificationToken,
        verificationTokenExpiry,
        registrationAttempts: 1,
        cooldownUntil: null,
      });
    }

    // 11. Send a fresh verification link.
    const frontendUrl =
      process.env.FRONTEND_URL || FRONTEND_URL;

    const verifyLink =
      `${frontendUrl.replace(/\/$/, "")}/verify/${verificationToken}`;

    await sendEmail(
      email,
      "Verify Your GIEVA Account",
      verificationTemplate(fullName, verifyLink)
    );

    // 12. Do not return the password hash or token to the browser.
    return res.status(200).json({
      message: cooldownUntil
        ? "Verification email sent. You have reached the verification-email limit; further requests for this email are paused for 2 hours. Please check your inbox."
        : "Verification email sent. Please check your inbox to verify your account.",
      verificationRequired: true,
    });
  } catch (error) {
    console.error("Create User Error:", error);

    // Avoid leaking database errors or internal implementation details.
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message:
          "A registration request is already being processed for this email. Please try again shortly.",
      });
    }

    return res.status(500).json({
      message:
        "We could not process your registration right now. Please try again later.",
    });
  }
};

 

// ---------------- VERIFY ACCOUNT ----------------

export const verifyAccount = async (req, res) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");

  try {
    const token = decodeURIComponent(req.params.token || "").trim();

    if (!token) {
      return res.status(400).json({
        message: "Verification token is required.",
      });
    }

    // Use a transaction so account creation and pending verification
    // are committed together.
    const result = await User.sequelize.transaction(async (transaction) => {
      const pending = await PendingRegistration.findOne({
        where: { verificationToken: token },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!pending) {
        return {
          status: 400,
          body: {
            message: "Invalid or expired verification token.",
          },
        };
      }

      // A duplicate click on a link that already succeeded is harmless.
      if (pending.verifiedAt) {
        return {
          status: 200,
          body: {
            message: "Account already verified. You can log in.",
          },
        };
      }

      if (
        !pending.verificationTokenExpiry ||
        new Date() > new Date(pending.verificationTokenExpiry)
      ) {
        return {
          status: 400,
          body: {
            message:
              "Verification link has expired. Please register again to request a new link.",
          },
        };
      }

      if (!pending.passwordHash) {
        return {
          status: 400,
          body: {
            message:
              "This registration cannot be completed. Please register again.",
          },
        };
      }

      // Defensive check in case an account was created through another path.
      const existingUser = await User.findOne({
        where: { email: pending.email },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (existingUser) {
        if (existingUser.isVerified) {
          pending.verifiedAt = new Date();
          pending.passwordHash = null;
          await pending.save({ transaction });

          return {
            status: 200,
            body: {
              message: "Account already verified. You can log in.",
            },
          };
        }

        // An old unverified User row must be resolved through migration.
        throw new Error(
          `Legacy unverified User row exists for ${pending.email}`
        );
      }

      // The real User record is created ONLY after verification.
      const user = await User.create(
        {
          fullName: pending.fullName,
          email: pending.email,
          passwordHash: pending.passwordHash,
          role: pending.role,
          isActive: true,
          isVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        },
        { transaction }
      );

      // Create the student profile only after the account is verified.
      if (user.role === "student") {
        await StudentProfile.create(
          {
            userId: user.id,
            fullName: user.fullName,
            email: user.email,
          },
          { transaction }
        );
      }

      await ActivityLog.create(
        {
          userId: user.id,
          action: "USER_VERIFIED",
        },
        { transaction }
      );

      await Notification.create(
        {
          title: "New User Signup",
          message: `${user.fullName} just joined`,
          type: "user_registration",
          userId: user.id,
        },
        { transaction }
      );

      // Retain the token record for duplicate-link handling,
      // but clear the temporary password hash.
      pending.verifiedAt = new Date();
      pending.passwordHash = null;
      pending.cooldownUntil = null;

      await pending.save({ transaction });

      return {
        status: 200,
        body: {
          message: "Account verified successfully. You can now log in.",
        },
      };
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Verify Account Error:", error);

    return res.status(500).json({
      message:
        "We could not complete email verification. Please try again later.",
    });
  }
};

 
// ---------------- READ ALL USERS ----------------
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    return res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ---------------- READ SINGLE USER ----------------
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ---------------- UPDATE USER ----------------
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, password, role, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent duplicate email
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    user.fullName = fullName ?? user.fullName;
    user.email = email ?? user.email;
    user.role = role ?? user.role;
    user.isActive = isActive ?? user.isActive;

    await user.save();

    // Activity log
    await ActivityLog.create({
      userId: user.id,
      action: "USER_UPDATED",
      meta: { updatedFields: { fullName, email, role, isActive } }
    });

    const safeUser = user.toJSON();
    delete safeUser.passwordHash;

    return res.json({ message: "User updated", user: safeUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};


// ---------------- DELETE USER ----------------
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.destroy();

    await ActivityLog.create({
      userId: id,
      action: "USER_DELETED",
      meta: { email: user.email }
    });

    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};



const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email first" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account disabled" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    await ActivityLog.create({
      userId: user.id,
      action: "USER_LOGIN"
    });

    //console.log("DECODED TOKEN:", decoded);
    return res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};


// ---------------- FORGOT PASSWORD ----------------
const RESET_TOKEN_EXPIRY = 1000 * 60 * 30; // 30 mins


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY);

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail(
      user.email,
      "Password Reset",
      passwordResetTemplate(user.fullName, resetLink)
    );

    await ActivityLog.create({
      userId: user.id,
      action: "PASSWORD_RESET_REQUESTED"
    });

    return res.json({ message: "Reset link sent to email" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ---------------- RESET PASSWORD ----------------
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token & new password required" });
    }

    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    await ActivityLog.create({
      userId: user.id,
      action: "PASSWORD_RESET_COMPLETED"
    });

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
