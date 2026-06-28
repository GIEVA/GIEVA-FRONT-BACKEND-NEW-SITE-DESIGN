
// controllers/classSessionController.js
//
// ══════════════════════════════════════════════════════════════
// CHANGES IN THIS VERSION (public meeting support)
// ══════════════════════════════════════════════════════════════
//
//  1. FIXED BUG: joinClassSession previously read `session.sessionType`
//     BEFORE checking `if (!session)` — a bad sessionId crashed with a
//     TypeError (500) instead of a clean 404. The null-check now runs
//     first, unconditionally, for every code path.
//
//  2. NEW: resolveHostUserId(session) — a single helper that returns
//     "who is allowed to act as host/admin for this session" for BOTH
//     session types:
//       - course session  → TutorProfile.userId
//       - public meeting  → session.scheduledBy (the admin who created it)
//     getWaitingRoom / admitParticipant / denyParticipant now use this,
//     so admins can finally manage the waiting room of a public meeting
//     (this was completely missing before — public meetings had no
//     working admit/deny path because those endpoints only ever looked
//     up TutorProfile, which is null for public meetings).
//
//  3. NEW: joinAsHost — the public-meeting equivalent of joinAsTutor.
//     Whoever scheduled the public meeting (or any admin/superadmin)
//     can claim the host token for it. Without this, an admin who
//     scheduled a public meeting had no way to ever become its host.
//
//  4. NEW: joinClassSession's public branch now:
//       - checks linkExpiresAt (previously skipped — link never expired)
//       - pushes a JOIN_REQUEST data message to the room (previously
//         silently skipped for public meetings)
//       - notifies the host (the scheduling admin) in-app
//       - upserts the SessionWaitingRoom row with status reset to
//         "waiting" on every fresh knock, matching the course-session path
//
//  5. NEW: listPublicMeetings — discovery endpoint so the frontend can
//     show a "Browse public meetings" page (anyone authenticated can see
//     scheduled/live public meetings; no enrollment required).
//
//  6. NEW: getPublicMeetingByCode / joinLink — lets someone resolve a
//     shared join link (roomName) back to a sessionId so the frontend
//     can support "paste a link to join" the way Zoom/Meet do.
 
import models from "../models/index.js";
import dotenv from "dotenv";
dotenv.config();
 
import { createLiveKitToken } from "../config/livekit.js";
import { RoomServiceClient, DataPacket_Kind } from "livekit-server-sdk";
 
import { Op } from "sequelize";
import { v4 as uuid } from "uuid";
import sendEmail from "../utils/sendMail.js";
 
const {
  ClassSession,
  SessionWaitingRoom,
  Course,
  TutorProfile,
  TutorStudent,
  Enrollment,
  Notification,
  ActivityLog,
  User,
  StudentProfile,
  SessionAttendance,
  SessionEventLog,
} = models;
 
const roomService = new RoomServiceClient(
  process.env.LIVEKIT_URL,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);
 
const ADMIN_ROLES = ["admin", "superadmin", "operational_admin"];
 
// Best-effort realtime push — never throws, never blocks the response
const pushData = async (roomName, payload) => {
  try {
    await roomService.sendData(
      roomName,
      Buffer.from(JSON.stringify(payload)),
      DataPacket_Kind.RELIABLE
    );
  } catch (err) {
    console.warn(`[livekit] sendData failed for room "${roomName}":`, err.message);
  }
};
 
// ──────────────────────────────────────────────────────────────
// Resolve "who can act as host/admin" for a session, regardless
// of whether it's a course session (tutor) or public meeting (admin).
// ──────────────────────────────────────────────────────────────
const resolveHostUserId = async (session) => {
  if (session.sessionType === "public") {
    return session.scheduledBy;
  }
  if (session.tutorProfileId) {
    const tp = await TutorProfile.findByPk(session.tutorProfileId);
    return tp?.userId ?? null;
  }
  return null;
};
 
const isSessionHostOrAdmin = async (session, user) => {
  if (ADMIN_ROLES.includes(user.role)) return true;
  const hostUserId = await resolveHostUserId(session);
  return hostUserId === user.id;
};
 
 
// ======================================================
// SCHEDULE CLASS SESSION  (course-bound, tutor-created)
// ======================================================
 
