// services/sessionReminder.service.js

import cron from "node-cron";

import models from "../models/index.js";

import sendEmail
from "../utils/sendMail.js";

const {
  ClassSession,
  TutorStudent,
  User,
  Notification,
  Course,
} = models;



// ======================================================
// SEND SESSION REMINDER
// ======================================================

const sendReminder =
  async (
    session,
    type
  ) => {

    try {

      // ==================================================
      // GET ASSIGNED STUDENTS
      // ==================================================

      const assignments =
        await TutorStudent.findAll({

          where: {
            tutorProfileId:
              session.tutorProfileId,

            courseId:
              session.courseId,

            status:
              "active",
          },

          include: [
            {
              model: User,
              as: "student",
            },

            {
              model: Course,
            },
          ],
        });



      for (const assignment of assignments) {

        const student =
          assignment.student;

        if (!student)
          continue;



        // ================================================
        // CREATE NOTIFICATION
        // ================================================

        await Notification.create({

          userId:
            student.id,

          title:
            "Upcoming Live Class",

          message:
            `${session.title} starts soon`,

          type:
            "session_reminder",

          entityId:
            session.id,

          entityType:
            "class_session",
        });



        // ================================================
        // SEND EMAIL
        // ================================================

        const timeLabel =
          type === "1h"
            ? "1 hour"
            : "10 minutes";



        await sendEmail(

          student.email,

          "Upcoming Live Class Reminder",

          `
          <div style="font-family:sans-serif">

            <h2>
              Live Class Reminder
            </h2>

            <p>
              Hello ${student.fullName},
            </p>

            <p>
              This is a reminder that your live class session begins in ${timeLabel}.
            </p>

            <p>
              <strong>Course:</strong>
              ${assignment.Course?.title || "Course"}
            </p>

            <p>
              <strong>Class:</strong>
              ${session.title}
            </p>

            <p>
              <strong>Time:</strong>
              ${new Date(
                session.startTime
              ).toLocaleString()}
            </p>

            <p>
              <strong>Duration:</strong>
              ${session.durationMinutes} minutes
            </p>

            <a
              href="${session.joinLink}"
              style="
                display:inline-block;
                margin-top:20px;
                padding:12px 20px;
                background:#6C2BD9;
                color:#fff;
                text-decoration:none;
                border-radius:8px;
                font-weight:bold;
              "
            >
              Join Live Class
            </a>

            <p style="margin-top:20px">
              Please join a few minutes early.
            </p>

            <p>
              GIEVA Learning Team
            </p>

          </div>
          `
        );
      }



      // ==================================================
      // UPDATE REMINDER STATUS
      // ==================================================

      if (type === "1h") {

        session.reminderSent1h =
          true;
      }

      if (type === "10m") {

        session.reminderSent10m =
          true;
      }

      await session.save();

    } catch (err) {

      console.error(
        "Reminder Error",
        err
      );
    }
  };



// ======================================================
// CRON JOB
// RUNS EVERY MINUTE
// ======================================================

export const startSessionReminderCron =
  () => {

    cron.schedule(
      "* * * * *",

      async () => {

        try {

          const now =
            new Date();



          // ==============================================
          // GET UPCOMING SESSIONS
          // ==============================================

          const sessions =
            await ClassSession.findAll({

              where: {
                status:
                  "scheduled",
              },
            });



          for (const session of sessions) {

            const diffMs =
              new Date(
                session.startTime
              ) - now;

            const diffMinutes =
              Math.floor(
                diffMs / 60000
              );



            // ============================================
            // 1 HOUR REMINDER
            // ============================================

            if (
              diffMinutes <= 60 &&
              diffMinutes > 50 &&
              !session.reminderSent1h
            ) {

              console.log(
                `Sending 1h reminder for session ${session.id}`
              );

              await sendReminder(
                session,
                "1h"
              );
            }



            // ============================================
            // 10 MIN REMINDER
            // ============================================

            if (
              diffMinutes <= 10 &&
              diffMinutes > 0 &&
              !session.reminderSent10m
            ) {

              console.log(
                `Sending 10m reminder for session ${session.id}`
              );

              await sendReminder(
                session,
                "10m"
              );
            }
          }

        } catch (err) {

          console.error(
            "Session Reminder Cron Error",
            err
          );
        }
      }
    );



    console.log(
      "✅ Session reminder cron started"
    );
  };