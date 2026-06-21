import express from "express";

import {
  createApplication,
  submitApplication,
  getMyApplications,
  getApplicationById,
  updateApplication,
  saveApplicationProgress,
  //sendPaymentRequest,
  deleteDraftApplication
} from "../controllers/healsApplication.controller.js";

import { authenticate, authorizeRoles }
from "../middleware/auth.js";

import upload
from "../middleware/upload.js";

const router = express.Router();


// ======================================================
// MULTI FILE CONFIG
// ======================================================

const applicationUploads =
  upload.fields([
    {
      name: "passport",
      maxCount: 1,
    },

    {
      name: "transcript",
      maxCount: 1,
    },

    {
      name: "sop",
      maxCount: 1,
    },

    {
      name: "recommendation",
      maxCount: 1,
    },

    {
      name: "bankStatement",
      maxCount: 1,
    },

    {
      name: "otherDoc",
      maxCount: 1,
    },
  ]);


// ======================================================
// CREATE APPLICATION
// ======================================================

router.post(
  "/create",

  authenticate,

  applicationUploads,

  createApplication
);


// ======================================================
// SAVE PROGRESS
// ======================================================

router.post(
  "/:id/save",

  authenticate,

  applicationUploads,

  saveApplicationProgress
);


// ======================================================
// SUBMIT APPLICATION
// ======================================================

router.post(
  "/:id/submit",

  authenticate,

  submitApplication
);


// ======================================================
// GET MY APPLICATIONS
// ======================================================

router.get(
  "/my-applications",

  authenticate,

  getMyApplications
);


// ======================================================
// GET SINGLE APPLICATION
// ======================================================

router.get(
  "/:id",

  authenticate,

  getApplicationById
);


// ======================================================
// UPDATE APPLICATION
// ======================================================

router.put(
  "/:id",

  authenticate,

  applicationUploads,

  updateApplication
);

router.delete(
  "/del-draft/:id",
  authenticate,
  deleteDraftApplication
);

// router.post(
//   "/:id/send-payment-request",
//   authenticate,
//   authorizeRoles(
//     "admin",
//     "agent",
//     "superadmin"
//   ),
//   sendPaymentRequest
// );

export default router;





