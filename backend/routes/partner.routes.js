// routes/partner.routes.js
import express from "express";
import { getPartners } from "../controllers/partner.controller.js";

const router = express.Router();
router.get("/", getPartners);

export default router;