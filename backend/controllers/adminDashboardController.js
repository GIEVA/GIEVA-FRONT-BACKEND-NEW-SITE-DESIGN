import models
from "../models/index.js";

import { Op }
from "sequelize";

const {

  User,
  TutorProfile,
  Course,
  Lesson,
  CourseModule,
  Enrollment,
  ClassSession,
  SessionAttendance,

  // HEALS
  HealsApplication,
  HealsPayment,

  // LMS PAYMENTS
  Payment,

  // CMS
  Article,

  // CAMPAIGNS
  Campaign,
  CampaignRegistration,
  CampaignMessage,

  // NOTIFICATIONS
  Notification,

  //exams reg
  ExamRegistration,
  ExamPayment,

  ConsultationBooking,
  ContactMessage,
  Staff,
} = models;



export const getAdminDashboardSummary =
  async (req, res) => {

    try {

      // ======================================================
      // DATES
      // ======================================================

      const now =
        new Date();

      const thirtyDaysAgo =
        new Date();

      thirtyDaysAgo.setDate(
        now.getDate() - 30
      );



      // ======================================================
      // USERS
      // ======================================================

      const [

        totalUsers,
        totalStudents,
        totalTutors,
        approvedTutors,

      ] = await Promise.all([

        User.count(),

        User.count({

          where: {
            role: "student",
          },
        }),

        User.count({

          where: {
            role: "tutor",
          },
        }),

        TutorProfile.count({

          where: {
            approved: true,
          },
        }),

      ]);



      // ======================================================
      // COURSES
      // ======================================================

      const [

        totalCourses,
        publishedCourses,
        totalLessons,
        totalModules,

      ] = await Promise.all([

        Course.count(),

        Course.count({

          where: {
            isPublished: true,
          },
        }),

        Lesson.count(),

        CourseModule.count(),

      ]);



      // ======================================================
      // ENROLLMENTS
      // ======================================================

      const [

        totalEnrollments,
        activeEnrollments,

      ] = await Promise.all([

        Enrollment.count(),

        Enrollment.count({

          where: {
            status: "active",
          },
        }),

      ]);



      // ======================================================
      // LIVE SESSIONS
      // ======================================================

      const [

        totalSessions,
        upcomingSessions,
        liveSessions,
        completedSessions,

      ] = await Promise.all([

        ClassSession.count(),

        ClassSession.count({

          where: {

            status: "scheduled",

            scheduledAt: {
              [Op.gt]: now,
            },
          },
        }),

        ClassSession.count({

          where: {
            status: "live",
          },
        }),

        ClassSession.count({

          where: {
            status: "ended",
          },
        }),

      ]);



      // ======================================================
      // ATTENDANCE
      // ======================================================

      const totalAttendance =
        await SessionAttendance.count({

          where: {
            wasPresent: true,
          },
        });



      // ======================================================
      // HEALS APPLICATIONS
      // ======================================================

      const [

        totalApplications,
        pendingApplications,
        approvedApplications,
        completedApplications,
        rejectedApplications,
        processingApplications,

      ] = await Promise.all([

        HealsApplication.count(),

        HealsApplication.count({

          where: {

            status: {

              [Op.in]: [

                "submitted",
                "under_review",
                "info_requested",

              ],
            },
          },
        }),

        HealsApplication.count({

          where: {

            status: {

              [Op.in]: [

                "approved",
                "approved_for_payment",
                "paid",

              ],
            },
          },
        }),

        HealsApplication.count({

          where: {
            status: "completed",
          },
        }),

        HealsApplication.count({

          where: {
            status: "rejected",
          },
        }),

        HealsApplication.count({

          where: {
            status: "processing",
          },
        }),

      ]);



      // ======================================================
      // HEALS PAYMENTS
      // ======================================================

      const [

        successfulHealsPayments,
        pendingHealsPayments,
        failedHealsPayments,

      ] = await Promise.all([

        HealsPayment.count({

          where: {
            status: "success",
          },
        }),

        HealsPayment.count({

          where: {
            status: "pending",
          },
        }),

        HealsPayment.count({

          where: {
            status: "failed",
          },
        }),

      ]);



      const successfulHealsPaymentRows =
        await HealsPayment.findAll({

          where: {
            status: "success",
          },

          attributes: [
            "totalAmount",
          ],
        });



      const totalHealsRevenue =
        successfulHealsPaymentRows.reduce(

          (sum, item) =>

            sum +
            Number(
              item.totalAmount || 0
            ),

          0
        );


        // ======================================================
      // CONSULTATIONS
      // ======================================================

      const [
        totalConsultations,
        pendingConsultations,
        confirmedConsultations,
        completedConsultations,
        cancelledConsultations,
        noShowConsultations,
      ] = await Promise.all([
        ConsultationBooking.count(),
        ConsultationBooking.count({ where: { status: "pending" } }),
        ConsultationBooking.count({ where: { status: "confirmed" } }),
        ConsultationBooking.count({ where: { status: "completed" } }),
        ConsultationBooking.count({ where: { status: "cancelled" } }),
        ConsultationBooking.count({ where: { status: "no_show" } }),
      ]);

      const consultationTypeRows = await ConsultationBooking.findAll({
        attributes: ["consultationType"],
      });

      const consultationTypeMap = {};
      consultationTypeRows.forEach((row) => {
        consultationTypeMap[row.consultationType] =
          (consultationTypeMap[row.consultationType] || 0) + 1;
      });

      const consultationTypeAnalytics = Object.entries(consultationTypeMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // ======================================================
      // CONTACT MESSAGES
      // ======================================================

      const [
        totalContactMessages,
        newContactMessages,
        inProgressContactMessages,
        resolvedContactMessages,
        closedContactMessages,
      ] = await Promise.all([
        ContactMessage.count(),
        ContactMessage.count({ where: { status: "new" } }),
        ContactMessage.count({ where: { status: "in_progress" } }),
        ContactMessage.count({ where: { status: "resolved" } }),
        ContactMessage.count({ where: { status: "closed" } }),
      ]);

      const contactCategoryRows = await ContactMessage.findAll({
        attributes: ["category"],
      });

      const contactCategoryMap = {};
      contactCategoryRows.forEach((row) => {
        contactCategoryMap[row.category] = (contactCategoryMap[row.category] || 0) + 1;
      });

      const contactCategoryAnalytics = Object.entries(contactCategoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // ======================================================
      // STAFF
      // ======================================================

      const [totalStaff, publishedStaff] = await Promise.all([
        Staff.count(),
        Staff.count({ where: { status: "published" } }),
      ]);

      const staffRoleRows = await Staff.findAll({ attributes: ["role"] });
      const staffRoleMap = {};
      staffRoleRows.forEach((row) => {
        staffRoleMap[row.role] = (staffRoleMap[row.role] || 0) + 1;
      });
      const staffRoleAnalytics = Object.entries(staffRoleMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // ======================================================
      // USER ROLE + VERIFICATION BREAKDOWN
      // ======================================================

      const [
        totalAdmins,
        totalOperationalAdmins,
        totalReviewers,
        totalAgents,
        totalApplicants,
        verifiedUsers,
        unverifiedUsers,
        activeUsers,
        inactiveUsers,
      ] = await Promise.all([
        User.count({ where: { role: "superadmin" } }),
        User.count({ where: { role: "operational_admin" } }),
        User.count({ where: { role: "reviewer" } }),
        User.count({ where: { role: "agent" } }),
        User.count({ where: { role: "applicant" } }),
        User.count({ where: { isVerified: true } }),
        User.count({ where: { isVerified: false } }),
        User.count({ where: { isActive: true } }),
        User.count({ where: { isActive: false } }),
      ]);

      const userRoleAnalytics = [
        { name: "Students", value: totalStudents },
        { name: "Tutors", value: totalTutors },
        { name: "Applicants", value: totalApplicants },
        { name: "Admins", value: totalAdmins + totalOperationalAdmins },
        { name: "Reviewers", value: totalReviewers },
        { name: "Agents", value: totalAgents },
      ].filter((r) => r.value > 0);

      // ======================================================
      // TIME-SERIES HELPERS
      // ======================================================
      // Groups rows by calendar day over the last N days, filling in
      // zero-count days so charts don't show gaps.

      const buildDailySeries = (rows, days = 30) => {
        const map = {};
        rows.forEach((row) => {
          const date = row.get("date");
          map[date] = Number(row.get("count"));
        });

        const series = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
          series.push({ date: key, count: map[key] || 0 });
        }
        return series;
      };

      const dailyRange = new Date();
      dailyRange.setDate(dailyRange.getDate() - 30);

      const [
        usersPerDayRaw,
        paymentsPerDayRaw,
        examsPerDayRaw,
        sessionsPerDayRaw,
        consultationsPerDayRaw,
      ] = await Promise.all([
        User.findAll({
          attributes: [
            [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
            [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          ],
          where: { createdAt: { [Op.gte]: dailyRange } },
          group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
          raw: false,
        }),

        // Combine all three payment sources by day — HEALS + Course + Exam
        Payment.findAll({
          attributes: [
            [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
            [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          ],
          where: { status: "success", createdAt: { [Op.gte]: dailyRange } },
          group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
          raw: false,
        }),

        ExamRegistration.findAll({
          attributes: [
            [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
            [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          ],
          where: { createdAt: { [Op.gte]: dailyRange } },
          group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
          raw: false,
        }),

        ClassSession.findAll({
          attributes: [
            [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
            [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          ],
          where: { createdAt: { [Op.gte]: dailyRange } },
          group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
          raw: false,
        }),

        ConsultationBooking.findAll({
          attributes: [
            [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
            [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          ],
          where: { createdAt: { [Op.gte]: dailyRange } },
          group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
          raw: false,
        }),
      ]);

      const usersPerDay = buildDailySeries(usersPerDayRaw);
      const paymentsPerDay = buildDailySeries(paymentsPerDayRaw);
      const examsPerDay = buildDailySeries(examsPerDayRaw);
      const sessionsPerDay = buildDailySeries(sessionsPerDayRaw);
      const consultationsPerDay = buildDailySeries(consultationsPerDayRaw);

      // ======================================================
      // MONTHLY USERS (last 6 months)
      // ======================================================

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const usersPerMonthRaw = await User.findAll({
        attributes: [
          [sequelize.fn("DATE_FORMAT", sequelize.col("createdAt"), "%Y-%m"), "month"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        where: { createdAt: { [Op.gte]: sixMonthsAgo } },
        group: [sequelize.fn("DATE_FORMAT", sequelize.col("createdAt"), "%Y-%m")],
        raw: true,
      });

      const monthMap = {};
      usersPerMonthRaw.forEach((row) => {
        monthMap[row.month] = Number(row.count);
      });

      const usersPerMonth = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        usersPerMonth.push({ month: key, count: monthMap[key] || 0 });
      }

      // ======================================================
      // STATUS PIE ARRAYS (reshaping existing flat numbers)
      // ======================================================

      const examStatusPie = [
        { name: "Submitted", value: submittedExamRegistrations },
        { name: "Under Review", value: underReviewExamRegistrations },
        { name: "Processing", value: processingExamRegistrations },
        { name: "Completed", value: completedExamRegistrations },
        { name: "Rejected", value: rejectedExamRegistrations },
        { name: "Cancelled", value: cancelledExamRegistrations },
      ].filter((r) => r.value > 0);

      const healsStatusPie = [
        { name: "Pending", value: pendingApplications },
        { name: "Approved", value: approvedApplications },
        { name: "Completed", value: completedApplications },
        { name: "Rejected", value: rejectedApplications },
        { name: "Processing", value: processingApplications },
      ].filter((r) => r.value > 0);

      const paymentStatusPie = [
        { name: "Successful", value: totalSuccessfulPayments },
        { name: "Pending", value: totalPendingPayments },
        { name: "Failed", value: totalFailedPayments },
      ].filter((r) => r.value > 0);

      const consultationStatusPie = [
        { name: "Pending", value: pendingConsultations },
        { name: "Confirmed", value: confirmedConsultations },
        { name: "Completed", value: completedConsultations },
        { name: "Cancelled", value: cancelledConsultations },
        { name: "No Show", value: noShowConsultations },
      ].filter((r) => r.value > 0);



      // ======================================================
      // LMS PAYMENTS
      // ======================================================

      const [

        successfulCoursePayments,
        pendingCoursePayments,
        failedCoursePayments,

      ] = await Promise.all([

        Payment.count({

          where: {
            status: "success",
          },
        }),

        Payment.count({

          where: {
            status: "pending",
          },
        }),

        Payment.count({

          where: {
            status: "failed",
          },
        }),

      ]);



      const successfulCoursePaymentRows =
        await Payment.findAll({

          where: {
            status: "success",
          },

          attributes: [
            "amount",
          ],
        });



      const totalCourseRevenue =
        successfulCoursePaymentRows.reduce(

          (sum, item) =>

            sum +
            Number(item.amount || 0),

          0
        );

        const [

        totalExamRegistrations,

        submittedExamRegistrations,

        underReviewExamRegistrations,

        processingExamRegistrations,

        completedExamRegistrations,

        rejectedExamRegistrations,

        cancelledExamRegistrations,

      ] = await Promise.all([

        ExamRegistration.count(),

        ExamRegistration.count({
          where: {
            status: "submitted",
          },
        }),

        ExamRegistration.count({
          where: {
            status: "under_review",
          },
        }),

        ExamRegistration.count({
          where: {
            status: "processing",
          },
        }),

        ExamRegistration.count({
          where: {
            status: "completed",
          },
        }),

        ExamRegistration.count({
          where: {
            status: "rejected",
          },
        }),

        ExamRegistration.count({
          where: {
            status: "cancelled",
          },
        }),
      ]);

      const [

      successfulExamPayments,

      pendingExamPayments,

      failedExamPayments,

      refundedExamPayments,

    ] = await Promise.all([

      ExamPayment.count({
        where: {
          status: "success",
        },
      }),

      ExamPayment.count({
        where: {
          status: "pending",
        },
      }),

      ExamPayment.count({
        where: {
          status: "failed",
        },
      }),

      ExamPayment.count({
        where: {
          status: "refunded",
            },
          }),
        ]);

      const successfulExamPaymentRows =
      await ExamPayment.findAll({
        where: {
          status: "success",
        },

        attributes: [
          "amount",
        ],
      });

    const totalExamRevenue =
      successfulExamPaymentRows.reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount || 0
          ),
        0
      );



      // ======================================================
      // GLOBAL REVENUE
      // ======================================================

      const totalRevenue =
              totalHealsRevenue +
              totalCourseRevenue +
              totalExamRevenue;



      const totalSuccessfulPayments =
            successfulHealsPayments +
            successfulCoursePayments +
            successfulExamPayments;

      const totalPendingPayments =
            pendingHealsPayments +
            pendingCoursePayments +
            pendingExamPayments;



      const totalFailedPayments =
            failedHealsPayments +
            failedCoursePayments +
            failedExamPayments;


      const overallPaymentSuccessRate =

        totalSuccessfulPayments +
        totalFailedPayments > 0

          ? (
              (
                totalSuccessfulPayments /

                (
                  totalSuccessfulPayments +
                  totalFailedPayments
                )
              ) * 100
            ).toFixed(2)

          : 0;


          const recentExamRegistrations =
  await ExamRegistration.findAll({

    limit: 5,

    order: [
      ["createdAt", "DESC"],
    ],

    include: [
      {
        model: User,
        as: "applicant",

        attributes: [
          "id",
          "fullName",
          "email",
        ],
      },
    ],
  });

  const registrations =
  await ExamRegistration.findAll({
    attributes: [
      "examType",
    ],
  });

const examMap = {};

registrations.forEach(
  (registration) => {

    examMap[
      registration.examType
    ] =

      (
        examMap[
          registration.examType
        ] || 0
      ) + 1;
  }
);

const examTypeAnalytics =
  Object.entries(examMap)

    .map(
      ([name, total]) => ({
        name,
        total,
      })
    )

    .sort(
      (a, b) =>
        b.total - a.total
    );

      // ======================================================
      // HEALS CONVERSION ANALYTICS
      // ======================================================

      const approvalRate =

        totalApplications > 0

          ? (
              (
                approvedApplications /
                totalApplications
              ) * 100
            ).toFixed(2)

          : 0;



      const completionRate =

        totalApplications > 0

          ? (
              (
                completedApplications /
                totalApplications
              ) * 100
            ).toFixed(2)

          : 0;



      const paymentConversionRate =

        approvedApplications > 0

          ? (
              (
                successfulHealsPayments /
                approvedApplications
              ) * 100
            ).toFixed(2)

          : 0;



      // ======================================================
      // COUNTRY + FIELD ANALYTICS
      // ======================================================

      const applications =
        await HealsApplication.findAll({

          attributes: [

            "desiredCountry",
            "fieldOfStudy",

          ],
        });



      const countryMap = {};
      const fieldMap = {};



      applications.forEach((app) => {

        if (app.desiredCountry) {

          countryMap[
            app.desiredCountry
          ] =

            (countryMap[
              app.desiredCountry
            ] || 0) + 1;
        }



        if (app.fieldOfStudy) {

          fieldMap[
            app.fieldOfStudy
          ] =

            (fieldMap[
              app.fieldOfStudy
            ] || 0) + 1;
        }
      });



      const topCountries =

        Object.entries(countryMap)

          .map(([name, total]) => ({
            name,
            total,
          }))

          .sort(
            (a, b) =>
              b.total - a.total
          )

          .slice(0, 10);



      const topFields =

        Object.entries(fieldMap)

          .map(([name, total]) => ({
            name,
            total,
          }))

          .sort(
            (a, b) =>
              b.total - a.total
          )

          .slice(0, 10);



      // ======================================================
      // RECENT APPLICATIONS
      // ======================================================

      const recentApplications =
        await HealsApplication.findAll({

          limit: 5,

          order: [
            ["createdAt", "DESC"],
          ],

          attributes: [

            "id",
            "fullName",
            "email",
            "status",
            "desiredCountry",
            "createdAt",

          ],
        });



      // ======================================================
      // ARTICLES
      // ======================================================

      const [

        totalArticles,
        publishedArticles,
        featuredArticles,

      ] = await Promise.all([

        Article.count(),

        Article.count({

          where: {
            status: "published",
          },
        }),

        Article.count({

          where: {
            isFeatured: true,
          },
        }),

      ]);



      // ======================================================
      // CAMPAIGNS
      // ======================================================

      const [

        totalCampaigns,
        activeCampaigns,
        featuredCampaigns,
        archivedCampaigns,

      ] = await Promise.all([

        Campaign.count(),

        Campaign.count({

          where: {
            status: "active",
          },
        }),

        Campaign.count({

          where: {
            featured: true,
          },
        }),

        Campaign.count({

          where: {
            status: "archived",
          },
        }),

      ]);



      // ======================================================
      // CAMPAIGN TOTALS
      // ======================================================

      const campaigns =
        await Campaign.findAll({

          attributes: [

            "id",
            "title",
            "views",
            "clicks",

          ],
        });



      const totalCampaignViews =
        campaigns.reduce(

          (sum, c) =>

            sum +
            Number(c.views || 0),

          0
        );



      const totalCampaignClicks =
        campaigns.reduce(

          (sum, c) =>

            sum +
            Number(c.clicks || 0),

          0
        );



      // ======================================================
      // CAMPAIGN REGISTRATIONS
      // ======================================================

      const totalCampaignRegistrations =
        await CampaignRegistration.count();



      const registrationsThisMonth =
        await CampaignRegistration.count({

          where: {

            createdAt: {

              [Op.gte]:
                thirtyDaysAgo,
            },
          },
        });



      // ======================================================
      // CAMPAIGN MESSAGES
      // ======================================================

      const [

        totalCampaignMessages,
        sentMessages,
        scheduledMessages,

      ] = await Promise.all([

        CampaignMessage.count(),

        CampaignMessage.count({

          where: {
            status: "sent",
          },
        }),

        CampaignMessage.count({

          where: {
            status: "scheduled",
          },
        }),

      ]);



      const messages =
        await CampaignMessage.findAll({

          attributes: [

            "successCount",
            "failedCount",
            "totalRecipients",

          ],
        });



      const totalRecipientsReached =
        messages.reduce(

          (sum, m) =>

            sum +
            Number(
              m.totalRecipients || 0
            ),

          0
        );



      const totalSuccess =
        messages.reduce(

          (sum, m) =>

            sum +
            Number(
              m.successCount || 0
            ),

          0
        );



      const totalFailed =
        messages.reduce(

          (sum, m) =>

            sum +
            Number(
              m.failedCount || 0
            ),

          0
        );



      const emailSuccessRate =

        totalSuccess +
        totalFailed > 0

          ? (
              (
                totalSuccess /

                (
                  totalSuccess +
                  totalFailed
                )
              ) * 100
            ).toFixed(2)

          : 0;



      // ======================================================
      // CAMPAIGN CONVERSION RATE
      // ======================================================

      const campaignConversionRate =

        totalCampaignViews > 0

          ? (
              (
                totalCampaignRegistrations /

                totalCampaignViews
              ) * 100
            ).toFixed(2)

          : 0;



      // ======================================================
      // RECENT CAMPAIGN REGISTRATIONS
      // ======================================================

      const recentCampaignRegistrations =
        await CampaignRegistration.findAll({

          limit: 5,

          order: [
            ["createdAt", "DESC"],
          ],

          include: [

            {

              model:
                Campaign,

              as:
                "campaign",

              attributes: [
                "title",
              ],
            },
          ],
        });



      // ======================================================
      // RECENT CAMPAIGN MESSAGES
      // ======================================================

      const recentCampaignMessages =
        await CampaignMessage.findAll({

          limit: 5,

          order: [
            ["createdAt", "DESC"],
          ],

          include: [

            {

              model:
                Campaign,

              as:
                "campaign",

              attributes: [
                "title",
              ],
            },
          ],
        });



      // ======================================================
      // TOP CAMPAIGNS
      // ======================================================

      const topCampaigns =
        await Campaign.findAll({

          limit: 5,

          order: [
            ["views", "DESC"],
          ],

          attributes: [

            "id",
            "title",
            "views",
            "clicks",
            "featured",

          ],
        });



      // ======================================================
      // NOTIFICATIONS
      // ======================================================

      const unreadNotifications =
        await Notification.count({

          where: {
            isRead: false,
          },
        });



      // ======================================================
      // MONTHLY ANALYTICS
      // ======================================================

      const [

        newUsersThisMonth,
        newEnrollmentsThisMonth,
        newApplicationsThisMonth,

      ] = await Promise.all([

        User.count({

          where: {

            createdAt: {

              [Op.gte]:
                thirtyDaysAgo,
            },
          },
        }),

        Enrollment.count({

          where: {

            createdAt: {

              [Op.gte]:
                thirtyDaysAgo,
            },
          },
        }),

        HealsApplication.count({

          where: {

            createdAt: {

              [Op.gte]:
                thirtyDaysAgo,
            },
          },
        }),

      ]);



      // ======================================================
      // RESPONSE
      // ======================================================

      res.status(200).json({

        overview: {

          // USERS
          totalUsers,
          totalStudents,
          totalTutors,
          approvedTutors,

           // USER BREAKDOWN
          totalAdmins,
          totalOperationalAdmins,
          totalReviewers,
          totalAgents,
          totalApplicants,
          verifiedUsers,
          unverifiedUsers,
          activeUsers,
          inactiveUsers,

          // COURSES
          totalCourses,
          publishedCourses,
          totalLessons,
          totalModules,

          // ENROLLMENTS
          totalEnrollments,
          activeEnrollments,

          // SESSIONS
          totalSessions,
          upcomingSessions,
          liveSessions,
          completedSessions,

          // ATTENDANCE
          totalAttendance,

          // HEALS
          totalApplications,
          pendingApplications,
          approvedApplications,
          completedApplications,
          rejectedApplications,
          processingApplications,

          approvalRate,
          completionRate,
          paymentConversionRate,

          // HEALS PAYMENTS
          successfulHealsPayments,
          pendingHealsPayments,
          failedHealsPayments,

          totalHealsRevenue,

          // LMS PAYMENTS
          successfulCoursePayments,
          pendingCoursePayments,
          failedCoursePayments,

          totalCourseRevenue,

          // GLOBAL PAYMENTS
          totalRevenue,

          totalSuccessfulPayments,
          totalPendingPayments,
          totalFailedPayments,

          overallPaymentSuccessRate,

          // ARTICLES
          totalArticles,
          publishedArticles,
          featuredArticles,

          // CAMPAIGNS
          totalCampaigns,
          activeCampaigns,
          featuredCampaigns,
          archivedCampaigns,

          totalCampaignViews,
          totalCampaignClicks,

          totalCampaignRegistrations,
          registrationsThisMonth,

          totalCampaignMessages,
          sentMessages,
          scheduledMessages,

          totalRecipientsReached,
          emailSuccessRate,

          campaignConversionRate,

          // EXAMS

          totalExamRegistrations,

          submittedExamRegistrations,

          underReviewExamRegistrations,

          processingExamRegistrations,

          completedExamRegistrations,

          rejectedExamRegistrations,

          cancelledExamRegistrations,

          successfulExamPayments,

          pendingExamPayments,

          failedExamPayments,

          refundedExamPayments,

          totalExamRevenue,

          // NOTIFICATIONS
          unreadNotifications,


          // CONSULTATIONS
          totalConsultations,
          pendingConsultations,
          confirmedConsultations,
          completedConsultations,
          cancelledConsultations,
          noShowConsultations,

          // CONTACT MESSAGES
          totalContactMessages,
          newContactMessages,
          inProgressContactMessages,
          resolvedContactMessages,
          closedContactMessages,

          // STAFF
          totalStaff,
          publishedStaff,

         

        },



        analytics: {

          newUsersThisMonth,
          newEnrollmentsThisMonth,
          newApplicationsThisMonth,

          topCountries,
          topFields,
          examTypeAnalytics,

          newUsersThisMonth,
          newEnrollmentsThisMonth,
          newApplicationsThisMonth,

          topCountries,
          topFields,
          examTypeAnalytics,

          consultationTypeAnalytics,
          contactCategoryAnalytics,
          staffRoleAnalytics,
          userRoleAnalytics,

           usersPerDay,
          paymentsPerDay,
          examsPerDay,
          sessionsPerDay,
          consultationsPerDay,
          usersPerMonth,

          examStatusPie,
          healsStatusPie,
          paymentStatusPie,
          consultationStatusPie,
        },



        topCampaigns,

        recentApplications,

        recentCampaignRegistrations,

        recentCampaignMessages,
        recentExamRegistrations,
      });

    } catch (err) {

      console.error(
        "Admin Dashboard Error:",
        err
      );

      res.status(500).json({

        message:
          "Failed to load admin dashboard",
      });
    }
  };