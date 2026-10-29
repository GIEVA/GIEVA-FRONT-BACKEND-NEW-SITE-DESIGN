// services/sessionDeletion.js
// Deletes a class session AND everything that points at it, in one transaction.
//
// Why: your DB has foreign keys from tables like session_waiting_rooms, attendance, and my polls /
// recordings tables to class_sessions, with no ON DELETE rule. Deleting the parent row then fails
// with "Cannot delete or update a parent row" (the 500 you saw). This finds EVERY model that has a
// `classSessionId` column and clears it first, so it also covers tables you add later.
//
//   import { deleteSessionCascade } from "../services/sessionDeletion.js";
//   await deleteSessionCascade(session.id);      // instead of session.destroy()

import models from "../models/index.js";
import { deleteObject } from "../config/storage.js";

const { ClassSession, SessionPoll, SessionPollResponse, SessionRecording } = models;

const isFkError = (err) => err?.name === "SequelizeForeignKeyConstraintError" || err?.parent?.errno === 1451;

export const deleteSessionCascade = async (sessionId) => {
  const sequelize = ClassSession.sequelize;
  const t = await sequelize.transaction();
  const filesToRemove = [];

  try {
    // Recording files in the bucket are removed after the DB commit succeeds
    if (SessionRecording) {
      const recs = await SessionRecording.findAll({ where: { classSessionId: sessionId }, attributes: ["videoKey", "audioKey"], transaction: t });
      recs.forEach((r) => filesToRemove.push(r.videoKey, r.audioKey));
    }

    // Poll answers hang off polls, not off the session directly
    if (SessionPoll && SessionPollResponse) {
      const polls = await SessionPoll.findAll({ where: { classSessionId: sessionId }, attributes: ["id"], transaction: t });
      if (polls.length) await SessionPollResponse.destroy({ where: { pollId: polls.map((p) => p.id) }, transaction: t });
    }

    // Every other model that references the session
    const dependents = Object.values(models).filter(
      (m) => m && m !== ClassSession && m.rawAttributes && m.rawAttributes.classSessionId && typeof m.destroy === "function"
    );

    // A table may itself be referenced by another dependent, so retry the ones that fail
    let pending = dependents;
    for (let pass = 0; pass < 4 && pending.length; pass++) {
      const next = [];
      for (const model of pending) {
        try {
          await model.destroy({ where: { classSessionId: sessionId }, transaction: t });
        } catch (err) {
          if (!isFkError(err)) throw err;
          next.push(model);
        }
      }
      pending = next;
    }
    if (pending.length) {
      throw Object.assign(new Error(`Still referenced by: ${pending.map((m) => m.tableName || m.name).join(", ")}`), { code: "SESSION_IN_USE" });
    }

    const removed = await ClassSession.destroy({ where: { id: sessionId }, transaction: t });
    await t.commit();

    filesToRemove.filter(Boolean).forEach((k) => deleteObject(k));
    return removed > 0;
  } catch (err) {
    await t.rollback().catch(() => {});
    throw err;
  }
};
