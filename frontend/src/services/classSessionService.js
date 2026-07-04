import API from "./api";


const BASE = "/api/session";

// ======================================================
// STUDENT SESSIONS
// ======================================================

export const getStudentSessions =
  async () => {

    const res =
      await API.get(
        "/api/session/student/my-sessions"
      );

    return res.data;
  };



// ======================================================
// TUTOR SESSIONS
// ======================================================

export const getTutorSessions =
  async () => {

    const res =
      await API.get(
        "/api/session/tutor/my-sessions"
      );

    return res.data;
  };



// ======================================================
// SCHEDULE SESSION
// ======================================================

export const scheduleClassSession =
  async (data) => {

    const res =
      await API.post(
        "/api/session/schedule",
        data
      );

    return res.data;
  };



// ======================================================
// JOIN AS STUDENT
// ======================================================

export const joinClassSession =
  async (sessionId) => {

    const res =
      await API.get(
        `/api/session/join/${sessionId}`
      );

    return res.data;
  };



// ======================================================
// JOIN AS TUTOR
// ======================================================

export const joinTutorSession =
  async (sessionId) => {

    const res =
      await API.get(
        `/api/session/tutor/join/${sessionId}`
      );

    return res.data;
  };



// ======================================================
// GET SESSION DETAILS
// ======================================================

export const getSessionById =
  async (sessionId) => {

    const res =
      await API.get(
        `/api/session/${sessionId}`
      );

    return res.data;
  };



// ======================================================
// ATTENDANCE
// ======================================================

export const getSessionAttendance =
  async (sessionId) => {

    const res =
      await API.get(
        `/api/session/${sessionId}/attendance`
      );

    return res.data;
  };



// ======================================================
// RECORDING
// ======================================================

export const getSessionRecording =
  async (sessionId) => {

    const res =
      await API.get(
        `/api/session/${sessionId}/recording`
      );

    return res.data;
  };



// ======================================================
// END SESSION
// ======================================================

export const endSession =
  async (sessionId) => {

    const res =
      await API.patch(
        `/api/session/${sessionId}/end`
      );

    return res.data;
  };



// ======================================================
// CANCEL SESSION
// ======================================================

export const cancelSession =
  async (
    sessionId,
    reason
  ) => {

    const res =
      await API.patch(
        `/api/session/${sessionId}/cancel`,
        { reason }
      );

    return res.data;
  };




// ====================================
// RECORDING
// ====================================


  // ======================================================
// ATTENDANCE
// ======================================================

export const markAttendance =
  async (sessionId) => {

    const res =
      await API.post(
        `/api/session/${sessionId}/attendance`
      );

    return res.data;
  };

export const leaveAttendance =
  async (sessionId) => {

    const res =
      await API.patch(
        `/api/session/${sessionId}/leave`
      );

    return res.data;
  };


// ======================================================
// PARTICIPANTS
// ======================================================

export const getParticipants =
  async (sessionId) => {

    const res =
      await API.get(
        `/api/session/${sessionId}/participants`
      );

    return res.data;
  };


// ======================================================
// REACTIONS
// ======================================================

export const sendSessionReaction =
  async (
    sessionId,
    emoji
  ) => {

    const res =
      await API.post(
        `/api/session/${sessionId}/reaction`,
        { emoji }
      );

    return res.data;
  };


// ======================================================
// RAISE HAND
// ======================================================

export const raiseHand =
  async (sessionId) => {

    const res =
      await API.post(
        `/api/session/${sessionId}/raise-hand`
      );

    return res.data;
  };


// ======================================================
// RECORDING
// ======================================================

export const startRecording =
  async (sessionId) => {

    const res =
      await API.post(
        `/api/session/${sessionId}/recording/start`
      );

    return res.data;
  };

export const stopRecording =
  async (sessionId) => {

    const res =
      await API.post(
        `/api/session/${sessionId}/recording/stop`
      );

    return res.data;
  };



// ── Waiting room ────────────────────────────────────────────────

/**
 * Fetch the current waiting room list (host / admin only).
 */
export const getWaitingRoom = async (sessionId) => {
  const res = await API.get(`/api/session/${sessionId}/waiting-room`);
  return res.data;
};

/**
 * Host admits a waiting participant.
 */
export const admitParticipant = async (sessionId, userId) => {
  const res = await API.post(`/api/session/${sessionId}/admit/${userId}`);
  return res.data;
};

/**
 * Host denies a waiting participant.
 */
export const denyParticipant = async (sessionId, userId, reason = "") => {
  const res = await API.post(`/api/session/${sessionId}/deny/${userId}`, { reason });
  return res.data;
};

/**
 * Called by the student AFTER receiving the ADMITTED data message.
 * Returns a full participant token (canPublish: true).
 */
export const getParticipantToken = async (sessionId) => {
  const res = await API.post(`/api/session/${sessionId}/participant-token`);
  return res.data;
};


export const rescheduleSession = (sessionId, body) =>
  API.patch(`${BASE}/${sessionId}/reschedule`, body).then((r) => r.data);

export const getSessionDetail = (sessionId) =>
  API.get(`${BASE}/${sessionId}`).then((r) => r.data);
 
