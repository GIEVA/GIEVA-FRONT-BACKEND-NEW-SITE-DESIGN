// controllers/livekitWebhook.controller.js

import models from "../models/index.js";

import sendEmail
from "../utils/sendMail.js";

const {
  SessionAttendance,
  SessionEventLog,
  ClassSession,
  TutorProfile,
  User,
  ActivityLog,
  Notification,
} = models;



// ======================================================
// GENERATE ATTENDANCE REPORT
// ======================================================

const generateAttendanceReport =
  async (session) => {

    try {

      const attendance =
        await SessionAttendance.findAll({

          where: {
            classSessionId:
              session.id,
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
        });



      const totalParticipants =
        attendance.length;

      const presentStudents =
        attendance.filter(
          (a) =>
            a.wasPresent === true
        );

      const absentStudents =
        attendance.filter(
          (a) =>
            a.wasPresent === false
        );



      // ==================================================
      // UPDATE SESSION ANALYTICS
      // ==================================================

      session.totalParticipants =
        totalParticipants;

      session.totalAttendanceMinutes =
        attendance.reduce(
          (acc, item) =>
            acc +
            item.totalMinutes,
          0
        );

      session.attendanceReportGenerated =
        true;

      await session.save();



      // ==================================================
      // ADMIN REPORT NOTIFICATION
      // ==================================================

      await Notification.create({

        title:
          "Session Attendance Report Generated",

        message:
          `${session.title} attendance report is ready`,

        type:
          "attendance_report",

        entityId:
          session.id,

        entityType:
          "class_session",
      });



      // ==================================================
      // LOG
      // ==================================================

      await ActivityLog.create({

        userId:
          session.scheduledBy,

        action:
          "ATTENDANCE_REPORT_GENERATED",

        meta: {

          sessionId:
            session.id,

          totalParticipants,

          present:
            presentStudents.length,

          absent:
            absentStudents.length,
        },
      });

    } catch (err) {

      console.error(
        "Attendance Report Error",
        err
      );
    }
  };



// ======================================================
// LIVEKIT WEBHOOK
// ======================================================

export const livekitWebhook =
  async (req, res) => {

    try {

      const event =
        req.body;

      const roomName =
        event.room?.name;

      const identity =
        event.participant?.identity;



      if (
        !roomName ||
        !identity
      ) {

        return res.sendStatus(200);
      }



      const userId =
        Number(
          identity.replace(
            "user-",
            ""
          )
        );

      if (!userId) {

        return res.sendStatus(200);
      }



      // ==================================================
      // GET SESSION
      // ==================================================

      const session =
        await ClassSession.findOne({

          where: {
            roomName,
          },

          include: [
            {
              model:
                TutorProfile,
            },
          ],
        });



      if (!session) {

        return res.sendStatus(200);
      }



      // ==================================================
      // DETERMINE ROLE
      // ==================================================

      const role =
        userId ===
        session.TutorProfile
          ?.userId
          ? "tutor"
          : "student";



      // ==================================================
      // PARTICIPANT JOINED
      // ==================================================

      if (
        event.event ===
        "participant_joined"
      ) {

        await SessionEventLog.create({

          classSessionId:
            session.id,

          userId,

          eventType:
            "join",

          metadata: {
            joinedAt:
              new Date(),
          },
        });



        let attendance =
          await SessionAttendance.findOne({

            where: {
              classSessionId:
                session.id,

              userId,
            },
          });



        // ================================================
        // FIRST JOIN
        // ================================================

        if (!attendance) {

          attendance =
            await SessionAttendance.create({

              classSessionId:
                session.id,

              userId,

              role,

              joinTime:
                new Date(),

              wasPresent:
                true,
            });



          await ActivityLog.create({

            userId,

            action:
              "SESSION_JOINED",

            meta: {
              sessionId:
                session.id,

              role,
            },
          });

        } else {

          attendance.reconnectCount += 1;

          attendance.joinTime =
            new Date();

          attendance.wasPresent =
            true;

          await attendance.save();
        }



        // ================================================
        // TUTOR STARTS SESSION
        // ================================================

        if (
          role === "tutor"
        ) {

          session.status =
            "live";

          session.isLive =
            true;

          await session.save();



          await ActivityLog.create({

            userId,

            action:
              "SESSION_STARTED",

            meta: {
              sessionId:
                session.id,
            },
          });
        }
      }



      // ==================================================
      // PARTICIPANT LEFT
      // ==================================================

      if (
        event.event ===
        "participant_left"
      ) {

        const attendance =
          await SessionAttendance.findOne({

            where: {
              classSessionId:
                session.id,

              userId,
            },
          });



        if (
          attendance &&
          attendance.joinTime
        ) {

          const leaveTime =
            new Date();

          const minutes =
            (
              leaveTime -
              attendance.joinTime
            ) / 60000;



          attendance.totalMinutes +=
            Math.max(
              0,
              Math.round(minutes)
            );

          attendance.leaveTime =
            leaveTime;

          await attendance.save();



          // ==============================================
          // TUTOR TRACKING
          // ==============================================

          if (
            role === "tutor"
          ) {

            const tutor =
              await TutorProfile.findOne({

                where: {
                  userId,
                },
              });



            if (tutor) {

              tutor.totalLectureMinutes +=
                Math.round(minutes);

              await tutor.save();
            }



            // ============================================
            // SESSION ENDED
            // ============================================

            session.status =
              "ended";

            session.isLive =
              false;

            await session.save();



            await ActivityLog.create({

              userId,

              action:
                "SESSION_ENDED",

              meta: {
                sessionId:
                  session.id,
              },
            });



            // ============================================
            // GENERATE REPORT
            // ============================================

            await generateAttendanceReport(
              session
            );
          }
        }



        await SessionEventLog.create({

          classSessionId:
            session.id,

          userId,

          eventType:
            "leave",

          metadata: {
            leftAt:
              new Date(),
          },
        });
      }



      // ==================================================
      // RECORDING READY WEBHOOK
      // ==================================================

      if (
        event.event ===
        "egress_ended"
      ) {

        if (
          event.egressInfo
            ?.fileResults?.[0]
            ?.location
        ) {

          session.recordingUrl =
            event.egressInfo
              .fileResults[0]
              .location;

          session.recordingDuration =
            Math.round(
              (
                session.endTime -
                session.startTime
              ) / 60000
            );

          session.recordingStatus =
            "ready";

          await session.save();



          await ActivityLog.create({

            userId:
              session.scheduledBy,

            action:
              "SESSION_RECORDING_READY",

            meta: {
              sessionId:
                session.id,
            },
          });
        }
      }



      return res.sendStatus(200);

    } catch (err) {

      console.error(
        "Webhook Error",
        err
      );

      return res.sendStatus(500);
    }
  };