import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

import { sequelize, testConnection } from "./config/db.js";

import registerUserRoute from "./routes/registerUserRoutes.js";
import studentProfileRoutes from "./routes/studentProfileRoutes.js";
import tutorProfileRouter from "./routes/tutorProfileRouter.js";
import quizRoutes from "./routes/quizRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import moduleRoute from "./routes/moduleRoutes.js";
import livekitRoutes from "./routes/livekitRoutes.js";
import lessonRoutes from "./routes/lessonRoute.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import courseroutes from "./routes/courseRoutes.js";
import classSessionRoutes from "./routes/classSessionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import tutorPrivilegeRoutes from "./routes/tutorPrivilegeRoutes.js";
import studentDashboardroutes from "./routes/studentDashboard.routes.js"
import healsApplicationRoutes from "./routes/healsApplicationRoutes.js"
import studentCourseRoutes from "./routes/studentCourseRoutes.js";
import adminTutorAssignmentRoutes from "./routes/adminTutorAssignmentRoutes.js";
import adminTutorKycRoutes from "./routes/adminTutorKycRoutes.js";
// 🔴 VERY IMPORTANT — load all models
import "./models/index.js";
import { startCampaignAutoCloseJob } from "./jobs/campaignAutoClose.js";
import { startEmailScheduler } from "./jobs/emailScheduler.js";
import {
  startSessionReminderCron,
} from "./jobs/sessionReminder.service.js";

import tutorDashboardRoutes
from "./routes/tutorDashboard.routes.js";
import publicArticleRoutes
from "./routes/publicArticleRoutes.js";
import adminArticleRoutes
from "./routes/adminArticleRoutes.js";

import adminDashboardRoutes
from "./routes/adminDashboard.routes.js";

import {

  startCampaignEmailScheduler,

} from "./jobs/campaignEmailScheduler.js";

import campaignRoutes
from "./routes/campaignRoutes.js";

import campaignMessageRoutes
from "./routes/campaignMessageRoutes.js";

import campaignRegistrationRoutes
from "./routes/campaignRegistrationRoutes.js";

import adminCampaignRegistrationRoutes
from "./routes/adminCampaignRegistrationRoutes.js";

import userGetCampaignRoutes
from "./routes/userGetCampaignRoutes.js";

import adminUserRoutes
from "./routes/adminUserRoutes.js";
import examRegistrationRoutes
from "./routes/examRegistration.routes.js";

import examPaymentRoutes
from "./routes/examPayment.routes.js";
import adminExamRegistrationRoutes
from "./routes/adminExamRegistration.routes.js";
import adminPaymentROutes from './routes/adminPaymentRoutes.js'

import adminClassSessionRoutes from "./routes/adminClassSessionRoutes.js"
import adminExamTypeRoutes from "./routes/adminExamTypeRoutes.js"
import corsConfig from "./middleware/corsConfig.js";
import contactRoutes from "./routes/contactRoutes.js";
import adminContactMessageRoutes from "./routes/adminContactMessageRoutes.js";
import serviceRoutes from "./routes/service.routes.js";
import adminServiceRoutes from "./routes/adminService.routes.js"
 import { startConsultationReminderJob } from "./jobs/consultationReminder.js";
 import consultationRoutes from "./routes/consultationRoutes.js";
 import adminConsultancyRoutes from "./routes/adminConsultancyRoutes.js"
 import staffRoutes from "./routes/staff.routes.js";
import adminStaffRoutes from "./routes/adminStaff.routes.js";
import programRoutes from "./routes/program.routes.js";
import adminProgramRoutes from "./routes/adminProgram.routes.js";
import historyRoutes from "./routes/history.routes.js";
import adminHistoryRoutes from "./routes/adminHistory.routes.js";
import partnerRoutes from "./routes/partner.routes.js";
import adminPartnerRoutes from "./routes/adminPartner.routes.js";
import adminFaqRoutes from "./routes/adminFaq.routes.js"
import faqRoutes from "./routes/faq.routes.js"
import adminProjectRoutes from "./routes/adminProject.routes.js"
import projectRoutes from "./routes/project.routes.js"






