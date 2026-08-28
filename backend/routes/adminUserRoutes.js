import express
from "express";

import {

  createUserByAdmin,
  getUsers,
  toggleUserStatus,
  updateUserRole,
  verifyUserByAdmin,
  deleteUserByAdmin,

} from "../controllers/adminUser.controller.js";

import {

  authenticate,
  authorizeRoles,

} from "../middleware/auth.js";



const router =
  express.Router();



// ======================================================
// ADMIN ACCESS (admin + superadmin)
// ======================================================

router.use(

  authenticate,

  authorizeRoles(
    "admin",
    "superadmin"
  )
);



// ======================================================
// CREATE USER
// ======================================================

router.post(
  "/users",
  createUserByAdmin
);



// ======================================================
// GET USERS
// ======================================================

router.get(
  "/users",
  getUsers
);



// ======================================================
// TOGGLE STATUS
// ======================================================

router.put(
  "/users/:id/status",
  toggleUserStatus
);



// ======================================================
// UPDATE ROLE
// ======================================================

router.put(
  "/users/:id/role",
  updateUserRole
);



// ======================================================
// VERIFY USER
// ======================================================

router.put(
  "/users/:id/verify",
  verifyUserByAdmin
);



// ======================================================
// DELETE USER — SUPERADMIN ONLY
// ======================================================

router.delete(
  "/users/:id",
  authorizeRoles("superadmin"), // stacks on top of the router-level admin+superadmin check
  deleteUserByAdmin
);



export default router;