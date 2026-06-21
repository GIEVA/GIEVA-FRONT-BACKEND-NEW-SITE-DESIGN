import express
from "express";

import {

  createUserByAdmin,
  getUsers,
  toggleUserStatus,
  updateUserRole,

} from "../controllers/adminUser.controller.js";

import {

  authenticate,
  authorizeRoles,

} from "../middleware/auth.js";



const router =
  express.Router();



// ======================================================
// ADMIN ACCESS
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



export default router;