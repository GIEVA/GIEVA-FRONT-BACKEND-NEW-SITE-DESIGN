// routes/healsPublic.routes.js
// Mount (no authentication):  app.use("/api/heals-public", healsPublicRoutes);
import express from "express";
import rateLimit from "express-rate-limit";
import { getPublicHealsInfo } from "../controllers/healsPublic.controller.js";

const router = express.Router();
router.get("/info", rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false }), getPublicHealsInfo);
export default router;
