import express from "express";
import {
  createStudentProfile,
  getStudentProfileById,
  getMyStudentProfile,
  updateStudentProfile,
  deleteStudentProfile,
} from "../controllers/studentProfileController.js";

import {authenticate, authorizeRoles} from "../middleware/auth.js";
import upload from "../middleware/upload.js"; 
// 👆 this should be your multer using Cloudinary storage

const router = express.Router();

router.post(
  "/student-profile/create",

  authenticate,

  authorizeRoles("student"),

  upload.single("profilePic"),

  createStudentProfile
);

router.get("/student-profile/me", authenticate, getMyStudentProfile);

router.get("/student-profile/:id", authenticate, getStudentProfileById);

router.put("/student-profile/update", authenticate, upload.single("profilePic"), updateStudentProfile);

router.delete("/student-profile/delete", authenticate, deleteStudentProfile);

export default router;
