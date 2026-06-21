import express from "express";
import {
  createUser,
 getAllUsers,
 getUserById,
 updateUser,
 deleteUser,
 login,
 forgotPassword,
 resetPassword,
 verifyAccount 
} from "../controllers/userRegController.js";

//import adminController from "../controllers/adminRoleController.js"

import { authenticate, authorizeRoles} from "../middleware/auth.js";

const router = express.Router();

// ---------------- PUBLIC ROUTES ----------------
// Register a new user
router.post('/register', createUser);

router.get("/verify/:token", verifyAccount);

// Login
router.post('/login', login);

// Forgot & reset password
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ---------------- PROTECTED ROUTES ----------------
// Get all users (admin only)
router.get('/', authenticate, authorizeRoles("superadmin"), getAllUsers);

// Get a single user by ID
router.get('/:id', authenticate, getUserById);

// Update user
router.put('/:id', authenticate, updateUser);

// Delete user
router.delete('/:id', authenticate, deleteUser);

export default router;
