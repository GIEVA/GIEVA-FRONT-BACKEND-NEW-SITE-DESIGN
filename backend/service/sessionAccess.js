// services/sessionAccess.js
// Shared permission helpers for polls and recordings.

import models from "../models/index.js";

const { ClassSession, TutorProfile, SessionAttendance, SessionRole } = models;

export const ADMIN_ROLES = ["admin", "superadmin", "operational_admin"];

// SessionRole is only included once the webinar models are registered, so older setups keep working.
export const loadSession = (sessionId) =>
  ClassSession.findByPk(sessionId, {
    include: [{ model: TutorProfile }, ...(SessionRole ? [{ model: SessionRole }] : [])],
  });

const teamRole = (user, session) => (session.SessionRoles || []).find((r) => r.userId === user.id)?.role || null;

// Who the person is in this session:
//   "host" | "alt_host" | "cohost" | "panelist" | "attendee"
// Platform admins, the scheduler and the session's tutor count as host.
export const sessionRoleOf = (user, session) => {
  if (!user) return "attendee";
  if (
    ADMIN_ROLES.includes(user.role) ||
    session.scheduledBy === user.id ||
    session.TutorProfile?.userId === user.id
  ) return "host";
  return teamRole(user, session) || "attendee";
};

// Shared controls: mute, recording, polls, participants, Q&A. Host, alt host, co-host.
export const canManageSession = (user, session) => ["host", "alt_host", "cohost"].includes(sessionRoleOf(user, session));

// Host-only controls: promote/demote, live-stream, webinar settings. Host and alt host.
export const canHostSession = (user, session) => ["host", "alt_host"].includes(sessionRoleOf(user, session));

// Attendance rows are created by the LiveKit webhook on join (or pre-created for assigned students).
export const isAttendee = async (userId, sessionId) =>
  !!(await SessionAttendance.findOne({ where: { classSessionId: sessionId, userId } }));
