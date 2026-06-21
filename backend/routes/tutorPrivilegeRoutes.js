import express from "express";
import {

  getMyStudentProfile,
 
} from "../controllers/studentProfileController.js";

import {authenticate} from "../middleware/auth.js";
import upload from "../middleware/upload.js"; 
// 👆 this should be your multer using Cloudinary storage

const router = express.Router();


router.get("/tutor/my-student-profile", authenticate, getMyStudentProfile);



export default router;
