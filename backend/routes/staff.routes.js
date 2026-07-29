import express from "express";

import {
    getStaffList,
    getStaff,
} from "../controllers/staff.controller.js";

const router = express.Router();

router.get("/all", getStaffList);
router.get("/all/:id", getStaff);

export default router;