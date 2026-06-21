import express from "express";

import {
  createTutorProfile,
  getMyTutorProfile,
  getTutorProfileById,
  updateTutorProfile,
  deleteTutorProfile,
} from "../controllers/tutorProfileController.js";

import {
  authenticate, authorizeRoles
} from "../middleware/auth.js";



import upload from "../middleware/upload.js";

const router =
  express.Router();



// ======================================================
// CREATE TUTOR PROFILE
// ======================================================

router.post(
  "/create",
  authenticate,
  upload.single("profilePic"),
  createTutorProfile
);



// ======================================================
// GET MY PROFILE
// ======================================================

router.get(
  "/me",
  authenticate,
  getMyTutorProfile
);



// ======================================================
// GET TUTOR PROFILE BY ID
// ======================================================

router.get(
  "/:id",
  authenticate,
  getTutorProfileById
);



// ======================================================
// UPDATE PROFILE
// ======================================================

router.put(
  "/update",
  authenticate,
  upload.single("profilePic"),
  updateTutorProfile
);



// ======================================================
// DELETE PROFILE
// ======================================================

router.delete(
  "/delete",
  authenticate,
  deleteTutorProfile
);





export default router;