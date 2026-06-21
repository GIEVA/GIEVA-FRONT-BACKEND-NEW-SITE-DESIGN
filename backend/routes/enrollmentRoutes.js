import express from "express";
import {
  enrollStudent,
  getMyEnrollments,
  getAllEnrollments,
  cancelEnrollment,
  activateEnrollment,
  
} from "../controllers/enrollmentController.js";

import {authenticate, authorizeRoles} from "../middleware/auth.js";
import checkEnrollment from "../middleware/checkEnrollment.js";
const router = express.Router();

/* Student */
router.post("/enroll", authenticate, enrollStudent);
router.get("/my", authenticate, getMyEnrollments);
router.patch("/cancel/:id", authenticate, cancelEnrollment);

/* Admin */
router.get("/", authenticate, authorizeRoles("superadmin"), getAllEnrollments);
router.patch("/activate/:id", authenticate, authorizeRoles("superadmin"), activateEnrollment);

//router.get("/course/:courseId/materials", authenticate, checkEnrollment, getMaterials);
//router.get("/course/:courseId/sessions", authenticate, checkEnrollment, getSessions);



export default router;
