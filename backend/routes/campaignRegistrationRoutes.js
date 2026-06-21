import express
from "express";

import {

  createRegistration,
  getMyRegistrations,

} from "../controllers/campaign.registration.controller.js";

import {
  authenticate,
} from "../middleware/auth.js";



const router =
  express.Router();



// ======================================================
// CREATE REGISTRATION
// ======================================================

router.post(
  "/",
  createRegistration
);



// ======================================================
// MY REGISTRATIONS
// ======================================================

router.get(

  "/my",

  authenticate,

  getMyRegistrations
);



export default router;