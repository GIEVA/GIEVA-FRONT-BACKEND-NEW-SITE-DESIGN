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

import adminClassSessionRoutes from "./routes/adminClassSessionRoutes.js"

dotenv.config({
  path: "./.env",
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

startSessionReminderCron();

startCampaignAutoCloseJob();
startCampaignEmailScheduler();
startEmailScheduler();


app.use(bodyParser.json());
app.use(express.json());

const startServer = async () => {
  try {
    await testConnection(); // test DB connection



    // Routes
app.use('/api', registerUserRoute);
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
  "/api/campaigns",
  campaignRoutes
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

app.use(
  "/api/campaigns",
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

app.use(
  "/admin",
  adminExamRegistrationRoutes
);

app.use("/admin/live-session",  adminClassSessionRoutes)

    // Sync models AFTER models are loaded
    await sequelize.sync({alter: true});
    console.log("🚀 Sequelize models synced");

    app.listen(PORT , () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server start failed:", error);
  }
};

startServer();
