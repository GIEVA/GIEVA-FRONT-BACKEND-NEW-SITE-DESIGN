// services/sessionAccess.js
// Shared permission helpers for polls and recordings.

import models from "../models/index.js";

const { ClassSession, TutorProfile, SessionAttendance } = models;

export const ADMIN_ROLES = ["admin", "superadmin", "operational_admin"];

export const loadSession = (sessionId) =>
  ClassSession.findByPk(sessionId, { include: [{ model: TutorProfile }] });

// "Host" = whoever can run the meeting: platform admins, the person who scheduled it,
// or the tutor it belongs to.
export const canManageSession = (user, session) =>
  ADMIN_ROLES.includes(user.role) ||
  session.scheduledBy === user.id ||
  session.TutorProfile?.userId === user.id;

// Attendance rows are created by the LiveKit webhook on join (or pre-created for assigned students).
export const isAttendee = async (userId, sessionId) =>
  !!(await SessionAttendance.findOne({ where: { classSessionId: sessionId, userId } }));
