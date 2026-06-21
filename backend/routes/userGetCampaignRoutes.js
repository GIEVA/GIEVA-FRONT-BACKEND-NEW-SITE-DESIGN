import express
from "express";

import {

  getPublicCampaigns,
  getPublicCampaignDetails,
  incrementCampaignViews,
  incrementCampaignClicks,

} from "../controllers/userGetCampaign.js";



const router =
  express.Router();



// ======================================================
// PUBLIC CAMPAIGNS
// ======================================================

// GET ALL ACTIVE CAMPAIGNS
router.get(
  "/",
  getPublicCampaigns
);



// GET SINGLE CAMPAIGN
router.get(
  "/:id",
  getPublicCampaignDetails
);



// ======================================================
// ANALYTICS
// ======================================================

// INCREMENT VIEWS
router.post(
  "/:id/view",
  incrementCampaignViews
);



// INCREMENT CLICKS
router.post(
  "/:id/click",
  incrementCampaignClicks
);



export default router;