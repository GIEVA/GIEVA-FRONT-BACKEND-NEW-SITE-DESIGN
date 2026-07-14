// routes/contactRoutes.js

import express from "express";
import {
  submitContactForm,

} from "../controllers/contactController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────────────
// No auth required — anyone (guest or logged-in) can submit
router.post("/", submitContactForm);


export default router;


