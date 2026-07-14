// models/ContactMessage.js

import { DataTypes } from "sequelize";

export default (sequelize) => {
  const ContactMessage = sequelize.define(
    "ContactMessage",
    {
      id: {
        type:          DataTypes.INTEGER,
        primaryKey:    true,
        autoIncrement: true,
      },

      userId: {
        type:      DataTypes.INTEGER,
        allowNull: true,
      },

      fullName: {
        type:      DataTypes.STRING(120),
        allowNull: false,
      },

      email: {
        type:      DataTypes.STRING(200),
        allowNull: false,
        validate:  { isEmail: true },
      },

      phone: {
        type:      DataTypes.STRING(30),
        allowNull: true,
      },

      subject: {
        type:      DataTypes.STRING(200),
        allowNull: false,
      },

      message: {
        type:      DataTypes.TEXT,
        allowNull: false,
      },

      category: {
        type: DataTypes.ENUM(
          "general",
          "support",
          "billing",
          "course_inquiry",
          "partnership",
          "complaint",
          "other"
        ),
        defaultValue: "general",
      },

      // ── Complaint attachment (Cloudinary) ─────────────────────
      // Follows the same pattern as TutorProfile:
      //   attachmentUrl          = req.file.path      (Cloudinary URL)
      //   attachmentCloudinaryId = req.file.filename  (public_id for deletion)
      //   attachmentOriginalName = req.file.originalname (shown in admin UI)
      attachmentUrl: {
        type:      DataTypes.STRING(500),
        allowNull: true,
      },

      attachmentCloudinaryId: {
        type:      DataTypes.STRING(300),
        allowNull: true,
      },

      attachmentOriginalName: {
        type:      DataTypes.STRING(255),
        allowNull: true,
      },

      // ── Admin workflow ────────────────────────────────────────
      status: {
        type:         DataTypes.ENUM("new", "in_progress", "resolved", "closed"),
        defaultValue: "new",
      },

      assignedTo:   { type: DataTypes.INTEGER,    allowNull: true },
      adminReply:   { type: DataTypes.TEXT,        allowNull: true },
      repliedAt:    { type: DataTypes.DATE,        allowNull: true },
      repliedBy:    { type: DataTypes.INTEGER,    allowNull: true },
      internalNote: { type: DataTypes.TEXT,        allowNull: true },
      ipAddress:    { type: DataTypes.STRING(45), allowNull: true },
    },
    {
      tableName:  "contact_messages",
      timestamps: true,
    }
  );

  ContactMessage.associate = (models) => {
    ContactMessage.belongsTo(models.User, { foreignKey: "userId",     as: "sender"   });
    ContactMessage.belongsTo(models.User, { foreignKey: "assignedTo", as: "assignee" });
    ContactMessage.belongsTo(models.User, { foreignKey: "repliedBy",  as: "replier"  });
  };

  return ContactMessage;
};
