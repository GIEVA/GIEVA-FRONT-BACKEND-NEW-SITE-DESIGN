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

const { ActivityLog, User, TutorProfile, StudentProfile, Notification } = models;

dotenv.config();

const FRONTEND_URL= "http://localhost:3000"

// ---------------- CREATE USER ----------------

export const createUser = async (req, res) => {
  try {
    let { fullName, email, password, role } = req.body;

    // ---------------- SANITIZE INPUT ----------------
    fullName = fullName?.trim();
    email = email?.trim().toLowerCase();
    password = password?.trim();

    // ---------------- BASIC CHECK ----------------
    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "Full name, email and password are required",
      });
    }

    // ---------------- FULL NAME VALIDATION ----------------
    if (fullName.length < 3) {
      return res.status(400).json({
        message: "Full name must be at least 3 characters long",
      });
    }

    // ---------------- EMAIL VALIDATION ----------------
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // Optional: Block disposable emails (basic check)
    const blockedDomains = ["mailinator.com", "tempmail.com", "10minutemail.com"];
    const emailDomain = email.split("@")[1];

    if (blockedDomains.includes(emailDomain)) {
      return res.status(400).json({
        message: "Disposable email addresses are not allowed",
      });
    }

    // ---------------- PASSWORD VALIDATION ----------------
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      });
    }

    // Extra: prevent weak/common passwords
    if (validator.isStrongPassword(password) === false) {
      return res.status(400).json({
        message: "Password is too weak. Try a stronger combination.",
      });
    }

    // ---------------- CHECK EXISTING USER ----------------
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // ---------------- HASH PASSWORD ----------------
    const passwordHash = await bcrypt.hash(password, 12); // stronger salt

    // ---------------- GENERATE TOKEN ----------------
    const verificationToken = crypto.randomBytes(32).toString("hex");
const verificationTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // ---------------- CREATE USER ----------------
   const user = await User.create({
              fullName,
              email,
              passwordHash,
              role: role || "student",
              verificationToken,
              verificationTokenExpiry,
              isVerified: false,
            });

    // ---------------- AUTO CREATE PROFILE ----------------
    if (user.role === "student") {
     await StudentProfile.create({
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
    });
    }

    // if (user.role === "tutor") {
    //   await TutorProfile.create({
    //   userId: user.id,
    //   fullName: user.fullName,
    //   email: user.email,
    // });
    // }

    // ---------------- ACTIVITY LOG ----------------
    await ActivityLog.create({
      userId: user.id,
      action: "USER_CREATED",
      meta: {
        email: user.email,
        role: user.role,
      },
    });

    // ---------------- SEND VERIFICATION EMAIL ----------------
    const verifyLink = `${FRONTEND_URL}/verify/${verificationToken}`;

    await sendEmail(
      user.email,
      "Verify Your Account",
      verificationTemplate(user.fullName, verifyLink)
    );

    

    // ---------------- REMOVE SENSITIVE DATA ----------------
    const safeUser = user.toJSON();
    delete safeUser.passwordHash;
    delete safeUser.verificationToken;
    delete safeUser.resetToken;
    delete safeUser.resetTokenExpiry;

    return res.status(201).json({
      message:
        "User created successfully. Please check your email to verify your account.",
      user: safeUser,
    });
  } catch (error) {
    console.error("Create User Error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

 

export const verifyAccount = async (req, res) => {
  // ── Prevent ANY caching of this response. ──
  // Verification tokens are one-time-use; this endpoint must always
  // hit the server fresh. Without these headers, a browser can (and
  // did, per the network log showing a 304) serve a stale cached
  // response for the exact same URL on a later visit — meaning the
  // controller never even runs, the frontend just gets whatever the
  // browser cached the first time. Setting these explicitly closes
  // that off regardless of any default caching behavior from Express,
  // a CDN, or the browser itself.
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
 
  try {
    const { token } = req.params;
    const cleanToken = decodeURIComponent(token).trim();
 
    if (!cleanToken) {
      return res.status(400).json({ message: "Verification token is required" });
    }
 
    const userByToken = await User.findOne({
      where: { verificationToken: cleanToken },
    });
 
    if (!userByToken) {
      // No user currently has this token. This used to always mean
      // "invalid/expired" — but it can ALSO mean "a duplicate request
      // for an already-verified account already cleared this token."
      // We can't look the user up by token anymore in that case, so
      // there's nothing more to check here — this really is an
      // unrecognized token.
      return res.status(400).json({
        message: "Invalid or expired verification token",
      });
    }
 
    // ── Already verified? Always return success, regardless of
    //    whether the token has technically expired by now. This is
    //    the line that makes the endpoint idempotent — a duplicate
    //    request (StrictMode double-fire, double-click, multiple
    //    tabs with the same link, etc.) for an account that's
    //    already verified should never show an error. ──
    if (userByToken.isVerified) {
      return res.json({ message: "Account already verified. You can log in." });
    }
 
    // ── Not yet verified — NOW check expiry ──
    if (new Date() > new Date(userByToken.verificationTokenExpiry)) {
      return res.status(400).json({
        message: "Verification link has expired. Please request a new one.",
      });
    }
 
    // ── Mark as verified. Token is intentionally LEFT IN PLACE
    //    (not nulled) so that any duplicate in-flight request for
    //    this same token still resolves via the isVerified branch
    //    above instead of hitting "user not found". ──
    userByToken.isVerified = true;
    await userByToken.save();
 
    await ActivityLog.create({ userId: userByToken.id, action: "USER_VERIFIED" });
 
    await Notification.create({
      title: "New User Signup",
      message: `${userByToken.fullName} just joined`,
      type: "user_registration",
      userId: userByToken.id,
    });
 
    return res.json({ message: "Account verified successfully" });
  } catch (error) {
    console.error("Verify Account Error:", error);
    return res.status(500).json({ message: "Server error" });
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
