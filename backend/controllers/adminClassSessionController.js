// controllers/adminClassSessionController.js
// Production-grade admin privileges for live session management.
// Covers: schedule, list all, get detail, attendance, tutor hours,
//         platform analytics, share link, force end, cancel, delete,
//         override recording status, export attendance CSV.

import models from "../models/index.js";
import { createLiveKitToken } from "../config/livekit.js";
import { Op, fn, col, literal } from "sequelize";
import { v4 as uuid } from "uuid";
import sendEmail from "../utils/sendMail.js";

const {
  ClassSession,
  Course,
  TutorProfile,
  TutorStudent,
  SessionAttendance,
  SessionEventLog,
  ActivityLog,
  Notification,
  User,
  Enrollment,
} = models;

// ─────────────────────────────────────────────────────────────
// GUARD — shared admin/superadmin check
// ─────────────────────────────────────────────────────────────

const requireAdmin = (req, res) => {
  const allowed = ["admin", "superadmin", "operational_admin"];
  if (!allowed.includes(req.user.role)) {
    res.status(403).json({ message: "Admin access required" });
    return false;
  }
  return true;
};

// ─────────────────────────────────────────────────────────────
// HELPER — format duration
// ─────────────────────────────────────────────────────────────

const toHoursMinutes = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
};

// ──────────────────────────────────────────────────────────────
// 1. ADMIN SCHEDULE SESSION
//    Admin can schedule a session on behalf of any tutor.
// ──────────────────────────────────────────────────────────────

export const adminScheduleSession = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const {
      title,
      description,
      courseId,
      tutorProfileId,
      scheduledAt,
      durationMinutes,
      visibility = "assigned_students",
      notifyStudents = true,
    } = req.body;

    if (!title || !courseId || !tutorProfileId || !scheduledAt || !durationMinutes) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [course, tutorProfile] = await Promise.all([
      Course.findByPk(courseId),
      TutorProfile.findByPk(tutorProfileId, {
        include: [{ model: User, attributes: ["id", "fullName", "email"] }],
      }),
    ]);

    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!tutorProfile) return res.status(404).json({ message: "Tutor profile not found" });

    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const linkExpiry = new Date(end);
    linkExpiry.setHours(linkExpiry.getHours() + 2);

    const roomName = `course-${courseId}-${uuid()}`;
    const joinLink = `${process.env.FRONTEND_URL}/live/${roomName}`;

    const session = await ClassSession.create({
      title,
      description,
      courseId,
      tutorProfileId,
      scheduledBy: req.user.id,
      scheduledAt,
      durationMinutes,
      startTime: start,
      endTime: end,
      roomName,
      joinLink,
      linkExpiresAt: linkExpiry,
      visibility,
      status: "scheduled",
    });

    // ── Pre-create attendance stubs for assigned students ──
    const assignedStudents = await TutorStudent.findAll({
      where: { tutorProfileId, courseId, status: "active" },
      include: [{ model: User, as: "student" }],
    });

    for (const a of assignedStudents) {
      await SessionAttendance.create({
        classSessionId: session.id,
        userId: a.student.id,
        role: "student",
        wasPresent: false,
      });
    }

    // ── Notify tutor ──
    await Notification.create({
      userId: tutorProfile.userId,
      title: "Session Scheduled by Admin",
      message: `Admin scheduled "${title}" for ${course.title} on ${start.toLocaleDateString()}`,
      type: "live_class",
      entityId: session.id,
      entityType: "class_session",
    });

    // ── Optionally notify students ──
    if (notifyStudents) {
      for (const a of assignedStudents) {
        const student = a.student;
        if (!student) continue;

        await Notification.create({
          userId: student.id,
          title: "New Live Class Scheduled",
          message: `${title} has been scheduled for ${course.title}`,
          type: "live_class",
          entityId: session.id,
          entityType: "class_session",
        });

        await sendEmail(
          student.email,
          "Upcoming Live Class Session",
          `<div style="font-family:sans-serif">
            <h2>Upcoming Live Class</h2>
            <p>Hello ${student.fullName},</p>
            <p>A new live session <strong>${title}</strong> has been scheduled for <strong>${course.title}</strong>.</p>
            <p><strong>Date:</strong> ${start.toLocaleString()}</p>
            <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
            <a href="${joinLink}" style="display:inline-block;padding:12px 24px;background:#0B1F3A;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Join Class</a>
            <p>GIEVA Learning Team</p>
          </div>`
        ).catch(console.error);
      }
    }

    await ActivityLog.create({
      userId: req.user.id,
      action: "ADMIN_SCHEDULED_SESSION",
      meta: { sessionId: session.id, courseId, tutorProfileId },
    });

    res.status(201).json({
      message: "Session scheduled successfully",
      session: {
        ...session.toJSON(),
        joinLink,
        tutorName: tutorProfile.fullName,
        courseName: course.title,
        studentsNotified: notifyStudents ? assignedStudents.length : 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to schedule session" });
  }
};

// ──────────────────────────────────────────────────────────────
// 2. GET ALL SESSIONS (paginated, filterable)
// ──────────────────────────────────────────────────────────────

export const adminGetAllSessions = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const {
      page = 1,
      limit = 20,
      status,
      courseId,
      tutorProfileId,
      search,
      from,
      to,
    } = req.query;

    const where = {};
    if (status) where.status = status;
    if (courseId) where.courseId = courseId;
    if (tutorProfileId) where.tutorProfileId = tutorProfileId;
    if (search) where.title = { [Op.iLike]: `%${search}%` };
    if (from || to) {
      where.scheduledAt = {};
      if (from) where.scheduledAt[Op.gte] = new Date(from);
      if (to) where.scheduledAt[Op.lte] = new Date(to);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: sessions } = await ClassSession.findAndCountAll({
      where,
      include: [
        { model: Course, attributes: ["id", "title", "category"] },
        {
          model: TutorProfile,
          attributes: ["id", "fullName", "profilePicUrl"],
        },
      ],
      order: [["scheduledAt", "DESC"]],
      limit: Number(limit),
      offset,
    });

    res.json({
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / limit),
      sessions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch sessions" });
  }
};

