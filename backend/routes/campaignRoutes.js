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

  authenticate,

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

  authenticate,

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

  authenticate,

  authorizeRoles(
    "admin",
    "superadmin"
  ),

  deleteCampaign
);

router.put(
  "/:id/feature",
  authenticate,
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  featureCampaign
);



router.put(
  "/:id/publish",
  authenticate,
  authorizeRoles(
    "admin",
    "superadmin",
    "agent"
  ),
  publishCampaign
);



router.put(
  "/:id/archive",
  authenticate,
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