dotenv.config({
  path: "./.env",
});

const app = express();
const PORT = process.env.PORT || 5000;

// app.use(cors({
//   origin: "http://localhost:3000",
//   credentials: true,
// }));


corsConfig(app);

startSessionReminderCron();
startConsultationReminderJob();
startCampaignAutoCloseJob();
startCampaignEmailScheduler();
startEmailScheduler();


app.use(bodyParser.json());
app.use(express.json());

const startServer = async () => {
  try {
    await testConnection(); // test DB connection

app.use((req, res, next) => {
  console.log(req.method, req.originalUrl);
  next();
});

    // Routes
app.use("/api/service", serviceRoutes);
app.use(
  "/api/campaigns",
  campaignRoutes
);
app.use('/api/users', registerUserRoute);
app.use('/api', studentProfileRoutes);
app.use('/api/tutor', tutorProfileRouter);
app.use('/api/modules', moduleRoute);
app.use('/api/session', classSessionRoutes);
app.use('/api/admin', courseroutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', livekitRoutes);
app.use('/api', quizRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api', enrollmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', tutorPrivilegeRoutes);
app.use('/api', studentDashboardroutes);
app.use("/api/student", studentCourseRoutes);
app.use("/api/applicant", healsApplicationRoutes);
app.use(
  "/api/admin/tutor-assignments",
  adminTutorAssignmentRoutes
);
app.use(
  "/api/admin/tutor-kyc",
  adminTutorKycRoutes
);

app.use(
  "/api/tutor",
  tutorDashboardRoutes
);
app.use(
  "/api/public",
  publicArticleRoutes
);

app.use(
  "/api/admin/cms",
  adminArticleRoutes
);

app.use(
  "/api/admin/dashboard",
  adminDashboardRoutes
);



app.use(
  "/api/campaign-messages",
  campaignMessageRoutes
);

app.use(
  "/api/campaign-registrations",
  campaignRegistrationRoutes
);

app.use(
  "/api/admin/campaign-registrations",
  adminCampaignRegistrationRoutes
);

// app.use(
//   "/api/campaigns",
//   campaignRoutes
// );

app.use(
  "/api/user/campaigns",
  userGetCampaignRoutes
);

app.use(
  "/api/admin",
  adminUserRoutes
);

app.use(
"/api/exam-registrations",
examRegistrationRoutes
);

app.use(
"/api/exam-payments",
examPaymentRoutes
);

// app.use(
// "/api/exam-types",
// adminExamTypeRoutes
// );

app.use(
  "/admin",
  adminExamRegistrationRoutes
);
app.use(
  "/api/exam-types/catalog",
  adminExamTypeRoutes
);
app.use("/admin/live-session",  adminClassSessionRoutes)
app.use("/admin/get-payments",  adminPaymentROutes)


app.use("/api/contact", contactRoutes);
app.use("/api/admin/contacts", adminContactMessageRoutes);


app.use("/api/admin/service", adminServiceRoutes);

app.use("/api/consultations", consultationRoutes);
app.use("/api/consultations/admin", adminConsultancyRoutes);



app.use("/api/staff/all", staffRoutes);
app.use("/api/admin/staff", adminStaffRoutes);



app.use("/api/programs/all", programRoutes);
app.use("/api/admin/programs", adminProgramRoutes);



app.use("/api/gieva/history/all", historyRoutes);
app.use("/api/admin/gieva/history", adminHistoryRoutes);

app.use("/api/partners/all", partnerRoutes);
app.use("/api/admin/partners/all", adminPartnerRoutes);

app.use("/api/admin/faqs", adminFaqRoutes);
app.use("/api/faqs/all", faqRoutes);

app.use("/api/admin/projects/all", adminProjectRoutes);
app.use("/api/projects/all", projectRoutes);

    // Sync models AFTER models are loaded
    await sequelize.sync({alter:true});
    console.log("🚀 Sequelize models synced");

    app.listen(PORT , () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server start failed:", error);
  }
};

startServer();
