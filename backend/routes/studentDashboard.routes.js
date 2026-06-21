// routes/studentDashboard.routes.js

import express from "express";
import { getStudentDashboard } from "../controllers/studentDashboard.controller.js";
import { authenticate, authorizeRoles} from "../middleware/auth.js";

const router = express.Router();

router.get("/student/dashboard", authenticate, getStudentDashboard);

export default router;