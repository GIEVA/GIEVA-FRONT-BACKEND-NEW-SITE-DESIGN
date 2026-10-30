
import crypto from "crypto";
import { Op } from "sequelize";
import { AccessToken } from "livekit-server-sdk";
import models from "../models/index.js";
import {
  loadSession,
  canHostSession,
  ADMIN_ROLES,
  canManageSession
} from "../service/sessionAccess.js";
import { webinarGrantFor } from "../service/webinarPermissions.js";

const { ClassSession, WebinarRegistration } = models;

const hashKey = (key) =>
  crypto.createHash("sha256").update(key).digest("hex");

const escapeCsv = (value) => {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
};

const isWebinar = (s) => !!s?.isWebinar;


const canManageGuests = async (user, session) => {
  if (!user || !session) return false;
  if (ADMIN_ROLES.includes(user.role)) return true;
  return canManageSession(user, session);   // host, alt host and co-host
};

// PUBLIC: Register without a GIEVA account.
export const registerWebinarGuest = async (req, res) => {
  try {
    const session = await ClassSession.findByPk(req.params.id);

    if (!isWebinar(session)) {
      return res.status(404).json({ message: "Webinar not found" });
    }

    if (["ended", "cancelled"].includes(session.status)) {
      return res.status(410).json({ message: "This webinar is no longer accepting guests" });
    }

    const fullName = String(req.body.fullName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const age = Number(req.body.age);
    const consent = req.body.consent === true;

    if (fullName.length < 2 || fullName.length > 150) {
      return res.status(400).json({ message: "Enter your full name" });
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    if (!Number.isInteger(age) || age < 1 || age > 120) {
      return res.status(400).json({ message: "Enter a valid age" });
    }

    if (!consent) {
      return res.status(400).json({ message: "Please accept the privacy notice" });
    }

    const duplicate = await WebinarRegistration.findOne({
      where: { classSessionId: session.id, email },
    });

    if (duplicate) {
      return res.status(409).json({
        message: "This email has already registered for the webinar. Use your existing waiting-room link or contact the host.",
      });
    }

    const accessKey = crypto.randomBytes(32).toString("hex");

    const registration = await WebinarRegistration.create({
      classSessionId: session.id,
      fullName,
      email,
      age,
      accessKeyHash: hashKey(accessKey),
      status: "waiting",
      consentAt: new Date(),
    });

    return res.status(201).json({
      message: "Registration received. Please wait for the host.",
      registrationId: registration.id,
      accessKey,
      status: registration.status,
    });
  } catch (err) {
    console.error("[webinar guest] register", err);
    return res.status(500).json({ message: "Could not register for this webinar" });
  }
};

// PUBLIC: Check waiting-room status using the private access key.
// Issues a guest token ONLY after a host has admitted the registration.
export const getWebinarGuestStatus = async (req, res) => {
  try {
    const session = await ClassSession.findByPk(req.params.id);

    if (!isWebinar(session)) {
      return res.status(404).json({ message: "Webinar not found" });
    }

    const accessKey = String(req.body.accessKey || "");
    if (!/^[a-f0-9]{64}$/i.test(accessKey)) {
      return res.status(401).json({ message: "Invalid guest access key" });
    }

    const guest = await WebinarRegistration.findOne({
      where: {
        classSessionId: session.id,
        accessKeyHash: hashKey(accessKey),
      },
    });

    if (!guest) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (["ended", "cancelled"].includes(session.status)) {
      return res.status(410).json({ status: session.status, message: "This webinar has ended" });
    }

    if (guest.status === "rejected") {
      return res.json({ status: "rejected", message: "The host did not approve your request." });
    }

    if (guest.status !== "admitted") {
      return res.json({ status: guest.status });
    }

    const identity = `guest-${guest.id}`;
    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity,
        name: guest.fullName,
        ttl: "2h",
        metadata: JSON.stringify({
          role: "student",
          webinarRole: "attendee",
          fullName: guest.fullName,
          guest: true,
          registrationId: guest.id,
        }),
      }
    );

    token.addGrant({
      room: session.roomName,
      roomJoin: true,
      ...webinarGrantFor("attendee"),
    });

    guest.joinedAt = guest.joinedAt || new Date();
    await guest.save();

    return res.json({
      status: "admitted",
      token: await token.toJwt(),
      serverUrl: process.env.LIVEKIT_URL,
      webinar: {
        id: session.id,
        title: session.title,
        roomName: session.roomName,
      },
      guest: {
        id: guest.id,
        fullName: guest.fullName,
      },
    });
  } catch (err) {
    console.error("[webinar guest] status", err);
    return res.status(500).json({ message: "Could not check waiting-room status" });
  }
};

