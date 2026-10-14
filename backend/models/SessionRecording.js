// models/SessionRecording.js
// One recording run of a session: the video file, an optional audio-only file used
// for transcription, the transcript, and the AI-generated notes.
//
// status:           recording → processing → ready | failed      (video file state)
// transcriptStatus: none | pending → processing → ready | failed (AI notes state)

export default (sequelize, DataTypes) => {
  const SessionRecording = sequelize.define(
    "SessionRecording",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      classSessionId: { type: DataTypes.INTEGER, allowNull: false },
      startedBy: { type: DataTypes.INTEGER, allowNull: true },

      status: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: "recording",
        validate: { isIn: [["recording", "processing", "ready", "failed"]] },
      },

      videoEgressId: { type: DataTypes.STRING(128), allowNull: true },
      audioEgressId: { type: DataTypes.STRING(128), allowNull: true },
      videoKey: { type: DataTypes.STRING(512), allowNull: true },
      audioKey: { type: DataTypes.STRING(512), allowNull: true },
      durationSeconds: { type: DataTypes.INTEGER, allowNull: true },

      aiNotesEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      transcriptStatus: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: "none",
        validate: { isIn: [["none", "pending", "processing", "ready", "failed"]] },
      },
      transcript: { type: DataTypes.TEXT("long"), allowNull: true },
      transcriptSegments: { type: DataTypes.JSONB, allowNull: true },
      // { summary, keyPoints[], decisions[], actionItems[{task, owner}], openQuestions[] }
      notes: { type: DataTypes.JSONB, allowNull: true },
      errorMessage: { type: DataTypes.TEXT, allowNull: true },

      startedAt: { type: DataTypes.DATE, allowNull: true },
      endedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "session_recordings",
      indexes: [
        { fields: ["classSessionId"] },
        { fields: ["videoEgressId"] },
        { fields: ["audioEgressId"] },
      ],
    }
  );

  SessionRecording.associate = (models) => {
    SessionRecording.belongsTo(models.ClassSession, { foreignKey: "classSessionId" });
  };

  return SessionRecording;
};
