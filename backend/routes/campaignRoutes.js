import express
from "express";

import {

  createCampaign,
  updateCampaign,
  deleteCampaign,
  getAllCampaigns,
  getCampaignById,
  archiveCampaign,
  publishCampaign,
  incrementCampaignClicks,
  incrementCampaignViews,
  featureCampaign

} from "../controllers/campaign.controller.js";

import {

  authenticate,
  authorizeRoles,

} from "../middleware/auth.js";

import upload
from "../middleware/upload.js";



const router =
  express.Router();



// ======================================================
// PUBLIC ROUTES
// ======================================================

router.get(
  "/",
  getAllCampaigns
);

router.get(
  "/:id",
  getCampaignById
);



// ======================================================
// ADMIN ROUTES
// ======================================================

router.post(

  "/",


  authorizeRoles(
    "admin",
    "superadmin",
    "agent"
  ),

  upload.single(
    "coverImage"
  ),

  createCampaign
);



router.put(

  "/:id",

  

  authorizeRoles(
    "admin",
    "superadmin",
    "agent"
  ),

  upload.single(
    "coverImage"
  ),

  updateCampaign
);



router.delete(

  "/:id",

  authorizeRoles(
    "admin",
    "superadmin"
  ),

  deleteCampaign
);

router.put(
  "/:id/feature",

  authorizeRoles(
    "admin",
    "superadmin"
  ),
  featureCampaign
);



router.put(
  "/:id/publish",

  authorizeRoles(
    "admin",
    "superadmin",
    "agent"
  ),
  publishCampaign
);



router.put(
  "/:id/archive",
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  archiveCampaign
);



router.post(
  "/:id/view",
  incrementCampaignViews
);



router.post(
  "/:id/click",
  incrementCampaignClicks
);

export default router;