// PROTECTED: Host/admin views the waiting room.
export const listWebinarGuests = async (req, res) => {
  try {
    const session = await ClassSession.findByPk(req.params.id);

    if (!isWebinar(session)) {
      return res.status(404).json({ message: "Webinar not found" });
    }

    if (!(await canManageGuests(req.user, session))) {
      return res.status(403).json({ message: "You cannot manage this webinar" });
    }

    const guests = await WebinarRegistration.findAll({
      where: { classSessionId: session.id },
      attributes: [
        "id", "fullName", "email", "age", "status",
        "createdAt", "admittedAt", "joinedAt", "leftAt",
      ],
      order: [["createdAt", "ASC"]],
    });

    res.json({ guests });
  } catch (err) {
    console.error("[webinar guest] list", err);
    res.status(500).json({ message: "Could not load guests" });
  }
};

// PROTECTED: Host/admin admits or rejects a guest.
export const moderateWebinarGuest = async (req, res) => {
  try {
    const session = await ClassSession.findByPk(req.params.id);

    if (!isWebinar(session)) {
      return res.status(404).json({ message: "Webinar not found" });
    }

    if (!(await canManageGuests(req.user, session))) {
      return res.status(403).json({ message: "You cannot manage this webinar" });
    }

    const action = req.body.action;
    if (!["admit", "reject"].includes(action)) {
      return res.status(400).json({ message: "Action must be admit or reject" });
    }

    const guest = await WebinarRegistration.findOne({
      where: {
        id: req.params.guestId,
        classSessionId: session.id,
      },
    });

    if (!guest) {
      return res.status(404).json({ message: "Guest not found" });
    }

    if (guest.status === "left") {
      return res.status(409).json({ message: "This guest has already left" });
    }

    if (action === "admit") {
      if (["ended", "cancelled"].includes(session.status)) {
        return res.status(410).json({ message: "This webinar has ended" });
      }

      guest.status = "admitted";
      guest.admittedBy = req.user.id;
      guest.admittedAt = new Date();
    } else {
      guest.status = "rejected";
    }

    await guest.save();

    res.json({
      message: action === "admit" ? "Guest admitted" : "Guest rejected",
      guest: {
        id: guest.id,
        fullName: guest.fullName,
        status: guest.status,
      },
    });
  } catch (err) {
    console.error("[webinar guest] moderate", err);
    res.status(500).json({ message: "Could not update guest status" });
  }
};

// PROTECTED: Download registrations as a CSV file.
export const exportWebinarGuestsCsv = async (req, res) => {
  try {
    const session = await ClassSession.findByPk(req.params.id);

    if (!isWebinar(session)) {
      return res.status(404).json({ message: "Webinar not found" });
    }

    if (!(await canManageGuests(req.user, session))) {
      return res.status(403).json({ message: "You cannot export this webinar" });
    }

    const guests = await WebinarRegistration.findAll({
      where: { classSessionId: session.id },
      order: [["createdAt", "ASC"]],
    });

    const columns = [
      "Registration ID",
      "Full Name",
      "Email",
      "Age",
      "Status",
      "Registered At",
      "Admitted At",
      "Joined At",
      "Left At",
    ];

    const rows = guests.map((g) => [
      g.id,
      g.fullName,
      g.email,
      g.age,
      g.status,
      g.createdAt?.toISOString(),
      g.admittedAt?.toISOString(),
      g.joinedAt?.toISOString(),
      g.leftAt?.toISOString(),
    ]);

    const csv = [
      columns.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="webinar-${session.id}-attendees.csv"`
    );

    return res.send("\uFEFF" + csv);
  } catch (err) {
    console.error("[webinar guest] export", err);
    res.status(500).json({ message: "Could not export webinar guests" });
  }
};
