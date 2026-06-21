// controllers/classSessionController.js
// CHANGES vs previous version:
//   • joinClassSession  — now issues a LOBBY token (canPublish:false)
//                         instead of a full participant token.
//                         Students wait until the host admits them.
//   • admitParticipant  — NEW: host calls this to upgrade a waiting
//                         student to a full participant token.
//   • denyParticipant   — NEW: host can deny / remove a waiting student.
//   • getWaitingRoom    — NEW: returns the list of students currently
//                         waiting to be admitted.
//   • joinAsTutor       — unchanged except for the metadata pass-through.
//   All other functions (schedule, getTutorSessions, getStudentSessions,
//   cancelSession, endSession, etc.) are UNCHANGED — keep them as-is
//   from your existing classSessionController.js.

import models from "../models/index.js";
import { createLiveKitToken } from "../config/livekit.js";
import { Op } from "sequelize";
import { v4 as uuid } from "uuid";
import sendEmail from "../utils/sendMail.js";

const {
  ClassSession,
  Course,
  TutorProfile,
  TutorStudent,
  Enrollment,
  Notification,
  ActivityLog,
  User,
  StudentProfile,
  SessionAttendance,
  SessionWaitingRoom,   // ← new model (see below)
} = models;


// ══════════════════════════════════════════════════════════════════
// JOIN CLASS SESSION  (student → lobby token)
// ══════════════════════════════════════════════════════════════════
//
// Instead of immediately granting a full participant token, we:
//   1. Validate enrollment + tutor assignment as before.
//   2. Issue a LOBBY token (canPublish:false) so the student can
//      connect and see the room but cannot publish audio/video.
//   3. Create a SessionWaitingRoom record so the host can see
//      who is waiting.
//   4. Send an in-app notification to the tutor.
//
// The student's frontend must then listen for a LiveKit data message
// of type "ADMITTED" → at that point call /session/:id/token to swap
// to a full participant token.
//
export const joinClassSession = async (req, res) => {
  try {
    const userId    = req.user.id;
    const sessionId = req.params.sessionId;

    const session = await ClassSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const now = new Date();
    if (now > session.linkExpiresAt)
      return res.status(403).json({ message: "Class link has expired" });

    // ── Enrollment check ─────────────────────────────────────────
    const enrollment = await Enrollment.findOne({
      where: { studentId: userId, courseId: session.courseId, status: "active" },
    });
    if (!enrollment)
      return res.status(403).json({ message: "You are not enrolled in this course" });

    const assignment = await TutorStudent.findOne({
      where: {
        studentId:      userId,
        tutorProfileId: session.tutorProfileId,
        courseId:       session.courseId,
        status:         "active",
      },
    });
    if (!assignment)
      return res.status(403).json({ message: "You are not assigned to this tutor" });

    // ── Fetch real name + avatar ──────────────────────────────────
    const user = await User.findByPk(userId, { attributes: ["id", "fullName"] });
    const studentProfile = await StudentProfile.findOne({
      where: { userId },
      attributes: ["fullName", "profilePicUrl"],
    });

    const fullName      = studentProfile?.fullName || user?.fullName || `User ${userId}`;
    const profilePicUrl = studentProfile?.profilePicUrl || "";

    // ── Issue LOBBY token (no audio/video publishing) ─────────────
    const identity = `user-${userId}`;

    const lobbyToken = await createLiveKitToken(
      session.roomName,
      identity,
      "lobby",             // ← key change: lobby role
      { fullName, profilePicUrl }
    );

    // ── Upsert waiting-room record ────────────────────────────────
    // Uses SessionWaitingRoom model (see model definition at bottom).
    await SessionWaitingRoom.upsert({
      classSessionId: sessionId,
      userId,
      fullName,
      profilePicUrl,
      status:         "waiting",  // waiting | admitted | denied
      requestedAt:    new Date(),
    });

    // ── Notify tutor via in-app notification ──────────────────────
    const tutorProfile = await TutorProfile.findByPk(session.tutorProfileId);
    if (tutorProfile) {
      await Notification.create({
        userId:     tutorProfile.userId,
        title:      "Student Waiting to Join",
        message:    `${fullName} is waiting to join "${session.title}"`,
        type:       "live_class",
        entityId:   session.id,
        entityType: "class_session",
      });
    }

    await ActivityLog.create({
      userId,
      action: "JOIN_SESSION_LOBBY",
      meta:   { sessionId },
    });

    res.json({
      token:       lobbyToken,
      roomName:    session.roomName,
      serverUrl:   process.env.LIVEKIT_URL,
      phase:       "lobby",          // tells the frontend to show waiting-room UI
      currentUser: { fullName, profilePicUrl, role: "lobby" },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Join failed" });
  }
};


// ══════════════════════════════════════════════════════════════════
// GET FULL PARTICIPANT TOKEN  (called after host admits the student)
// POST /api/session/:sessionId/participant-token
//
// The frontend calls this AFTER receiving the ADMITTED data message
// from the host. We validate the waiting-room record has been marked
// admitted, then issue a full participant token.
// ══════════════════════════════════════════════════════════════════

export const getParticipantToken = async (req, res) => {
  try {
    const userId    = req.user.id;
    const sessionId = req.params.sessionId;

    const session = await ClassSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    // Confirm the host admitted this student
    const waitingEntry = await SessionWaitingRoom.findOne({
      where: { classSessionId: sessionId, userId, status: "admitted" },
    });
    if (!waitingEntry)
      return res.status(403).json({ message: "You have not been admitted yet" });

    // ── Fetch real name + avatar ──────────────────────────────────
    const user = await User.findByPk(userId, { attributes: ["id", "fullName"] });
    const studentProfile = await StudentProfile.findOne({
      where: { userId },
      attributes: ["fullName", "profilePicUrl"],
    });

    const fullName      = studentProfile?.fullName || user?.fullName || `User ${userId}`;
    const profilePicUrl = studentProfile?.profilePicUrl || "";

    // ── Issue FULL participant token ──────────────────────────────
    const identity = `user-${userId}`;

    const token = await createLiveKitToken(
      session.roomName,
      identity,
      "participant",
      { fullName, profilePicUrl }
    );

    // ── Create attendance record ──────────────────────────────────
    await SessionAttendance.upsert({
      classSessionId: sessionId,
      userId,
      role:       "student",
      joinTime:   new Date(),
      wasPresent: true,
    });

    await ActivityLog.create({
      userId,
      action: "JOIN_SESSION_ADMITTED",
      meta:   { sessionId },
    });

    res.json({
      token,
      roomName:    session.roomName,
      serverUrl:   process.env.LIVEKIT_URL,
      phase:       "live",
      currentUser: { fullName, profilePicUrl, role: "participant" },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Token upgrade failed" });
  }
};


// ══════════════════════════════════════════════════════════════════
// GET WAITING ROOM LIST  (host / admin only)
// GET /api/session/:sessionId/waiting-room
// ══════════════════════════════════════════════════════════════════

export const getWaitingRoom = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;

    // Only the tutor for this session or an admin may call this
    const session = await ClassSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const isAdmin = ["admin", "superadmin", "operational_admin"].includes(req.user.role);
    if (!isAdmin) {
      const tutorProfile = await TutorProfile.findOne({ where: { userId: req.user.id } });
      if (!tutorProfile || tutorProfile.id !== session.tutorProfileId)
        return res.status(403).json({ message: "Unauthorized" });
    }

    const waiting = await SessionWaitingRoom.findAll({
      where: { classSessionId: sessionId, status: "waiting" },
      order: [["requestedAt", "ASC"]],
    });

    res.json({ waiting });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch waiting room" });
  }
};


// ══════════════════════════════════════════════════════════════════
// ADMIT PARTICIPANT  (host / admin only)
// POST /api/session/:sessionId/admit/:userId
//
// The host calls this from the UI admit button.
// We update the waiting-room record to "admitted" — the LiveKit
// data message is sent from the HOST's frontend (see LiveClassroom.jsx).
// The backend also sends an in-app notification as a fallback.
// ══════════════════════════════════════════════════════════════════

export const admitParticipant = async (req, res) => {
  try {
    const { sessionId, userId } = req.params;

    const session = await ClassSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    // Auth: only the tutor of this session or an admin
    const isAdmin = ["admin", "superadmin", "operational_admin"].includes(req.user.role);
    if (!isAdmin) {
      const tutorProfile = await TutorProfile.findOne({ where: { userId: req.user.id } });
      if (!tutorProfile || tutorProfile.id !== session.tutorProfileId)
        return res.status(403).json({ message: "Unauthorized" });
    }

    const entry = await SessionWaitingRoom.findOne({
      where: { classSessionId: sessionId, userId },
    });
    if (!entry) return res.status(404).json({ message: "User not in waiting room" });

    entry.status     = "admitted";
    entry.admittedAt = new Date();
    await entry.save();

    // In-app notification to the student
    await Notification.create({
      userId:     Number(userId),
      title:      "You've Been Admitted",
      message:    `You have been admitted to "${session.title}"`,
      type:       "live_class",
      entityId:   session.id,
      entityType: "class_session",
    });

    await ActivityLog.create({
      userId:  req.user.id,
      action:  "PARTICIPANT_ADMITTED",
      meta:    { sessionId, admittedUserId: userId },
    });

    res.json({
      message: "Participant admitted",
      userId:  Number(userId),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to admit participant" });
  }
};


// ══════════════════════════════════════════════════════════════════
// DENY / REMOVE PARTICIPANT  (host / admin only)
// POST /api/session/:sessionId/deny/:userId
// ══════════════════════════════════════════════════════════════════

export const denyParticipant = async (req, res) => {
  try {
    const { sessionId, userId } = req.params;
    const { reason = "" }       = req.body;

    const session = await ClassSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const isAdmin = ["admin", "superadmin", "operational_admin"].includes(req.user.role);
    if (!isAdmin) {
      const tutorProfile = await TutorProfile.findOne({ where: { userId: req.user.id } });
      if (!tutorProfile || tutorProfile.id !== session.tutorProfileId)
        return res.status(403).json({ message: "Unauthorized" });
    }

    const entry = await SessionWaitingRoom.findOne({
      where: { classSessionId: sessionId, userId },
    });
    if (!entry) return res.status(404).json({ message: "User not in waiting room" });

    entry.status   = "denied";
    entry.deniedAt = new Date();
    entry.reason   = reason;
    await entry.save();

    await Notification.create({
      userId:     Number(userId),
      title:      "Join Request Declined",
      message:    `Your request to join "${session.title}" was declined.${reason ? ` Reason: ${reason}` : ""}`,
      type:       "live_class",
      entityId:   session.id,
      entityType: "class_session",
    });

    await ActivityLog.create({
      userId:  req.user.id,
      action:  "PARTICIPANT_DENIED",
      meta:    { sessionId, deniedUserId: userId, reason },
    });

    res.json({ message: "Participant denied", userId: Number(userId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to deny participant" });
  }
};


// ══════════════════════════════════════════════════════════════════
// JOIN AS TUTOR  (unchanged logic, kept here for completeness)
// ══════════════════════════════════════════════════════════════════

export const joinAsTutor = async (req, res) => {
  try {
    const tutorProfile = await TutorProfile.findOne({ where: { userId: req.user.id } });
    if (!tutorProfile)
      return res.status(403).json({ message: "Tutor profile not found" });

    const session = await ClassSession.findByPk(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.tutorProfileId !== tutorProfile.id)
      return res.status(403).json({ message: "You are not assigned to this session" });

    const fullName      = tutorProfile.fullName || `Tutor ${req.user.id}`;
    const profilePicUrl = tutorProfile.profilePicUrl || "";
    const identity      = `user-${req.user.id}`;

    const token = await createLiveKitToken(
      session.roomName,
      identity,
      "host",
      { fullName, profilePicUrl }
    );

    session.isLive = true;
    session.status = "live";
    await session.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: "TUTOR_JOINED_SESSION",
      meta:   { sessionId: session.id },
    });

    res.json({
      token,
      roomName:    session.roomName,
      serverUrl:   process.env.LIVEKIT_URL,
      phase:       "live",
      currentUser: { fullName, profilePicUrl, role: "host" },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Join failed" });
  }
};