export const scheduleClassSession = async (req, res) => {
  try {
    const tutorProfile = await TutorProfile.findOne({ where: { userId: req.user.id } });
    if (!tutorProfile) return res.status(403).json({ message: "Only tutors can schedule classes" });
 
    const { title, description, courseId, scheduledAt, durationMinutes, visibility } = req.body;
 
    if (!title || !courseId || !scheduledAt || !durationMinutes)
      return res.status(400).json({ message: "Missing required fields" });
 
    const course = await Course.findByPk(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
 
    const roomName    = `course-${courseId}-${uuid()}`;
    const start        = new Date(scheduledAt);
    const end           = new Date(start.getTime() + durationMinutes * 60000);
    const linkExpiry    = new Date(end);
    linkExpiry.setHours(linkExpiry.getHours() + 2);
 
    const session = await ClassSession.create({
      title, description, courseId,
      tutorProfileId: tutorProfile.id,
      scheduledBy:     req.user.id,
      sessionType:     "course",
      hostType:        "tutor",
      scheduledAt,
      durationMinutes,
      startTime: start,
      endTime:   end,
      roomName,
      joinLink:      `${process.env.FRONTEND_URL}/live/${roomName}`,
      linkExpiresAt: linkExpiry,
      visibility:    visibility || "assigned_students",
      status:        "scheduled",
      enableWaitingRoom: true,
    });
 
    const assignedStudents = await TutorStudent.findAll({
      where: { tutorProfileId: tutorProfile.id, courseId, status: "active" },
      include: [{ model: User, as: "student" }],
    });
 
    for (const assignment of assignedStudents) {
      await SessionAttendance.create({
        classSessionId: session.id,
        userId:         assignment.student.id,
        role:           "student",
        wasPresent:     false,
      });
    }
 
    for (const assignment of assignedStudents) {
      const student = assignment.student;
      if (!student) continue;
 
      await Notification.create({
        userId:     student.id,
        title:      "New Live Class Scheduled",
        message:    `${title} has been scheduled for ${course.title}`,
        type:       "live_class",
        entityId:   session.id,
        entityType: "class_session",
      });
 
      await sendEmail(
        student.email,
        "Upcoming Live Class Session",
        `<div style="font-family:sans-serif">
          <h2>Upcoming Live Class</h2>
          <p>Hello ${student.fullName},</p>
          <p>A new live class session has been scheduled.</p>
          <p><strong>Course:</strong> ${course.title}</p>
          <p><strong>Class:</strong> ${title}</p>
          <p><strong>Date:</strong> ${start.toLocaleString()}</p>
          <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
          <a href="${session.joinLink}"
             style="display:inline-block;padding:12px 20px;background:#6C2BD9;color:white;text-decoration:none;border-radius:8px;">
            Join Class
          </a>
          <p>Please join a few minutes early.</p>
          <p>GIEVA Learning Team</p>
        </div>`
      );
    }
 
    await ActivityLog.create({
      userId: req.user.id,
      action: "CLASS_SESSION_SCHEDULED",
      meta:   { sessionId: session.id, courseId, tutorProfileId: tutorProfile.id },
    });
 
    res.status(201).json({ message: "Class session scheduled successfully", session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not schedule class session" });
  }
};
 
 
// ======================================================
// SCHEDULE PUBLIC MEETING  (admin-created, no course/enrollment)
// ======================================================
 
export const schedulePublicMeeting = async (req, res) => {
  try {
    if (!ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: "Only administrators can schedule public meetings." });
    }
 
    const {
      title,
      description,
      scheduledAt,
      durationMinutes,
      visibility          = "public",
      recordingEnabled     = true,
      enableWaitingRoom    = true,
      allowChat            = true,
      allowScreenShare     = true,
      allowStudentCamera   = true,
      allowStudentMic      = true,
    } = req.body;
 
    if (!title || !scheduledAt || !durationMinutes) {
      return res.status(400).json({ message: "Missing required fields." });
    }
 
    const roomName = `public-${uuid()}`;
    const start     = new Date(scheduledAt);
    const end        = new Date(start.getTime() + durationMinutes * 60000);
    const expiry     = new Date(end);
    expiry.setHours(expiry.getHours() + 2);
 
    const session = await ClassSession.create({
      title,
      description,
      sessionType:    "public",
      hostType:       "admin",
      scheduledBy:    req.user.id,
      courseId:       null,
      tutorProfileId: null,
      scheduledAt,
      durationMinutes,
      startTime: start,
      endTime:    end,
      roomName,
      joinLink: `${process.env.FRONTEND_URL}/public-meet/${roomName}`,
      visibility,
      recordingEnabled,
      enableWaitingRoom,
      allowChat,
      allowScreenShare,
      allowStudentCamera,
      allowStudentMic,
      linkExpiresAt: expiry,
      status: "scheduled",
    });
 
    await ActivityLog.create({
      userId: req.user.id,
      action: "PUBLIC_MEETING_CREATED",
      meta:   { sessionId: session.id },
    });
 
    res.status(201).json({ message: "Public meeting scheduled successfully.", session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not schedule public meeting." });
  }
};
 
 
// ======================================================
// LIST PUBLIC MEETINGS  (discovery — no enrollment required)
// GET /public-meetings?status=scheduled|live|ended
// ======================================================
 
export const listPublicMeetings = async (req, res) => {
  try {
    const { status } = req.query;
 
    const where = { sessionType: "public" };
    if (status) {
      where.status = status;
    } else {
      // By default, hide cancelled/ended noise from discovery
      where.status = { [Op.in]: ["scheduled", "live"] };
    }
 
    const meetings = await ClassSession.findAll({
      where,
      include: [
        { model: User, as: "scheduler", attributes: ["id", "fullName"] },
      ],
      order: [["scheduledAt", "ASC"]],
      attributes: [
        "id", "title", "description", "scheduledAt", "durationMinutes",
        "status", "isLive", "roomName", "joinLink", "linkExpiresAt",
        "scheduledBy", "totalParticipants",
      ],
    });
 
    res.json({ meetings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to list public meetings" });
  }
};
 
 
// ======================================================
// RESOLVE A SHARED JOIN LINK  →  sessionId
// GET /public-meetings/resolve/:roomName
// Lets the frontend support "paste a meeting link" flows.
// ======================================================
 
export const resolvePublicMeetingLink = async (req, res) => {
  try {
    const { roomName } = req.params;
 
    const session = await ClassSession.findOne({
      where: { roomName, sessionType: "public" },
      attributes: ["id", "title", "status", "scheduledAt", "durationMinutes", "linkExpiresAt"],
    });
 
    if (!session) return res.status(404).json({ message: "Meeting link not found" });
 
    res.json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to resolve meeting link" });
  }
};
 
 
// ======================================================
// JOIN CLASS SESSION (STUDENT / PUBLIC ATTENDEE)
// → issues a LOBBY token in both cases
//
// FIX: null-check now happens immediately after the lookup, before
// ANY field on `session` is read.
// ======================================================
 
export const joinClassSession = async (req, res) => {
  try {
    const userId    = req.user.id;
    const sessionId = req.params.sessionId;
    const isAdmin    = ADMIN_ROLES.includes(req.user.role);
 
    const session = await ClassSession.findByPk(sessionId, {
      include: [
        { model: Course,       attributes: ["id", "title"] },
        { model: TutorProfile, attributes: ["id", "fullName", "profilePicUrl", "userId"] },
      ],
    });
 
    // ── FIX: this check must come first, unconditionally ──
    if (!session) return res.status(404).json({ message: "Session not found" });
 
    const now = new Date();
    if (session.linkExpiresAt && now > session.linkExpiresAt)
      return res.status(403).json({ message: "Class link has expired" });
 
    // ════════════════════════════════════════════════════
    // PUBLIC MEETING PATH
    // ════════════════════════════════════════════════════
    if (session.sessionType === "public") {
      const identity      = `user-${userId}`;
      const fullName      = req.user.fullName || `User ${userId}`;
      const profilePicUrl = req.user.profilePicUrl || "";
 
      // The person who scheduled it can also just join directly as host
      // via /tutor/join (joinAsHost) — but if they hit the student-style
      // join route too, hand them the lobby like anyone else; the
      // frontend should route hosts through joinAsHost instead.
 
      const lobbyToken = await createLiveKitToken(
        session.roomName, identity, "lobby", { fullName, profilePicUrl }
      );
 
      await SessionWaitingRoom.upsert({
        classSessionId: session.id,
        userId,
        fullName,
        profilePicUrl,
        status:      "waiting",
        requestedAt: new Date(),
        admittedAt:  null,
        deniedAt:    null,
        reason:      null,
      });
 
      // Realtime push to the host (fast path)
      await pushData(session.roomName, {
        type: "JOIN_REQUEST",
        userId,
        identity,
        fullName,
        profilePicUrl,
      });
 
      // In-app notification to whoever scheduled the meeting
      const hostUserId = await resolveHostUserId(session);
      if (hostUserId) {
        await Notification.create({
          userId:     hostUserId,
          title:      "Someone Wants to Join Your Meeting",
          message:    `${fullName} is waiting to join "${session.title}"`,
          type:       "live_class",
          entityId:   session.id,
          entityType: "class_session",
        });
      }
 
      await ActivityLog.create({
        userId, action: "JOIN_PUBLIC_MEETING_LOBBY", meta: { sessionId: session.id },
      });
 
      return res.json({
        token:       lobbyToken,
        roomName:    session.roomName,
        serverUrl:   process.env.LIVEKIT_URL,
        phase:       "lobby",
        identity,
        currentUser: { fullName, profilePicUrl, role: "lobby" },
      });
    }
 
    // ════════════════════════════════════════════════════
    // ADMIN OBSERVER BYPASS (course sessions only — admins
    // can silently observe any course session without enrolling)
    // ════════════════════════════════════════════════════
    if (isAdmin) {
      const identity    = `admin-${userId}`;
      const displayName = req.user.fullName ? `Observer: ${req.user.fullName}` : "Admin Observer";
 
      const token = await createLiveKitToken(
        session.roomName, identity, "participant", { fullName: displayName, profilePicUrl: "" }
      );
 
      await ActivityLog.create({
        userId,
        action: "ADMIN_JOINED_SESSION_AS_OBSERVER",
        meta:   { sessionId: session.id, roomName: session.roomName },
      }).catch(() => {});
 
      return res.json({
        token,
        roomName:  session.roomName,
        serverUrl: process.env.LIVEKIT_URL,
        phase:     "live",
        identity,
        currentUser: { fullName: displayName, profilePicUrl: "", role: "observer" },
        session: {
          id: session.id, title: session.title,
          course: session.Course?.title, tutor: session.TutorProfile?.fullName,
          durationMinutes: session.durationMinutes, scheduledAt: session.scheduledAt,
        },
      });
    }
 
    // ════════════════════════════════════════════════════
    // COURSE SESSION — STUDENT PATH
    // ════════════════════════════════════════════════════
 
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
 
    const user           = await User.findByPk(userId, { attributes: ["id", "fullName"] });
    const studentProfile = await StudentProfile.findOne({
      where: { userId }, attributes: ["fullName", "profilePicUrl"],
    });
 
    const fullName      = studentProfile?.fullName || user?.fullName || `User ${userId}`;
    const profilePicUrl = studentProfile?.profilePicUrl || "";
    const identity        = `user-${userId}`;
 
    const lobbyToken = await createLiveKitToken(
      session.roomName, identity, "lobby", { fullName, profilePicUrl }
    );
 
    await SessionWaitingRoom.upsert({
      classSessionId: sessionId,
      userId,
      fullName,
      profilePicUrl,
      status:      "waiting",
      requestedAt: new Date(),
      admittedAt:  null,
      deniedAt:    null,
      reason:      null,
    });
 
    await pushData(session.roomName, {
      type: "JOIN_REQUEST", userId, identity, fullName, profilePicUrl,
    });
 
    const tutorProfile = session.TutorProfile;
    if (tutorProfile?.userId) {
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
      userId, action: "JOIN_SESSION_LOBBY", meta: { sessionId },
    });
 
    res.json({
      token:       lobbyToken,
      roomName:    session.roomName,
      serverUrl:   process.env.LIVEKIT_URL,
      phase:       "lobby",
      identity,
      currentUser: { fullName, profilePicUrl, role: "lobby" },
    });
  } catch (err) {
    console.error("joinClassSession error:", err);
    res.status(500).json({ message: "Join failed" });
  }
};
 
 
// ======================================================
// JOIN AS HOST  (public meetings — admin who scheduled it,
// or any admin/superadmin, becomes the room host)
// GET /public-meetings/:sessionId/join-host
// ======================================================
 
export const joinAsHost = async (req, res) => {
  try {
    const session = await ClassSession.findByPk(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
 
    if (session.sessionType !== "public") {
      return res.status(400).json({ message: "This endpoint is for public meetings only" });
    }
 
    const isAllowed = ADMIN_ROLES.includes(req.user.role) || session.scheduledBy === req.user.id;
    if (!isAllowed) {
      return res.status(403).json({ message: "Only the meeting organizer or an admin can host this meeting" });
    }
 
    const fullName      = req.user.fullName || `Host ${req.user.id}`;
    const profilePicUrl = req.user.profilePicUrl || "";
    const identity        = `user-${req.user.id}`;
 
    const token = await createLiveKitToken(
      session.roomName, identity, "host", { fullName, profilePicUrl }
    );
 
    session.isLive = true;
    session.status = "live";
    await session.save();
 
    await ActivityLog.create({
      userId: req.user.id, action: "PUBLIC_MEETING_HOST_JOINED", meta: { sessionId: session.id },
    });
 
    res.json({
      token,
      roomName:    session.roomName,
      serverUrl:   process.env.LIVEKIT_URL,
      phase:       "live",
      identity,
      currentUser: { fullName, profilePicUrl, role: "host" },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Join failed" });
  }
};
 
 
// ======================================================
// CHECK ADMISSION STATUS  (cheap poll, no token minted)
// GET /:sessionId/admission-status
// Works for both course sessions and public meetings since it
// just reads the SessionWaitingRoom row.
// ======================================================
 
export const checkAdmissionStatus = async (req, res) => {
  try {
    const userId    = req.user.id;
    const sessionId = req.params.sessionId;
 
    const entry = await SessionWaitingRoom.findOne({
      where: { classSessionId: sessionId, userId },
    });
 
    if (!entry) return res.json({ status: "unknown" });
 
    res.json({ status: entry.status, reason: entry.reason || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to check admission status" });
  }
};
 
 
// ======================================================
// GET FULL PARTICIPANT TOKEN  (after host admits — works for
// BOTH course sessions and public meetings, unchanged logic)
// ======================================================
 
export const getParticipantToken = async (req, res) => {
  try {
    const userId    = req.user.id;
    const sessionId = req.params.sessionId;
 
    const session = await ClassSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
 
    const waitingEntry = await SessionWaitingRoom.findOne({
      where: { classSessionId: sessionId, userId, status: "admitted" },
    });
    if (!waitingEntry)
      return res.status(403).json({ message: "You have not been admitted yet" });
 
    const user           = await User.findByPk(userId, { attributes: ["id", "fullName"] });
    const studentProfile = await StudentProfile.findOne({
      where: { userId }, attributes: ["fullName", "profilePicUrl"],
    });
 
    const fullName      = waitingEntry.fullName || studentProfile?.fullName || user?.fullName || `User ${userId}`;
    const profilePicUrl = waitingEntry.profilePicUrl || studentProfile?.profilePicUrl || "";
    const identity         = `user-${userId}`;
 
    const token = await createLiveKitToken(
      session.roomName, identity, "participant", { fullName, profilePicUrl }
    );
 
    await SessionAttendance.upsert({
      classSessionId: sessionId, userId, role: "student",
      joinTime: new Date(), wasPresent: true,
    });
 
    await ActivityLog.create({
      userId, action: "JOIN_SESSION_ADMITTED", meta: { sessionId },
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
 
 
// ======================================================
// GET WAITING ROOM  (host / admin) — now works for public meetings
// ======================================================
 
export const getWaitingRoom = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
 
    const sessionId = req.params.sessionId;
    const session   = await ClassSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
 
    const allowed = await isSessionHostOrAdmin(session, req.user);
    if (!allowed) return res.status(403).json({ message: "Unauthorized" });
 
    const waiting = await SessionWaitingRoom.findAll({
      where: { classSessionId: sessionId, status: "waiting" },
      order: [["requestedAt", "ASC"]],
    });
 
    res.json({ waiting });
  } catch (err) {
    console.error("getWaitingRoom error:", err);
    res.status(500).json({ message: "Failed to fetch waiting room" });
  }
};
 
 
// ======================================================
// ADMIT PARTICIPANT  — now works for public meetings
// ======================================================
 
export const admitParticipant = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
 
    const { sessionId, userId } = req.params;
 
    const session = await ClassSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
 
    const allowed = await isSessionHostOrAdmin(session, req.user);
    if (!allowed) return res.status(403).json({ message: "Unauthorized" });
 
    const entry = await SessionWaitingRoom.findOne({
      where: { classSessionId: sessionId, userId },
    });
    if (!entry) return res.status(404).json({ message: "User not in waiting room" });
 
    entry.status     = "admitted";
    entry.admittedAt = new Date();
    await entry.save();
 
    await pushData(session.roomName, {
      type:     "ADMITTED",
      userId:   Number(userId),
      identity: `user-${userId}`,
    });
 
    await Notification.create({
      userId:     Number(userId),
      title:      "You've Been Admitted",
      message:    `You have been admitted to "${session.title}"`,
      type:       "live_class",
      entityId:   session.id,
      entityType: "class_session",
    });
 
    await ActivityLog.create({
      userId: req.user.id, action: "PARTICIPANT_ADMITTED", meta: { sessionId, admittedUserId: userId },
    });
 
    res.json({ message: "Participant admitted", userId: Number(userId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to admit participant" });
  }
};
 
 
// ======================================================
// DENY PARTICIPANT  — now works for public meetings
// ======================================================
 
export const denyParticipant = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
 
    const { sessionId, userId } = req.params;
    const { reason = "" }       = req.body;
 
    const session = await ClassSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
 
    const allowed = await isSessionHostOrAdmin(session, req.user);
    if (!allowed) return res.status(403).json({ message: "Unauthorized" });
 
    const entry = await SessionWaitingRoom.findOne({
      where: { classSessionId: sessionId, userId },
    });
    if (!entry) return res.status(404).json({ message: "User not in waiting room" });
 
    entry.status   = "denied";
    entry.deniedAt = new Date();
    entry.reason   = reason;
    await entry.save();
 
    await pushData(session.roomName, {
      type: "DENIED", userId: Number(userId), identity: `user-${userId}`, reason,
    });
 
    await Notification.create({
      userId:     Number(userId),
      title:      "Join Request Declined",
      message:    `Your request to join "${session.title}" was declined.${reason ? ` Reason: ${reason}` : ""}`,
      type:       "live_class",
      entityId:   session.id,
      entityType: "class_session",
    });
 
    await ActivityLog.create({
      userId: req.user.id, action: "PARTICIPANT_DENIED", meta: { sessionId, deniedUserId: userId, reason },
    });
 
    res.json({ message: "Participant denied", userId: Number(userId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to deny participant" });
  }
};
 
 
// ======================================================
// JOIN AS TUTOR  (course sessions — unchanged)
// ======================================================
 
export const joinAsTutor = async (req, res) => {
  try {
    const tutorProfile = await TutorProfile.findOne({ where: { userId: req.user.id } });
    if (!tutorProfile) return res.status(403).json({ message: "Tutor profile not found" });
 
    const session = await ClassSession.findByPk(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
 
    if (session.tutorProfileId !== tutorProfile.id)
      return res.status(403).json({ message: "You are not assigned to this session" });
 
    const fullName      = tutorProfile.fullName || `Tutor ${req.user.id}`;
    const profilePicUrl = tutorProfile.profilePicUrl || "";
    const identity        = `user-${req.user.id}`;
 
    const token = await createLiveKitToken(
      session.roomName, identity, "host", { fullName, profilePicUrl }
    );
 
    session.isLive = true;
    session.status = "live";
    await session.save();
 
    await ActivityLog.create({
      userId: req.user.id, action: "TUTOR_JOINED_SESSION", meta: { sessionId: session.id },
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
// // controllers/classSessionController.js

// import models from "../models/index.js";
// import dotenv from "dotenv";
// dotenv.config();


 
// import { createLiveKitToken } from "../config/livekit.js";
// import { RoomServiceClient, DataPacket_Kind } from "livekit-server-sdk";
 
// import { Op } from "sequelize";
// import { v4 as uuid } from "uuid";
// import sendEmail from "../utils/sendMail.js";
 
// const {
//   ClassSession,
//   SessionWaitingRoom,
//   Course,
//   TutorProfile,
//   TutorStudent,
//   Enrollment,
//   Notification,
//   ActivityLog,
//   User,
//   SessionAttendance,
//   StudentProfile,
//   SessionEventLog,
// } = models;
 
// // Server-side LiveKit client for best-effort realtime push
// const roomService = new RoomServiceClient(
//   process.env.LIVEKIT_URL,
//   process.env.LIVEKIT_API_KEY,
//   process.env.LIVEKIT_API_SECRET
// );
 
// // Helper: never let a DataChannel push failure break the HTTP response
// const pushData = async (roomName, payload) => {
//   try {
//     await roomService.sendData(
//       roomName,
//       Buffer.from(JSON.stringify(payload)),
//       DataPacket_Kind.RELIABLE
//     );
//   } catch (err) {
//     console.warn(`[livekit] sendData push failed for room "${roomName}":`, err.message);
//   }
// };
 
// const ADMIN_ROLES = ["admin", "superadmin", "operational_admin"];
 
 
// // ======================================================
// // SCHEDULE CLASS SESSION  (unchanged)
// // ======================================================
 
// export const scheduleClassSession = async (req, res) => {
//   try {
//     const tutorProfile = await TutorProfile.findOne({ where: { userId: req.user.id } });
//     if (!tutorProfile) return res.status(403).json({ message: "Only tutors can schedule classes" });
 
//     const { title, description, courseId, scheduledAt, durationMinutes, visibility } = req.body;
 
//     if (!title || !courseId || !scheduledAt || !durationMinutes)
//       return res.status(400).json({ message: "Missing required fields" });
 
//     const course = await Course.findByPk(courseId);
//     if (!course) return res.status(404).json({ message: "Course not found" });
 
//     const roomName   = `course-${courseId}-${uuid()}`;
//     const start       = new Date(scheduledAt);
//     const end          = new Date(start.getTime() + durationMinutes * 60000);
//     const linkExpiry   = new Date(end);
//     linkExpiry.setHours(linkExpiry.getHours() + 2);
 
//     const session = await ClassSession.create({
//       title, description, courseId,
//       tutorProfileId: tutorProfile.id,
//       scheduledBy:     req.user.id,
//       scheduledAt,
//       durationMinutes,
//       startTime: start,
//       endTime:   end,
//       roomName,
//       joinLink:      `${process.env.FRONTEND_URL}/live/${roomName}`,
//       linkExpiresAt: linkExpiry,
//       visibility:    visibility || "assigned_students",
//       status:        "scheduled",
//       enableWaitingRoom: true,
//     });
 
//     const assignedStudents = await TutorStudent.findAll({
//       where: { tutorProfileId: tutorProfile.id, courseId, status: "active" },
//       include: [{ model: User, as: "student" }],
//     });
 
//     for (const assignment of assignedStudents) {
//       await SessionAttendance.create({
//         classSessionId: session.id,
//         userId:         assignment.student.id,
//         role:           "student",
//         wasPresent:     false,
//       });
//     }
 
//     for (const assignment of assignedStudents) {
//       const student = assignment.student;
//       if (!student) continue;
 
//       await Notification.create({
//         userId:     student.id,
//         title:      "New Live Class Scheduled",
//         message:    `${title} has been scheduled for ${course.title}`,
//         type:       "live_class",
//         entityId:   session.id,
//         entityType: "class_session",
//       });
 
//       await sendEmail(
//         student.email,
//         "Upcoming Live Class Session",
//         `<div style="font-family:sans-serif">
//           <h2>Upcoming Live Class</h2>
//           <p>Hello ${student.fullName},</p>
//           <p>A new live class session has been scheduled.</p>
//           <p><strong>Course:</strong> ${course.title}</p>
//           <p><strong>Class:</strong> ${title}</p>
//           <p><strong>Date:</strong> ${start.toLocaleString()}</p>
//           <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
//           <a href="${session.joinLink}"
//              style="display:inline-block;padding:12px 20px;background:#6C2BD9;color:white;text-decoration:none;border-radius:8px;">
//             Join Class
//           </a>
//           <p>Please join a few minutes early.</p>
//           <p>GIEVA Learning Team</p>
//         </div>`
//       );
//     }
 
//     await ActivityLog.create({
//       userId: req.user.id,
//       action: "CLASS_SESSION_SCHEDULED",
//       meta:   { sessionId: session.id, courseId, tutorProfileId: tutorProfile.id },
//     });
 
//     res.status(201).json({ message: "Class session scheduled successfully", session });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Could not schedule class session" });
//   }
// };




 
// // ──────────────────────────────────────────────────────────────
// // JOIN CLASS SESSION  →  issues a LOBBY token
// // ──────────────────────────────────────────────────────────────
 
// // ──────────────────────────────────────────────────────────────
// // JOIN CLASS SESSION  ← FIXED
// //
// // Bug was: ClassSession.findOne({ where: { roomName, id: sessionId } })
// //          `roomName` was never defined in this scope → ReferenceError.
// //
// // Fix: use findByPk(sessionId) — we only need the session ID here.
// //      The admin bypass now works cleanly: admins skip all enrollment
// //      checks and join as read-only observers.
// // ──────────────────────────────────────────────────────────────


// // ======================================================
// // JOIN CLASS SESSION (STUDENT)  →  issues a LOBBY token
// // ======================================================
 
// export const joinClassSession = async (req, res) => {
//   try {
//     const userId    = req.user.id;
//     const sessionId = req.params.sessionId;
 
//     const session = await ClassSession.findByPk(sessionId);
//     if (!session) return res.status(404).json({ message: "Session not found" });

//       //  const ADMIN_ROLES = ["admin", "superadmin", "operational_admin"];
//     const isAdmin     = ADMIN_ROLES.includes(req.user.role);

//     // // ── 1. Find session by PK (no roomName needed here) ──────
//     // const session = await ClassSession.findByPk(sessionId, {
//     //   include: [
//     //     { model: Course,       attributes: ["id", "title"] },
//     //     { model: TutorProfile, attributes: ["id", "fullName", "profilePicUrl"] },
//     //   ],
//     // });

    

//     if (!session) return res.status(404).json({ message: "Session not found" });

//     // ── 2. ADMIN BYPASS ────────────────────────────────────────
//     // Admins are allowed to observe any session without being
//     // enrolled or assigned as a student.
//     if (isAdmin) {
//       const identity    = `admin-${userId}`;
//       const displayName = req.user.fullName
//         ? `Observer: ${req.user.fullName}`
//         : `Admin Observer`;

//       const token = await createLiveKitToken(
//         session.roomName,
//         identity,
//         "participant",   // canPublish: false via lobby role keeps them read-only
//         { fullName: displayName, profilePicUrl: "" }
//       );

//       await ActivityLog.create({
//         userId,
//         action: "ADMIN_JOINED_SESSION_AS_OBSERVER",
//         meta:   { sessionId: session.id, roomName: session.roomName },
//       }).catch(() => {});

//       return res.json({
//         token,
//         roomName:  session.roomName,
//         serverUrl: process.env.LIVEKIT_URL,
//         phase:     "live",          // admins skip the lobby/waiting screen
//         identity,
//         currentUser: {
//           fullName:      displayName,
//           profilePicUrl: "",
//           role:          "observer",
//         },
//         session: {
//           id:              session.id,
//           title:           session.title,
//           course:          session.Course?.title,
//           tutor:           session.TutorProfile?.fullName,
//           durationMinutes: session.durationMinutes,
//           scheduledAt:     session.scheduledAt,
//         },
//       });
//     }



 
//     const now = new Date();
//     if (now > session.linkExpiresAt)
//       return res.status(403).json({ message: "Class link has expired" });
 
//     const enrollment = await Enrollment.findOne({
//       where: { studentId: userId, courseId: session.courseId, status: "active" },
//     });
//     if (!enrollment)
//       return res.status(403).json({ message: "You are not enrolled in this course" });
 
//     const assignment = await TutorStudent.findOne({
//       where: {
//         studentId:      userId,
//         tutorProfileId: session.tutorProfileId,
//         courseId:       session.courseId,
//         status:         "active",
//       },
//     });
//     if (!assignment)
//       return res.status(403).json({ message: "You are not assigned to this tutor" });
 
//     const user            = await User.findByPk(userId, { attributes: ["id", "fullName"] });
//     const studentProfile  = await StudentProfile.findOne({
//       where: { userId }, attributes: ["fullName", "profilePicUrl"],
//     });
 
//     const fullName      = studentProfile?.fullName || user?.fullName || `User ${userId}`;
//     const profilePicUrl = studentProfile?.profilePicUrl || "";
//     const identity       = `user-${userId}`;
 
//     // ── Was this student already admitted in a PRIOR knock this session? ──
//     // (e.g. they refreshed the page after being admitted) — skip the lobby
//     // entirely and hand them a live participant token straight away.
//     const existing = await SessionWaitingRoom.findOne({
//       where: { classSessionId: sessionId, userId },
//     });
 
//     if (existing?.status === "admitted") {
//       const token = await createLiveKitToken(
//         session.roomName, identity, "participant", { fullName, profilePicUrl }
//       );
 
//       await SessionAttendance.upsert({
//         classSessionId: sessionId, userId, role: "student",
//         joinTime: new Date(), wasPresent: true,
//       });
 
//       return res.json({
//         token,
//         roomName:    session.roomName,
//         serverUrl:   process.env.LIVEKIT_URL,
//         phase:       "live",
//         currentUser: { fullName, profilePicUrl, role: "participant" },
//       });
//     }
 
//     // ── Otherwise: fresh knock — reset/create waiting-room row ──
//     await SessionWaitingRoom.upsert({
//       classSessionId: sessionId,
//       userId,
//       fullName,
//       profilePicUrl,
//       status:      "waiting",
//       requestedAt: new Date(),
//       admittedAt:  null,
//       deniedAt:    null,
//       reason:      null,
//     });
 
//     const lobbyToken = await createLiveKitToken(
//       session.roomName, identity, "lobby", { fullName, profilePicUrl }
//     );
 
//     // Best-effort instant push to host (fast path; poll is the fallback)
//     await pushData(session.roomName, {
//       type: "JOIN_REQUEST",
//       userId,
//       identity,
//       fullName,
//       profilePicUrl,
//     });
 
//     const tutorProfile = await TutorProfile.findByPk(session.tutorProfileId);
//     if (tutorProfile) {
//       await Notification.create({
//         userId:     tutorProfile.userId,
//         title:      "Student Waiting to Join",
//         message:    `${fullName} is waiting to join "${session.title}"`,
//         type:       "live_class",
//         entityId:   session.id,
//         entityType: "class_session",
//       });
//     }
 
//     await ActivityLog.create({
//       userId, action: "JOIN_SESSION_LOBBY", meta: { sessionId },
//     });
 
//     res.json({
//       token:       lobbyToken,
//       roomName:    session.roomName,
//       serverUrl:   process.env.LIVEKIT_URL,
//       phase:       "lobby",
//       currentUser: { fullName, profilePicUrl, role: "lobby" },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Join failed" });
//   }
// };

 
 
// export const checkAdmissionStatus = async (req, res) => {
//   try {
//     const userId    = req.user.id;
//     const sessionId = req.params.sessionId;
 
//     const entry = await SessionWaitingRoom.findOne({
//       where: { classSessionId: sessionId, userId },
//     });
 
//     if (!entry) return res.json({ status: "unknown" });
 
//     res.json({
//       status:  entry.status,            // waiting | admitted | denied
//       reason:  entry.reason || null,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to check admission status" });
//   }
// };
 
 
// // ======================================================
// // GET FULL PARTICIPANT TOKEN  (called once status === "admitted")
// // POST /:sessionId/participant-token
// // ======================================================
 
// export const getParticipantToken = async (req, res) => {
//   try {
//     const userId    = req.user.id;
//     const sessionId = req.params.sessionId;
 
//     const session = await ClassSession.findByPk(sessionId);
//     if (!session) return res.status(404).json({ message: "Session not found" });
 
//     const waitingEntry = await SessionWaitingRoom.findOne({
//       where: { classSessionId: sessionId, userId, status: "admitted" },
//     });
//     if (!waitingEntry)
//       return res.status(403).json({ message: "You have not been admitted yet" });
 
//     const user           = await User.findByPk(userId, { attributes: ["id", "fullName"] });
//     const studentProfile = await StudentProfile.findOne({
//       where: { userId }, attributes: ["fullName", "profilePicUrl"],
//     });
 
//     const fullName      = studentProfile?.fullName || user?.fullName || `User ${userId}`;
//     const profilePicUrl = studentProfile?.profilePicUrl || "";
//     const identity       = `user-${userId}`;
 
//     const token = await createLiveKitToken(
//       session.roomName, identity, "participant", { fullName, profilePicUrl }
//     );
 
//     await SessionAttendance.upsert({
//       classSessionId: sessionId, userId, role: "student",
//       joinTime: new Date(), wasPresent: true,
//     });
 
//     await ActivityLog.create({
//       userId, action: "JOIN_SESSION_ADMITTED", meta: { sessionId },
//     });
 
//     res.json({
//       token,
//       roomName:    session.roomName,
//       serverUrl:   process.env.LIVEKIT_URL,
//       phase:       "live",
//       currentUser: { fullName, profilePicUrl, role: "participant" },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Token upgrade failed" });
//   }
// };
 
 
// // ======================================================
// // GET WAITING ROOM  (host / admin)
// // ======================================================
 
// export const getWaitingRoom = async (req, res) => {
//   try {
//     if (!req.user) return res.status(401).json({ message: "Unauthorized" });
 
//     const sessionId = req.params.sessionId;
//     const session   = await ClassSession.findByPk(sessionId);
//     if (!session) return res.status(404).json({ message: "Session not found" });
 
//     const isAdmin = ADMIN_ROLES.includes(req.user.role);
 
//     if (!isAdmin) {
//       const tutorProfile = await TutorProfile.findOne({ where: { userId: req.user.id } });
//       if (!tutorProfile || tutorProfile.id !== session.tutorProfileId)
//         return res.status(403).json({ message: "Unauthorized" });
//     }
 
//     const waiting = await SessionWaitingRoom.findAll({
//       where: { classSessionId: sessionId, status: "waiting" },
//       order: [["requestedAt", "ASC"]],
//     });
 
//     res.json({ waiting });
//   } catch (err) {
//     console.error("getWaitingRoom error:", err);
//     res.status(500).json({ message: "Failed to fetch waiting room" });
//   }
// };
 
 
// // ======================================================
// // ADMIT PARTICIPANT  (host / admin)
// // ======================================================
 
// export const admitParticipant = async (req, res) => {
//   try {
//     if (!req.user) return res.status(401).json({ message: "Unauthorized" });
 
//     const { sessionId, userId } = req.params;
 
//     const session = await ClassSession.findByPk(sessionId);
//     if (!session) return res.status(404).json({ message: "Session not found" });
 
//     const isAdmin = ADMIN_ROLES.includes(req.user.role);
//     if (!isAdmin) {
//       const tutorProfile = await TutorProfile.findOne({ where: { userId: req.user.id } });
//       if (!tutorProfile || tutorProfile.id !== session.tutorProfileId)
//         return res.status(403).json({ message: "Unauthorized" });
//     }
 
//     const entry = await SessionWaitingRoom.findOne({
//       where: { classSessionId: sessionId, userId },
//     });
//     if (!entry) return res.status(404).json({ message: "User not in waiting room" });
 
//     // ── This is the line that actually matters ──
//     // Flip the DB record. The student's poll (every ~2.5s) will pick this
//     // up even if the realtime push below fails for any reason.
//     entry.status     = "admitted";
//     entry.admittedAt = new Date();
//     await entry.save();
 
//     // Best-effort instant push (fast path only — never blocks the response)
//     await pushData(session.roomName, {
//       type:     "ADMITTED",
//       userId:   Number(userId),
//       identity: `user-${userId}`,
//     });
 
//     await Notification.create({
//       userId:     Number(userId),
//       title:      "You've Been Admitted",
//       message:    `You have been admitted to "${session.title}"`,
//       type:       "live_class",
//       entityId:   session.id,
//       entityType: "class_session",
//     });
 
//     await ActivityLog.create({
//       userId: req.user.id,
//       action: "PARTICIPANT_ADMITTED",
//       meta:   { sessionId, admittedUserId: userId },
//     });
 
//     res.json({ message: "Participant admitted", userId: Number(userId) });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to admit participant" });
//   }
// };
 
 
// // ======================================================
// // DENY PARTICIPANT  (host / admin)
// // ======================================================
 
// export const denyParticipant = async (req, res) => {
//   try {
//     if (!req.user) return res.status(401).json({ message: "Unauthorized" });
 
//     const { sessionId, userId } = req.params;
//     const { reason = "" }       = req.body;
 
//     const session = await ClassSession.findByPk(sessionId);
//     if (!session) return res.status(404).json({ message: "Session not found" });
 
//     const isAdmin = ADMIN_ROLES.includes(req.user.role);
//     if (!isAdmin) {
//       const tutorProfile = await TutorProfile.findOne({ where: { userId: req.user.id } });
//       if (!tutorProfile || tutorProfile.id !== session.tutorProfileId)
//         return res.status(403).json({ message: "Unauthorized" });
//     }
 
//     const entry = await SessionWaitingRoom.findOne({
//       where: { classSessionId: sessionId, userId },
//     });
//     if (!entry) return res.status(404).json({ message: "User not in waiting room" });
 
//     entry.status   = "denied";
//     entry.deniedAt = new Date();
//     entry.reason   = reason;
//     await entry.save();
 
//     await pushData(session.roomName, {
//       type:     "DENIED",
//       userId:   Number(userId),
//       identity: `user-${userId}`,
//       reason,
//     });
 
//     await Notification.create({
//       userId:     Number(userId),
//       title:      "Join Request Declined",
//       message:    `Your request to join "${session.title}" was declined.${reason ? ` Reason: ${reason}` : ""}`,
//       type:       "live_class",
//       entityId:   session.id,
//       entityType: "class_session",
//     });
 
//     await ActivityLog.create({
//       userId: req.user.id,
//       action: "PARTICIPANT_DENIED",
//       meta:   { sessionId, deniedUserId: userId, reason },
//     });
 
//     res.json({ message: "Participant denied", userId: Number(userId) });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to deny participant" });
//   }
// };
 
 
// // ======================================================
// // JOIN AS TUTOR  (host — unchanged)
// // ======================================================
 
// export const joinAsTutor = async (req, res) => {
//   try {
//     const tutorProfile = await TutorProfile.findOne({ where: { userId: req.user.id } });
//     if (!tutorProfile) return res.status(403).json({ message: "Tutor profile not found" });
 
//     const session = await ClassSession.findByPk(req.params.sessionId);
//     if (!session) return res.status(404).json({ message: "Session not found" });
 
//     if (session.tutorProfileId !== tutorProfile.id)
//       return res.status(403).json({ message: "You are not assigned to this session" });
 
//     const fullName      = tutorProfile.fullName || `Tutor ${req.user.id}`;
//     const profilePicUrl = tutorProfile.profilePicUrl || "";
//     const identity        = `user-${req.user.id}`;
 
//     const token = await createLiveKitToken(
//       session.roomName, identity, "host", { fullName, profilePicUrl }
//     );
 
//     session.isLive = true;
//     session.status = "live";
//     await session.save();
 
//     await ActivityLog.create({
//       userId: req.user.id, action: "TUTOR_JOINED_SESSION", meta: { sessionId: session.id },
//     });
 
//     res.json({
//       token,
//       roomName:    session.roomName,
//       serverUrl:   process.env.LIVEKIT_URL,
//       phase:       "live",
//       currentUser: { fullName, profilePicUrl, role: "host" },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Join failed" });
//   }
// };

  // ======================================================
// GET TUTOR SESSIONS
// ======================================================

export const getTutorSessions =
  async (req, res) => {

    try {

      const tutorProfile =
        await TutorProfile.findOne({

          where: {
            userId: req.user.id,
          },
        });

      if (!tutorProfile) {

        return res.status(403).json({
          message:
            "Tutor profile not found",
        });
      }

      const sessions =
        await ClassSession.findAll({

          where: {
            tutorProfileId:
              tutorProfile.id,
          },

          include: [
            {
              model: Course,
              attributes: [
                "id",
                "title",
              ],
            },
          ],

          order: [
            ["scheduledAt", "DESC"],
          ],
        });

      res.json({
        sessions,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch tutor sessions",
      });
    }
  };

  // ======================================================
// GET STUDENT SESSIONS
// ======================================================

export const getStudentSessions =
  async (req, res) => {

    try {

      const userId =
        req.user.id;

      // ==================================================
      // ACTIVE ENROLLMENTS
      // ==================================================

      const enrollments =
        await Enrollment.findAll({

          where: {
            studentId:
              userId,

            status:
              "active",
          },
        });

      const courseIds =
        enrollments.map(
          (e) => e.courseId
        );

      if (!courseIds.length) {

        return res.json({
          sessions: [],
        });
      }

      // ==================================================
      // SESSIONS
      // ==================================================

      const sessions =
        await ClassSession.findAll({

          where: {

            courseId: {
              [Op.in]:
                courseIds,
            },

            status: {
              [Op.ne]:
                "cancelled",
            },
          },

          include: [

            {
              model: Course,
              attributes: [
                "id",
                "title",
              ],
            },

            {
              model: TutorProfile,
              include: [
                {
                  model: User,
                  attributes: [
                    "id",
                    "fullName",
                    "email",
                  ],
                },
              ],
            },
          ],

          order: [
            ["scheduledAt", "ASC"],
          ],
        });

      res.json({
        sessions,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch sessions",
      });
    }
  };

  // ======================================================
// GET SESSION BY ID
// ======================================================

export const getSessionById =
  async (req, res) => {

    try {

      const session =
        await ClassSession.findByPk(

          req.params.sessionId,

          {

            include: [

              {
                model: Course,
              },

              {
                model: TutorProfile,
                include: [
                  {
                    model: User,
                    attributes: [
                      "id",
                      "fullName",
                      "email",
                    ],
                  },
                ],
              },

              {
                model:
                  SessionAttendance,

                include: [
                  {
                    model: User,
                    attributes: [
                      "id",
                      "fullName",
                      "email",
                    ],
                  },
                ],
              },
            ],
          }
        );

      if (!session) {

        return res.status(404).json({
          message:
            "Session not found",
        });
      }

      res.json(session);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch session",
      });
    }
  };

  // ======================================================
// CANCEL SESSION
// ======================================================

export const cancelSession =
  async (req, res) => {

    try {

      const session =
        await ClassSession.findByPk(
          req.params.sessionId
        );

      if (!session) {

        return res.status(404).json({
          message:
            "Session not found",
        });
      }

      // ==================================================
      // VERIFY TUTOR
      // ==================================================

      const tutorProfile =
        await TutorProfile.findOne({

          where: {
            userId:
              req.user.id,
          },
        });

      const isAdmin =
        [
          "admin",
          "superadmin",
        ].includes(
          req.user.role
        );

      if (
        !isAdmin &&
        session.tutorProfileId !==
        tutorProfile?.id
      ) {

        return res.status(403).json({
          message:
            "Unauthorized",
        });
      }

      session.status =
        "cancelled";

      session.isLive =
        false;

      session.cancellationReason =
        req.body.reason || null;

      await session.save();

      // ==================================================
      // LOG
      // ==================================================

      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "SESSION_CANCELLED",

        meta: {
          sessionId:
            session.id,
        },
      });

      res.json({
        message:
          "Session cancelled successfully",
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to cancel session",
      });
    }
  };

  // ======================================================
// END SESSION
// ======================================================

export const endSession =
  async (req, res) => {

    try {

      const session =
        await ClassSession.findByPk(
          req.params.sessionId
        );

      if (!session) {

        return res.status(404).json({
          message:
            "Session not found",
        });
      }

      const tutorProfile =
        await TutorProfile.findOne({

          where: {
            userId:
              req.user.id,
          },
        });

      if (
        session.tutorProfileId !==
        tutorProfile?.id
      ) {

        return res.status(403).json({
          message:
            "Unauthorized",
        });
      }

      session.status =
        "ended";

      session.isLive =
        false;

      session.endTime =
        new Date();

      session.endedReason =
        "Tutor manually ended session";

      await session.save();

      // ==================================================
      // LOG
      // ==================================================

      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "SESSION_MANUALLY_ENDED",

        meta: {
          sessionId:
            session.id,
        },
      });

      res.json({
        message:
          "Session ended successfully",
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to end session",
      });
    }
  };

  // ======================================================
// GET SESSION ATTENDANCE
// ======================================================

export const getSessionAttendance =
  async (req, res) => {

    try {

      const attendance =
        await SessionAttendance.findAll({

          where: {
            classSessionId:
              req.params.sessionId,
          },

          include: [
            {
              model: User,
              attributes: [
                "id",
                "fullName",
                "email",
              ],
            },
          ],

          order: [
            ["createdAt", "ASC"],
          ],
        });

      res.json({
        attendance,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch attendance",
      });
    }
  };

  // ======================================================
// GET SESSION RECORDING
// ======================================================

export const getSessionRecording =
  async (req, res) => {

    try {

      const session =
        await ClassSession.findByPk(
          req.params.sessionId
        );

      if (!session) {

        return res.status(404).json({
          message:
            "Session not found",
        });
      }

      if (
        !session.recordingUrl
      ) {

        return res.status(404).json({
          message:
            "Recording not available",
        });
      }

      res.json({

        recordingUrl:
          session.recordingUrl,

        duration:
          session.recordingDuration,

        status:
          session.recordingStatus,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch recording",
      });
    }
  };

  export const markAttendance =
  async (req, res) => {
    try {

      const session =
        await ClassSession.findByPk(
          req.params.id
        );

      if (!session) {
        return res.status(404).json({
          message:
            "Session not found",
        });
      }

      const existing =
        await SessionAttendance.findOne({
          where: {
            classSessionId:
              session.id,
            userId:
              req.user.id,
          },
        });

      if (existing) {
        return res.json({
          message:
            "Attendance already recorded",
        });
      }

      await SessionAttendance.create({
        classSessionId:
          session.id,
        userId:
          req.user.id,
        joinedAt:
          new Date(),
      });

      session.totalParticipants += 1;

      await session.save();

      await ActivityLog.create({
        userId:
          req.user.id,
        action:
          "SESSION_ATTENDANCE",
        meta: {
          sessionId:
            session.id,
        },
      });

      res.json({
        message:
          "Attendance recorded",
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Attendance failed",
      });
    }
  };

  export const leaveSession =
  async (req, res) => {

    try {

      const attendance =
        await SessionAttendance.findOne({
          where: {
            classSessionId:
              req.params.id,
            userId:
              req.user.id,
          },
        });

      if (!attendance) {
        return res.status(404).json({
          message:
            "Attendance not found",
        });
      }

      attendance.leftAt =
        new Date();

      const minutes =
        Math.round(
          (
            attendance.leftAt -
            attendance.joinedAt
          ) /
          1000 /
          60
        );

      attendance.minutesAttended =
        minutes;

      await attendance.save();

      res.json({
        message:
          "Leave recorded",
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Leave failed",
      });
    }
  };

  export const getSessionParticipants =
  async (req, res) => {

    try {

      const participants =
        await SessionAttendance.findAll({
          where: {
            classSessionId:
              req.params.id,
          },

          include: [
            {
              model: User,
              attributes: [
                "id",
                "fullName",
                "email",
              ],
            },
          ],

          order: [
            ["joinedAt", "DESC"],
          ],
        });

      res.json({
        participants,
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Failed to fetch participants",
      });
    }
  };

// ======================================================
// SEND REACTION  (audit log only — realtime UI already
// happened via the LiveKit data channel before this call)
// ======================================================
 
// ======================================================
// SEND REACTION
// ======================================================
 
export const sendReaction = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { emoji } = req.body;
 
    if (!emoji) {
      return res.status(400).json({ message: "Missing emoji" });
    }
 
    if (!SessionEventLog || typeof SessionEventLog.create !== "function") {
      console.error(
        "[sendReaction] SessionEventLog model is not available. " +
        "Check models/index.js — it may not be registered/associated."
      );
      return res.json({ message: "Reaction sent (not logged)" });
    }
 
    const session = await ClassSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
 
    try {
      await SessionEventLog.create({
        classSessionId: Number(sessionId),
        userId:         req.user.id,
        eventType:      "reaction",        // ← was "REACTION"
        metadata:       { emoji },         // ← also: your model's column is `metadata`, not `meta` (see note below)
      });
    } catch (logErr) {
      console.error("[sendReaction] Failed to write SessionEventLog:", {
        message:  logErr.message,
        sql:      logErr.sql,
        original: logErr.original,
      });
      return res.json({ message: "Reaction sent (logging failed)" });
    }
 
    res.json({ message: "Reaction sent" });
  } catch (error) {
    console.error("[sendReaction] Unexpected error:", error);
    res.status(500).json({ message: "Failed to send reaction" });
  }
};
 
 
// ======================================================
// RAISE HAND
// ======================================================
 
export const raiseHand = async (req, res) => {
  try {
    const sessionId = req.params.id;
 
    if (!SessionEventLog || typeof SessionEventLog.create !== "function") {
      console.error(
        "[raiseHand] SessionEventLog model is not available. " +
        "Check models/index.js — it may not be registered/associated."
      );
      return res.json({ message: "Hand raised (not logged)" });
    }
 
    const session = await ClassSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
 
    try {
      await SessionEventLog.create({
        classSessionId: Number(sessionId),
        userId:         req.user.id,
        eventType:      "raise_hand",              // ← matches original enum casing
        metadata:       { raisedAt: new Date() },  // ← `metadata`, not `meta`
      });
    } catch (logErr) {
      console.error("[raiseHand] Failed to write SessionEventLog:", {
        message:  logErr.message,
        sql:      logErr.sql,
        original: logErr.original,
      });
      return res.json({ message: "Hand raised (logging failed)" });
    }
 
    res.json({ message: "Hand raised" });
  } catch (error) {
    console.error("[raiseHand] Unexpected error:", error);
    res.status(500).json({ message: "Failed to raise hand" });
  }
};
 

  export const startRecording =
  async (req, res) => {

    try {

      const session =
        await ClassSession.findByPk(
          req.params.id
        );

      if (!session) {
        return res.status(404).json({
          message:
            "Session not found",
        });
      }

      session.recordingStatus =
        "processing";

      await session.save();

      await ActivityLog.create({
        userId:
          req.user.id,

        action:
          "SESSION_RECORDING_STARTED",

        meta: {
          sessionId:
            session.id,
        },
      });

      res.json({
        message:
          "Recording started",
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Failed to start recording",
      });
    }
  };

  export const stopRecording =
  async (req, res) => {

    try {

      const session =
        await ClassSession.findByPk(
          req.params.id
        );

      if (!session) {
        return res.status(404).json({
          message:
            "Session not found",
        });
      }

      session.recordingStatus =
        "ready";

      session.recordingDuration =
        Math.round(
          (
            new Date() -
            session.startTime
          ) /
          1000 /
          60
        );

      await session.save();

      await ActivityLog.create({
        userId:
          req.user.id,

        action:
          "SESSION_RECORDING_STOPPED",

        meta: {
          sessionId:
            session.id,
        },
      });

      res.json({
        message:
          "Recording stopped",
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Failed to stop recording",
      });
    }
  };