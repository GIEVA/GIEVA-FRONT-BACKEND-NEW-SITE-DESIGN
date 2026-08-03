import UserModel from './user.js';
import TutorProfileModel from './tutorProfile.js';
import CourseModel from './course.js';
import ClassSessionModel from './classSession.js';
import SessionAttendanceModel from './sessionAttendance.js';
import ActivityLogModel from './activityLog.js';
import EnrollmentModel from './enrollment.js';
import StudentProfileModel from './StudentProfile.js';
import QuizModel from './Quiz.js';
import QuizAnswerModel from './QuizAnswer.js';
import QuizAttemptModel from './QuizAttempt.js';
import QuestionModel from './Question.js';
import sequelize from '../config/db.js';
import PaymentModel from './Payment.js';
import CourseModuleModel from './CourseModule.js';
import LessonModel from './Lesson.js';
import LessonProgressModel from './LessonProgress.js';
import SessionEventLogModel from './SessionEventLog.js';
import CampaignRegistrationModel from './CampaignRegistration.js';
import CampaignModel from './Campaign.js';
import NotificationModel from './Notification.js';
import HealsApplicationModel from './HealsApplication.js';
import ApplicationDocumentModel from './ApplicationDocument.js';
import ApplicationMessageModel from './ApplicationMessage.js';
import ArticleModel from './artticleModel.js';
import CampaignMessageModel from './CampaignMessage.js';
import SupportTicketModel from './SupportTicket.js';
import TicketAttachmentModel from './TicketAttachment.js';
import TicketReplyModel from './TicketReply.js';
import { DataTypes } from "sequelize";
import HealsPaymentModel from "./HealsPayment.js";
import TutorStudentModel from './TutorStudent.js';
import ExamPaymentModel from './ExamRegistrationPaymentModel.js'
import ExamRegistrationModel from './ExamRegistrationModel.js'
import ExamRegistrationCommentModel from './ExamRegistrationComment.js'
import SessionWaitingRoomModel from './SessionWaitingRoom.js'
import ExamTypeModel from './ExamType.js';
import ContactMessageModel from './ContactMessage.js';
import ServiceModel from './Service.js';
import ConsultationBookingModel from './ConsultationBooking.js';
import StaffModel from './Staff.js';
import ProgramModel from './Program.js';
import HistoryPageModel from './HistoryPage.js';
import PartnerModel from './Partner.js';
import FaqModel from './Faq.js';



// Init models
const User = UserModel(sequelize, DataTypes);
const TutorProfile = TutorProfileModel(sequelize, DataTypes);
const Course = CourseModel(sequelize, DataTypes);
const ClassSession = ClassSessionModel(sequelize, DataTypes);
const SessionAttendance = SessionAttendanceModel(sequelize, DataTypes);
const ActivityLog = ActivityLogModel(sequelize, DataTypes);
const Enrollment = EnrollmentModel(sequelize, DataTypes);
const StudentProfile = StudentProfileModel(sequelize, DataTypes);
const Quiz = QuizModel(sequelize, DataTypes);
const QuizAnswer = QuizAnswerModel(sequelize, DataTypes);
const QuizAttempt = QuizAttemptModel(sequelize, DataTypes);
const Question = QuestionModel(sequelize, DataTypes);
const Payment = PaymentModel(sequelize, DataTypes);
const CourseModule = CourseModuleModel(sequelize, DataTypes);
const Lesson = LessonModel(sequelize, DataTypes);
const LessonProgress = LessonProgressModel(sequelize, DataTypes);
const SessionEventLog = SessionEventLogModel(sequelize, DataTypes);
const Campaign = CampaignModel(sequelize, DataTypes);
const CampaignRegistration = CampaignRegistrationModel(sequelize, DataTypes);
const Notification = NotificationModel(sequelize, DataTypes);
const HealsApplication = HealsApplicationModel(sequelize, DataTypes);
const ApplicationDocument = ApplicationDocumentModel(sequelize, DataTypes);
const ApplicationMessage = ApplicationMessageModel(sequelize, DataTypes);
const Article = ArticleModel(sequelize, DataTypes);
const CampaignMessage = CampaignMessageModel(sequelize, DataTypes);
const SupportTicket = SupportTicketModel(sequelize, DataTypes);
const TicketAttachment = TicketAttachmentModel(sequelize, DataTypes);
const TicketReply = TicketReplyModel(sequelize, DataTypes);
const HealsPayment = HealsPaymentModel(sequelize);
const TutorStudent = TutorStudentModel(sequelize);
const ExamPayment = ExamPaymentModel(sequelize)
const ExamRegistration = ExamRegistrationModel(sequelize)
const ExamRegistrationComment = ExamRegistrationCommentModel(sequelize)
const SessionWaitingRoom = SessionWaitingRoomModel(sequelize)
const ExamType = ExamTypeModel(sequelize)
const ContactMessage = ContactMessageModel(sequelize)
const Service = ServiceModel(sequelize)
const ConsultationBooking = ConsultationBookingModel(sequelize)
const Staff = StaffModel(sequelize)
const Program = ProgramModel(sequelize)
const HistoryPage = HistoryPageModel(sequelize)
const Partner = PartnerModel(sequelize)
const Faq = FaqModel(sequelize)

// Collect models
export const models = {
  User,
  TutorProfile,
  Course,
  ClassSession,
  SessionAttendance,
  ActivityLog,
  Enrollment,
  StudentProfile,
  Quiz,
  Question,
  QuizAttempt,
  QuizAnswer,
  Payment,

  CourseModule,
  Lesson,
  LessonProgress,
  SessionEventLog,
  Campaign,
  CampaignRegistration,
  Notification,
  HealsApplication,
  HealsPayment,
  ApplicationDocument,
  ApplicationMessage,
  Article,
  CampaignMessage,
  SupportTicket,
  TicketAttachment,
  TicketReply,
  TutorStudent,
  ExamPayment,
  ExamRegistration,
  ExamRegistrationComment,
  ExamType,
  SessionWaitingRoom,
  ContactMessage,
  Service,
  ConsultationBooking,
  Staff,
  Program,
  HistoryPage,
  Partner,
  Faq,
};

// Run associations
Object.values(models).forEach(model => {
  if (model.associate) model.associate(models);
});

export default models;
