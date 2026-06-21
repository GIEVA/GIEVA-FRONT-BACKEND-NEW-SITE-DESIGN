import express
from "express";

import {

  createCampaignMessage,
  getCampaignMessages,
  getCampaignMessageById,
  updateCampaignMessage,
  deleteCampaignMessage,
  sendCampaignMessage,

} from "../controllers/campaignMessageController.js";

import {

  authenticate,
  authorizeRoles,

} from "../middleware/auth.js";



const router =
  express.Router();



// ======================================================
// GET ALL MESSAGES
// ======================================================

router.get(

  "/",

  authenticate,

  authorizeRoles(
    "admin",
    "superadmin",
    "agent"
  ),

  getCampaignMessages
);



// ======================================================
// GET SINGLE MESSAGE
// ======================================================

router.get(

  "/:id",

  authenticate,

  authorizeRoles(
    "admin",
    "superadmin",
    "agent"
  ),

  getCampaignMessageById
);



// ======================================================
// CREATE MESSAGE
// ======================================================

router.post(

  "/",

  authenticate,

  authorizeRoles(
    "admin",
    "superadmin",
    "agent"
  ),

  createCampaignMessage
);



// ======================================================
// UPDATE MESSAGE
// ======================================================

router.put(

  "/:id",

  authenticate,

  authorizeRoles(
    "admin",
    "superadmin",
    "agent"
  ),

  updateCampaignMessage
);



// ======================================================
// DELETE MESSAGE
// ======================================================

router.delete(

  "/:id",

  authenticate,

  authorizeRoles(
    "admin",
    "superadmin"
  ),

  deleteCampaignMessage
);



// ======================================================
// SEND MESSAGE
// ======================================================

router.post(

  "/:id/send",

  authenticate,

  authorizeRoles(
    "admin",
    "superadmin",
    "agent"
  ),

  sendCampaignMessage
);



export default router;