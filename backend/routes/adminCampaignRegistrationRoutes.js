import express
from "express";

import {

  getAllRegistrations,
  getRegistrationById,
  updateRegistration,
  deleteRegistration,
  getRegistrationAnalytics,

} from "../controllers/adminCampaignRegistration.controller.js";

import {

  authenticate,
  authorizeRoles,

} from "../middleware/auth.js";



const router =
  express.Router();



// ======================================================
// ADMIN ACCESS
// ======================================================

router.use(

  

  authorizeRoles(
    "admin",
    "superadmin",
    "agent"
  )
);



// ======================================================
// GET ALL
// ======================================================

router.get(
  "/",
  getAllRegistrations
);



// ======================================================
// GET ONE
// ======================================================

router.get(
  "/:id",
  getRegistrationById
);



// ======================================================
// UPDATE
// ======================================================

router.put(
  "/:id",
  updateRegistration
);



// ======================================================
// DELETE
// ======================================================

router.delete(
  "/:id",
  deleteRegistration
);

router.get(
  "/analytics",
  getRegistrationAnalytics
);

export default router;