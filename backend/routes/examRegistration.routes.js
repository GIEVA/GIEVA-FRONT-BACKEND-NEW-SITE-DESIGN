import express from "express";

import {
createRegistration,
getMyRegistrations,
getRegistrationById,
deleteDraftRegistration,
} from "../controllers/examRegistration.controller.js";

import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/**

* Create Exam Registration
  */
  router.post(
  "/",
  authenticate,
  createRegistration
  );

/**

* Get Logged-in User Registrations
  */
  router.get(
  "/my",
  authenticate,
  getMyRegistrations
  );

/**

* Get Single Registration
  */
  router.get(
  "/:id",
  authenticate,
  getRegistrationById
  );

/**

* Delete Draft / Payment Pending Registration
  */
  router.delete(
  "/:id",
  authenticate,
  deleteDraftRegistration
  );

export default router;