// ──────────────────────────────────────────────────────────────
// 3. GET SESSION DETAIL (full breakdown)
// ──────────────────────────────────────────────────────────────

export const adminGetSessionDetail = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const session = await ClassSession.findByPk(req.params.sessionId, {
      include: [
        { model: Course },
        {
          model: TutorProfile,
          include: [{ model: User, attributes: ["id", "fullName", "email"] }],
        },
        {
          model: SessionAttendance,
          include: [{ model: User, attributes: ["id", "fullName", "email"] }],
        },
      ],
    });

    if (!session) return res.status(404).json({ message: "Session not found" });

    const attendance = session.SessionAttendances || [];
    const present = attendance.filter((a) => a.wasPresent);
    const absent = attendance.filter((a) => !a.wasPresent);
    const totalMinutes = attendance.reduce((sum, a) => sum + (a.totalMinutes || 0), 0);

    res.json({
      session,
      summary: {
        totalRegistered: attendance.length,
        totalPresent: present.length,
        totalAbsent: absent.length,
        attendanceRate:
          attendance.length > 0
            ? Math.round((present.length / attendance.length) * 100)
            : 0,
        totalAttendanceMinutes: totalMinutes,
        formattedDuration: toHoursMinutes(totalMinutes),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch session detail" });
  }
};

// ──────────────────────────────────────────────────────────────
// 4. GET SESSION ATTENDANCE (detailed roster)
// ──────────────────────────────────────────────────────────────

export const adminGetSessionAttendance = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const session = await ClassSession.findByPk(req.params.sessionId, {
      attributes: ["id", "title", "scheduledAt", "durationMinutes", "courseId"],
      include: [{ model: Course, attributes: ["id", "title"] }],
    });

    if (!session) return res.status(404).json({ message: "Session not found" });

    const attendance = await SessionAttendance.findAll({
      where: { classSessionId: req.params.sessionId },
      include: [{ model: User, attributes: ["id", "fullName", "email"] }],
      order: [["joinTime", "ASC"]],
    });

    const roster = attendance.map((a) => ({
      userId: a.userId,
      fullName: a.User?.fullName,
      email: a.User?.email,
      role: a.role,
      wasPresent: a.wasPresent,
      joinTime: a.joinTime,
      leaveTime: a.leaveTime,
      totalMinutes: a.totalMinutes || 0,
      formattedTime: toHoursMinutes(a.totalMinutes || 0),
      reconnectCount: a.reconnectCount || 0,
    }));

    const present = roster.filter((r) => r.wasPresent);

    res.json({
      session: {
        id: session.id,
        title: session.title,
        course: session.Course?.title,
        scheduledAt: session.scheduledAt,
        durationMinutes: session.durationMinutes,
      },
      summary: {
        total: roster.length,
        present: present.length,
        absent: roster.length - present.length,
        attendanceRate:
          roster.length > 0
            ? Math.round((present.length / roster.length) * 100)
            : 0,
      },
      roster,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch attendance" });
  }
};

// ──────────────────────────────────────────────────────────────
// 5. EXPORT ATTENDANCE AS CSV
// ──────────────────────────────────────────────────────────────

export const adminExportAttendanceCSV = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const session = await ClassSession.findByPk(req.params.sessionId, {
      include: [{ model: Course, attributes: ["title"] }],
    });

    if (!session) return res.status(404).json({ message: "Session not found" });

    const attendance = await SessionAttendance.findAll({
      where: { classSessionId: req.params.sessionId },
      include: [{ model: User, attributes: ["id", "fullName", "email"] }],
      order: [["joinTime", "ASC"]],
    });

    const headers = [
      "Full Name",
      "Email",
      "Role",
      "Present",
      "Join Time",
      "Leave Time",
      "Minutes Attended",
      "Reconnect Count",
    ];

    const rows = attendance.map((a) => [
      a.User?.fullName || "",
      a.User?.email || "",
      a.role || "student",
      a.wasPresent ? "Yes" : "No",
      a.joinTime ? new Date(a.joinTime).toLocaleString() : "",
      a.leaveTime ? new Date(a.leaveTime).toLocaleString() : "",
      a.totalMinutes || 0,
      a.reconnectCount || 0,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const filename = `attendance-${session.title.replace(/[^a-z0-9]/gi, "_")}-${session.id}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to export attendance" });
  }
};

// ──────────────────────────────────────────────────────────────
// 6. TUTOR LECTURE HOURS (per tutor, with breakdown)
// ──────────────────────────────────────────────────────────────

export const adminGetTutorHours = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const { from, to, tutorProfileId } = req.query;

    const sessionWhere = { status: { [Op.in]: ["ended", "live"] } };
    if (from || to) {
      sessionWhere.scheduledAt = {};
      if (from) sessionWhere.scheduledAt[Op.gte] = new Date(from);
      if (to) sessionWhere.scheduledAt[Op.lte] = new Date(to);
    }
    if (tutorProfileId) sessionWhere.tutorProfileId = tutorProfileId;

    const sessions = await ClassSession.findAll({
      where: sessionWhere,
      include: [
        {
          model: TutorProfile,
          attributes: ["id", "fullName", "profilePicUrl", "totalLectureMinutes"],
          include: [{ model: User, attributes: ["id", "fullName", "email"] }],
        },
        { model: Course, attributes: ["id", "title"] },
      ],
      order: [["scheduledAt", "DESC"]],
    });

    // Group by tutor
    const tutorMap = new Map();

    for (const session of sessions) {
      const tp = session.TutorProfile;
      if (!tp) continue;

      if (!tutorMap.has(tp.id)) {
        tutorMap.set(tp.id, {
          tutorProfileId: tp.id,
          fullName: tp.fullName,
          email: tp.User?.email,
          profilePicUrl: tp.profilePicUrl,
          totalSessions: 0,
          totalMinutes: 0,
          totalHours: 0,
          sessions: [],
        });
      }

      const entry = tutorMap.get(tp.id);
      const minutes = session.durationMinutes || 0;

      entry.totalSessions += 1;
      entry.totalMinutes += minutes;
      entry.sessions.push({
        sessionId: session.id,
        title: session.title,
        course: session.Course?.title,
        scheduledAt: session.scheduledAt,
        durationMinutes: minutes,
        status: session.status,
        totalParticipants: session.totalParticipants,
      });
    }

    const tutors = Array.from(tutorMap.values()).map((t) => ({
      ...t,
      totalHours: +(t.totalMinutes / 60).toFixed(2),
      formattedHours: toHoursMinutes(t.totalMinutes),
    }));

    // Sort by most hours
    tutors.sort((a, b) => b.totalMinutes - a.totalMinutes);

    const grandTotalMinutes = tutors.reduce((sum, t) => sum + t.totalMinutes, 0);

    res.json({
      summary: {
        totalTutors: tutors.length,
        totalSessions: sessions.length,
        grandTotalMinutes,
        grandTotalHours: +(grandTotalMinutes / 60).toFixed(2),
        formattedTotal: toHoursMinutes(grandTotalMinutes),
      },
      tutors,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch tutor hours" });
  }
};

// ──────────────────────────────────────────────────────────────
// 7. PLATFORM SESSION ANALYTICS (dashboard overview)
// ──────────────────────────────────────────────────────────────

export const adminGetSessionAnalytics = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const { from, to } = req.query;

    const dateFilter = {};
    if (from || to) {
      dateFilter.scheduledAt = {};
      if (from) dateFilter.scheduledAt[Op.gte] = new Date(from);
      if (to) dateFilter.scheduledAt[Op.lte] = new Date(to);
    }

    const [
      totalSessions,
      liveSessions,
      scheduledSessions,
      endedSessions,
      cancelledSessions,
      totalAttendance,
    ] = await Promise.all([
      ClassSession.count({ where: dateFilter }),
      ClassSession.count({ where: { ...dateFilter, status: "live" } }),
      ClassSession.count({ where: { ...dateFilter, status: "scheduled" } }),
      ClassSession.count({ where: { ...dateFilter, status: "ended" } }),
      ClassSession.count({ where: { ...dateFilter, status: "cancelled" } }),
      SessionAttendance.count({ where: { wasPresent: true } }),
    ]);

    // Aggregate total lecture minutes across all sessions
    const minutesResult = await ClassSession.findAll({
      where: { ...dateFilter, status: "ended" },
      attributes: [[fn("SUM", col("durationMinutes")), "total"]],
      raw: true,
    });
    const totalLectureMinutes = Number(minutesResult[0]?.total || 0);

    // Most active tutors (by session count)
    const topTutors = await ClassSession.findAll({
      where: { ...dateFilter, status: { [Op.in]: ["ended", "live", "scheduled"] } },
      attributes: ["tutorProfileId", [fn("COUNT", col("ClassSession.id")), "sessionCount"]],
      include: [{ model: TutorProfile, attributes: ["fullName", "profilePicUrl"] }],
      group: ["tutorProfileId", "TutorProfile.id"],
      order: [[literal('"sessionCount"'), "DESC"]],
      limit: 5,
      raw: false,
    });

    // Most active courses
    const topCourses = await ClassSession.findAll({
      where: { ...dateFilter },
      attributes: ["courseId", [fn("COUNT", col("ClassSession.id")), "sessionCount"]],
      include: [{ model: Course, attributes: ["title"] }],
      group: ["courseId", "Course.id"],
      order: [[literal('"sessionCount"'), "DESC"]],
      limit: 5,
      raw: false,
    });

    // Monthly breakdown (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthly = await ClassSession.findAll({
      where: {
        scheduledAt: { [Op.gte]: sixMonthsAgo },
        status: { [Op.in]: ["ended", "live"] },
      },
      attributes: [
        [fn("DATE_TRUNC", "month", col("scheduledAt")), "month"],
        [fn("COUNT", col("id")), "sessions"],
        [fn("SUM", col("durationMinutes")), "minutes"],
      ],
      group: [fn("DATE_TRUNC", "month", col("scheduledAt"))],
      order: [[fn("DATE_TRUNC", "month", col("scheduledAt")), "ASC"]],
      raw: true,
    });

    res.json({
      overview: {
        totalSessions,
        liveSessions,
        scheduledSessions,
        endedSessions,
        cancelledSessions,
        totalAttendance,
        totalLectureMinutes,
        totalLectureHours: +(totalLectureMinutes / 60).toFixed(2),
        formattedLectureTime: toHoursMinutes(totalLectureMinutes),
        completionRate:
          totalSessions > 0
            ? Math.round((endedSessions / totalSessions) * 100)
            : 0,
        cancellationRate:
          totalSessions > 0
            ? Math.round((cancelledSessions / totalSessions) * 100)
            : 0,
      },
      topTutors: topTutors.map((t) => ({
        tutorProfileId: t.tutorProfileId,
        fullName: t.TutorProfile?.fullName,
        profilePicUrl: t.TutorProfile?.profilePicUrl,
        sessionCount: Number(t.getDataValue("sessionCount")),
      })),
      topCourses: topCourses.map((c) => ({
        courseId: c.courseId,
        title: c.Course?.title,
        sessionCount: Number(c.getDataValue("sessionCount")),
      })),
      monthlyBreakdown: monthly.map((m) => ({
        month: m.month,
        sessions: Number(m.sessions),
        minutes: Number(m.minutes || 0),
        hours: +((m.minutes || 0) / 60).toFixed(2),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

// ──────────────────────────────────────────────────────────────
// 8. GET / SHARE SESSION LINK
//    Returns join link + generates a shareable invite token.
// ──────────────────────────────────────────────────────────────

export const adminGetSessionLink = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const session = await ClassSession.findByPk(req.params.sessionId, {
      attributes: [
        "id", "title", "roomName", "joinLink",
        "scheduledAt", "durationMinutes", "status", "linkExpiresAt",
      ],
      include: [
        { model: Course, attributes: ["title"] },
        { model: TutorProfile, attributes: ["fullName"] },
      ],
    });

    if (!session) return res.status(404).json({ message: "Session not found" });

    // Generate an admin-privileged viewer token (no publish rights)
    const adminIdentity = `admin-${req.user.id}`;
    const adminToken = await createLiveKitToken(
      session.roomName,
      adminIdentity,
      "participant",
      {
        fullName: `Admin (${req.user.fullName || "Observer"})`,
        profilePicUrl: "",
      }
    );

    res.json({
      sessionId: session.id,
      title: session.title,
      course: session.Course?.title,
      tutor: session.TutorProfile?.fullName,
      status: session.status,
      scheduledAt: session.scheduledAt,
      durationMinutes: session.durationMinutes,
      linkExpiresAt: session.linkExpiresAt,
      joinLink: session.joinLink,
      shareableLink: `${process.env.FRONTEND_URL}/live/${session.roomName}/${session.id}`,
      adminObserverToken: adminToken,
      serverUrl: process.env.LIVEKIT_URL,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get session link" });
  }
};

// ──────────────────────────────────────────────────────────────
// 9. ADMIN JOIN AS OBSERVER (read-only token, no publish)
// ──────────────────────────────────────────────────────────────

export const adminJoinAsObserver = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const session = await ClassSession.findByPk(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status !== "live") {
      return res.status(400).json({ message: "Session is not currently live" });
    }

    const identity = `admin-${req.user.id}`;

    const token = await createLiveKitToken(
      session.roomName,
      identity,
      "participant",
      {
        fullName: `Observer: ${req.user.fullName || "Admin"}`,
        profilePicUrl: "",
      }
    );

    await ActivityLog.create({
      userId: req.user.id,
      action: "ADMIN_OBSERVED_SESSION",
      meta: { sessionId: session.id },
    });

    res.json({
      token,
      roomName: session.roomName,
      serverUrl: process.env.LIVEKIT_URL,
      currentUser: {
        fullName: `Observer: ${req.user.fullName || "Admin"}`,
        profilePicUrl: "",
        role: "observer",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to join as observer" });
  }
};

// ──────────────────────────────────────────────────────────────
// 10. FORCE END SESSION
// ──────────────────────────────────────────────────────────────

export const adminForceEndSession = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const session = await ClassSession.findByPk(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status === "ended") {
      return res.status(400).json({ message: "Session already ended" });
    }

    session.status = "ended";
    session.isLive = false;
    session.endTime = new Date();
    session.endedReason = `Force-ended by admin (${req.user.email})`;
    await session.save();

    // Notify tutor
    const tutorProfile = await TutorProfile.findByPk(session.tutorProfileId);
    if (tutorProfile) {
      await Notification.create({
        userId: tutorProfile.userId,
        title: "Session Force-Ended by Admin",
        message: `Your session "${session.title}" was ended by an administrator.`,
        type: "live_class",
        entityId: session.id,
        entityType: "class_session",
      });
    }

    await ActivityLog.create({
      userId: req.user.id,
      action: "ADMIN_FORCE_ENDED_SESSION",
      meta: { sessionId: session.id, reason: req.body.reason },
    });

    res.json({ message: "Session force-ended successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to force end session" });
  }
};

// ──────────────────────────────────────────────────────────────
// 11. ADMIN CANCEL SESSION (with reason + notifications)
// ──────────────────────────────────────────────────────────────

export const adminCancelSession = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const { reason = "Cancelled by administration" } = req.body;

    const session = await ClassSession.findByPk(req.params.sessionId, {
      include: [{ model: Course, attributes: ["title"] }],
    });

    if (!session) return res.status(404).json({ message: "Session not found" });

    if (["ended", "cancelled"].includes(session.status)) {
      return res.status(400).json({ message: `Session is already ${session.status}` });
    }

    session.status = "cancelled";
    session.isLive = false;
    session.cancellationReason = reason;
    await session.save();

    // Notify all attendees
    const attendees = await SessionAttendance.findAll({
      where: { classSessionId: session.id },
      include: [{ model: User, attributes: ["id", "fullName", "email"] }],
    });

    const tutor = await TutorProfile.findByPk(session.tutorProfileId);

    const notifyList = [
      ...(tutor ? [{ id: tutor.userId, type: "tutor" }] : []),
      ...attendees.map((a) => ({ id: a.userId, type: "student", email: a.User?.email, name: a.User?.fullName })),
    ];

    for (const person of notifyList) {
      await Notification.create({
        userId: person.id,
        title: "Live Session Cancelled",
        message: `"${session.title}" has been cancelled. Reason: ${reason}`,
        type: "live_class",
        entityId: session.id,
        entityType: "class_session",
      }).catch(() => {});

      if (person.email) {
        await sendEmail(
          person.email,
          "Live Class Session Cancelled",
          `<div style="font-family:sans-serif">
            <h2>Session Cancelled</h2>
            <p>Hello ${person.name || ""},</p>
            <p>The session <strong>${session.title}</strong> for <strong>${session.Course?.title}</strong> has been cancelled.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>GIEVA Learning Team</p>
          </div>`
        ).catch(console.error);
      }
    }

    await ActivityLog.create({
      userId: req.user.id,
      action: "ADMIN_CANCELLED_SESSION",
      meta: { sessionId: session.id, reason },
    });

    res.json({ message: "Session cancelled and notifications sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to cancel session" });
  }
};

// ──────────────────────────────────────────────────────────────
// 12. ADMIN RESCHEDULE SESSION
// ──────────────────────────────────────────────────────────────

export const adminRescheduleSession = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const { scheduledAt, durationMinutes, notifyStudents = true } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({ message: "New scheduledAt is required" });
    }

    const session = await ClassSession.findByPk(req.params.sessionId, {
      include: [{ model: Course, attributes: ["id", "title"] }],
    });

    if (!session) return res.status(404).json({ message: "Session not found" });

    const oldDate = session.scheduledAt;
    const start = new Date(scheduledAt);
    const dur = durationMinutes || session.durationMinutes;
    const end = new Date(start.getTime() + dur * 60000);
    const linkExpiry = new Date(end);
    linkExpiry.setHours(linkExpiry.getHours() + 2);

    session.scheduledAt = start;
    session.durationMinutes = dur;
    session.startTime = start;
    session.endTime = end;
    session.linkExpiresAt = linkExpiry;
    session.status = "scheduled";
    await session.save();

    if (notifyStudents) {
      const attendees = await SessionAttendance.findAll({
        where: { classSessionId: session.id },
        include: [{ model: User, attributes: ["id", "fullName", "email"] }],
      });

      for (const a of attendees) {
        if (!a.User) continue;

        await Notification.create({
          userId: a.userId,
          title: "Session Rescheduled",
          message: `"${session.title}" has been moved to ${start.toLocaleString()}`,
          type: "live_class",
          entityId: session.id,
          entityType: "class_session",
        }).catch(() => {});

        await sendEmail(
          a.User.email,
          "Live Class Rescheduled",
          `<div style="font-family:sans-serif">
            <h2>Session Rescheduled</h2>
            <p>Hello ${a.User.fullName},</p>
            <p><strong>${session.title}</strong> has been rescheduled.</p>
            <p><strong>New Date:</strong> ${start.toLocaleString()}</p>
            <p><strong>Duration:</strong> ${dur} minutes</p>
            <a href="${session.joinLink}" style="display:inline-block;padding:12px 24px;background:#0B1F3A;color:#fff;text-decoration:none;border-radius:8px;">Join Class</a>
            <p>GIEVA Learning Team</p>
          </div>`
        ).catch(console.error);
      }
    }

    await ActivityLog.create({
      userId: req.user.id,
      action: "ADMIN_RESCHEDULED_SESSION",
      meta: {
        sessionId: session.id,
        oldDate,
        newDate: start,
      },
    });

    res.json({ message: "Session rescheduled successfully", session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to reschedule session" });
  }
};

// ──────────────────────────────────────────────────────────────
// 13. ADMIN DELETE SESSION (hard delete — use carefully)
// ──────────────────────────────────────────────────────────────

export const adminDeleteSession = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const session = await ClassSession.findByPk(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status === "live") {
      return res
        .status(400)
        .json({ message: "Cannot delete a live session. Force-end it first." });
    }

    // Clean up attendance records
    await SessionAttendance.destroy({
      where: { classSessionId: session.id },
    });

    await SessionEventLog.destroy({
      where: { classSessionId: session.id },
    }).catch(() => {}); // non-fatal if table doesn't exist

    await session.destroy();

    await ActivityLog.create({
      userId: req.user.id,
      action: "ADMIN_DELETED_SESSION",
      meta: { sessionId: req.params.sessionId },
    });

    res.json({ message: "Session deleted permanently" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete session" });
  }
};

// ──────────────────────────────────────────────────────────────
// 14. OVERRIDE RECORDING STATUS
// ──────────────────────────────────────────────────────────────

export const adminUpdateRecordingStatus = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const { recordingStatus, recordingUrl, recordingDuration } = req.body;

    const validStatuses = ["pending", "processing", "ready", "failed"];
    if (!validStatuses.includes(recordingStatus)) {
      return res.status(400).json({ message: "Invalid recording status" });
    }

    const session = await ClassSession.findByPk(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    session.recordingStatus = recordingStatus;
    if (recordingUrl) session.recordingUrl = recordingUrl;
    if (recordingDuration) session.recordingDuration = recordingDuration;
    await session.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: "ADMIN_UPDATED_RECORDING_STATUS",
      meta: { sessionId: session.id, recordingStatus },
    });

    res.json({ message: "Recording status updated", session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update recording status" });
  }
};

// ──────────────────────────────────────────────────────────────
// 15. ADMIN MANUAL ATTENDANCE OVERRIDE
//     Mark a student as present/absent after session ends.
// ──────────────────────────────────────────────────────────────

export const adminOverrideAttendance = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const { userId, wasPresent, totalMinutes } = req.body;
    const { sessionId } = req.params;

    if (typeof wasPresent !== "boolean") {
      return res.status(400).json({ message: "wasPresent (boolean) is required" });
    }

    let attendance = await SessionAttendance.findOne({
      where: { classSessionId: sessionId, userId },
    });

    if (!attendance) {
      attendance = await SessionAttendance.create({
        classSessionId: sessionId,
        userId,
        role: "student",
        wasPresent,
        totalMinutes: totalMinutes || 0,
      });
    } else {
      attendance.wasPresent = wasPresent;
      if (totalMinutes !== undefined) attendance.totalMinutes = totalMinutes;
      await attendance.save();
    }

    await ActivityLog.create({
      userId: req.user.id,
      action: "ADMIN_OVERRODE_ATTENDANCE",
      meta: { sessionId, targetUserId: userId, wasPresent, totalMinutes },
    });

    res.json({ message: "Attendance record updated", attendance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to override attendance" });
  }
};

// ──────────────────────────────────────────────────────────────
// 16. GET SESSIONS BY COURSE
// ──────────────────────────────────────────────────────────────

export const adminGetSessionsByCourse = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const { courseId } = req.params;
    const { status } = req.query;

    const where = { courseId };
    if (status) where.status = status;

    const sessions = await ClassSession.findAll({
      where,
      include: [
        {
          model: TutorProfile,
          attributes: ["id", "fullName", "profilePicUrl"],
        },
        {
          model: SessionAttendance,
          attributes: ["id", "wasPresent"],
        },
      ],
      order: [["scheduledAt", "DESC"]],
    });

    const summary = {
      total: sessions.length,
      live: sessions.filter((s) => s.status === "live").length,
      scheduled: sessions.filter((s) => s.status === "scheduled").length,
      ended: sessions.filter((s) => s.status === "ended").length,
      cancelled: sessions.filter((s) => s.status === "cancelled").length,
      totalMinutes: sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0),
    };

    res.json({ summary, sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch course sessions" });
  }
};

// ──────────────────────────────────────────────────────────────
// 17. GET LIVE SESSIONS RIGHT NOW
// ──────────────────────────────────────────────────────────────

export const adminGetLiveSessions = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const sessions = await ClassSession.findAll({
      where: { isLive: true, status: "live" },
      include: [
        { model: Course, attributes: ["id", "title"] },
        {
          model: TutorProfile,
          attributes: ["id", "fullName", "profilePicUrl"],
        },
        {
          model: SessionAttendance,
          where: { wasPresent: true },
          required: false,
          attributes: ["id", "userId"],
        },
      ],
      order: [["startTime", "ASC"]],
    });

    res.json({
      liveCount: sessions.length,
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        course: s.Course?.title,
        tutor: s.TutorProfile?.fullName,
        tutorPicUrl: s.TutorProfile?.profilePicUrl,
        startTime: s.startTime,
        durationMinutes: s.durationMinutes,
        roomName: s.roomName,
        joinLink: s.joinLink,
        liveParticipants: s.SessionAttendances?.length || 0,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch live sessions" });
  }
};
