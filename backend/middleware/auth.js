import jwt from "jsonwebtoken";
import models from "../models/index.js";

const { User } = models;

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ------------------ Authenticate User ------------------
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Session expired, please login again" });
      }
      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token, please login again" });
      }
      return res.status(401).json({ message: "Token verification failed" });
    }

    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Fetch user — exclude sensitive fields
    const user = await User.findByPk(decoded.id, {
      attributes: {
        exclude: ["passwordHash", "verificationToken", "verificationTokenExpiry", "resetToken", "resetTokenExpiry"],
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Account not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account has been disabled. Contact support." });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email before continuing" });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ message: "Server error during authentication" });
  }
};

// ------------------ Role-Based Authorization ------------------
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }

    next();
  };
};