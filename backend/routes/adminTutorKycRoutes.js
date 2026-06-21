import express from "express";

import {
  getAllTutorProfiles,
  getTutorProfileById,
  updateTutorProfileAdmin,
  deleteTutorProfileAdmin,
  approveTutorProfile,
  rejectTutorProfile,
} from "../controllers/adminTutorKycController.js";

import {
  authenticate, authorizeRoles
} from "../middleware/auth.js";



import upload from "../middleware/upload.js";

const router =
  express.Router();



// ======================================================
// GET ALL TUTORS
// ======================================================

router.get(
  "/tutors",
  authenticate,
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  getAllTutorProfiles
);



// ======================================================
// GET TUTOR BY ID
// ======================================================

router.get(
  "/tutors/:id",
  authenticate,
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  getTutorProfileById
);



// ======================================================
// UPDATE TUTOR PROFILE
// ======================================================

router.put(
  "/tutors/:id",
  authenticate,
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  upload.single("profilePic"),
  updateTutorProfileAdmin
);



// ======================================================
// DELETE TUTOR PROFILE
// ======================================================

router.delete(
  "/tutors/:id",
  authenticate,
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  deleteTutorProfileAdmin
);



// ======================================================
// APPROVE TUTOR
// ======================================================

router.put(
  "/tutors/:id/approve",
  authenticate,
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  approveTutorProfile
);



// ======================================================
// REJECT TUTOR
// ======================================================

router.put(
  "/tutors/:id/reject",
  authenticate,
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  rejectTutorProfile
);



export default router;