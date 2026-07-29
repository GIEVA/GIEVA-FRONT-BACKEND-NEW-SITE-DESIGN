import express from "express";

import {
    getStaffList,
    getStaff,
} from "../controllers/staff.controller.js";

const router = express.Router();

router.get("/", getStaffList);
router.get("/:id", getStaff);

export default router;