// models/SessionRole.js
// People the admin added to a webinar/meeting team. Everyone else is an attendee.
//   host      : runs the webinar (same powers as the scheduler/tutor)
//   alt_host  : can start the webinar if the host is absent, same powers as host
//   cohost    : helps manage: mute, Q&A, recording, participants. Cannot assign roles or stream
//   panelist  : speaks: camera, microphone, screen share
// Promoting an attendee to panelist during the event also writes a row here, so they keep it on rejoin.

export const SESSION_ROLES = ["host", "alt_host", "cohost", "panelist"];

export default (sequelize, DataTypes) => {
  const SessionRole = sequelize.define(
    "SessionRole",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      classSessionId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      role: { type: DataTypes.STRING(16), allowNull: false, validate: { isIn: [SESSION_ROLES] } },
      addedBy: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: "session_roles",
      indexes: [{ unique: true, fields: ["classSessionId", "userId"] }],
    }
  );

  SessionRole.associate = (models) => {
    SessionRole.belongsTo(models.ClassSession, { foreignKey: "classSessionId" });
    models.ClassSession.hasMany(SessionRole, { foreignKey: "classSessionId" });
  };

  return SessionRole;
};
