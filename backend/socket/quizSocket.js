// socket/quizSocket.js
//
// Sets up Socket.io for real-time quiz communication.
// Each quiz event gets its own room: `event:{eventId}`
// Participants, panelists, admins, and audience all join this room.
//
// ── Wire up in server.js ──────────────────────────────────────
// import { createServer } from "http";
// import { Server }       from "socket.io";
// import { initQuizSocket } from "./socket/quizSocket.js";
//
// const httpServer = createServer(app);
// const io = new Server(httpServer, {
//   cors: { origin: process.env.FRONTEND_URL, credentials: true },
// });
// app.set("io", io);
// initQuizSocket(io);
// httpServer.listen(PORT, ...);

export const initQuizSocket = (io) => {
  io.on("connection", (socket) => {
    // ── Join event room ──────────────────────────────────────
    // Emitted by every client (admin, participant, audience) on load.
    // role: "admin" | "panelist" | "participant" | "audience"
    socket.on("quiz:join_room", ({ eventId, role, participantId }) => {
      socket.join(`event:${eventId}`);

      // Track connection metadata on the socket
      socket.data.eventId       = eventId;
      socket.data.role          = role;
      socket.data.participantId = participantId;

      console.log(`[socket] ${role} joined event:${eventId}${participantId ? ` (participant ${participantId})` : ""}`);

      // Acknowledge join
      socket.emit("quiz:joined", { eventId, role, serverTime: new Date() });
    });

    // ── Participant connection status ────────────────────────
    socket.on("quiz:participant_ready", ({ eventId, participantId }) => {
      io.to(`event:${eventId}`).emit("quiz:participant_status", {
        participantId,
        connectionStatus: "ready",
        timestamp:        new Date(),
      });
    });

    socket.on("quiz:participant_needs_help", ({ eventId, participantId, message }) => {
      io.to(`event:${eventId}`).emit("quiz:participant_status", {
        participantId,
        connectionStatus: "needs_assistance",
        message,
        timestamp:        new Date(),
      });
    });

    // ── Typing / answer selection indicator ─────────────────
    // Tells the admin dashboard that a participant is actively
    // selecting an answer (no option value sent — just a flag)
    socket.on("quiz:answering", ({ eventId, participantId }) => {
      io.to(`event:${eventId}`).emit("quiz:participant_answering", {
        participantId,
        timestamp: new Date(),
      });
    });

    // ── Disconnect handling ──────────────────────────────────
    socket.on("disconnect", () => {
      const { eventId, participantId, role } = socket.data;
      if (eventId && role === "participant" && participantId) {
        io.to(`event:${eventId}`).emit("quiz:participant_status", {
          participantId,
          connectionStatus: "disconnected",
          timestamp:        new Date(),
        });
        console.log(`[socket] participant ${participantId} disconnected from event ${eventId}`);
      }
    });

    // ── Admin broadcast (manual announcements) ───────────────
    socket.on("quiz:admin_broadcast", ({ eventId, message }) => {
      if (socket.data.role !== "admin" && socket.data.role !== "panelist") return;
      io.to(`event:${eventId}`).emit("quiz:announcement", {
        message,
        timestamp: new Date(),
      });
    });
  });
};
