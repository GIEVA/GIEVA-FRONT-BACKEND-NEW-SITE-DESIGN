// import express from "express";

// import {
//   schedulePublicMeeting,
//   getPublicMeetings,
//   getPublicMeetingById,
//   joinAsHostPublicMeeting,
//   cancelPublicMeeting,
// } from "../controllers/Publicmeetingcontroller.js

// import { authenticate, authorizeRoles } from "../middleware/auth.js";


// const router = express.Router();

// /*
// |--------------------------------------------------------------------------
// | Public Meetings
// |--------------------------------------------------------------------------
// |
// | Public meetings are NOT course sessions.
// | Any authenticated user can browse them.
// | Only admins can create/manage them.
// |
// */

// // ---------------------------------------------------------------------
// // PUBLIC
// // ---------------------------------------------------------------------

// // List all upcoming/live meetings
// router.get(
//   "/",
//   authenticate,
//   getPublicMeetings
// );

// // Meeting details
// router.get(
//   "/:sessionId",
//   authenticate,
//   getPublicMeetingById
// );

// // ---------------------------------------------------------------------
// // ADMIN
// // ---------------------------------------------------------------------

// // Schedule meeting
// router.post(
//   "/",
//   authenticate,
//   authorizeRoles(
//     "admin",
//     "superadmin",
//     "operational_admin"
//   ),
//   schedulePublicMeeting
// );

// // Join as host
// router.get(
//   "/:sessionId/host",
//   authenticate,
//   authorizeRoles(
//     "admin",
//     "superadmin",
//     "operational_admin"
//   ),
//   joinAsHostPublicMeeting
// );

// // Cancel meeting
// router.patch(
//   "/:sessionId/cancel",
//   authenticate,
//   authorizeRoles(
//     "admin",
//     "superadmin",
//     "operational_admin"
//   ),
//   cancelPublicMeeting
// );

// export default router;