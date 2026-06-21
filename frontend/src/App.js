import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentProfile from "./pages/StudentProfile";
import StudentDashboard from "./pages/StudentDashboard";
import CourseCatalog from "./pages/CourseCatalog";
import CourseDetail from "./pages/CourseDetail";
import PaymentCallback from "./pages/PaymentCallback";
import AdminCourses from "./pages/AdminCourses";
import AdminCourseModules from "./pages/AdminCourseModules";
import AdminLessons from "./pages/AdminLessons";
import StudentCourseLearning from "./pages/StudentCourseLearning";
import HealsApplicationForm
from "./pages/HealsApplicationForm";

import HealsApplicationDetails
from "./pages/HealsApplicationDetails";

import HealsApplications
from "./pages/HealsApplications";

import AdminTutorAssignments
from "./pages/AdminTutorAssignments";
import LiveClassroom from "./pages/LiveClassroom";
import TutorLiveClasses from "./pages/TutorLiveClasses";
import StudentLiveClasses from "./pages/StudentLiveClasses";
import TutorProfilePage from "./pages/TutorProfilePage";
import TutorDashboard from "./pages/TutorDashboard";
import AdminTutorKyc from "./pages/AdminTutorKyc";
import AdminTutorKycDetails from "./pages/AdminTutorKycDetails";
import PublicArticlesUsers from "./pages/PublicArticlesUsers";
import PublicArticleDetailsUsers from "./pages/PublicArticleDetailsUser";
import PublicArticleDetails from "./pages/PublicArticleDetails";
import PublicArticles from "./pages/PublicArticles";
import CreateArticle from "./pages/CreateArticle";
import EditArticle from "./pages/EditArticle";
import AdminArticleDetails from "./pages/AdminArticleDetails";
import AdminArticles from "./pages/AdminArticles";
import CampaignList
from "./pages/CampaignList";

import CreateCampaign
from "./pages/CreateCampaign";

import EditCampaign
from "./pages/EditCampaign";

import CampaignDetails
from "./pages/CampaignDetails";

import CampaignMessages
from "./pages/CampaignMessages";

import CampaignAnalytics
from "./pages/CampaignAnalytics";

import CampaignRegistrationModal
from "./pages/CampaignRegistrationModal";

import CampaignRegistrations
from "./pages/CampaignRegistrations";
import CampaignRegistrationAnalytics
from "./pages/CampaignRegistrationAnalytics";

import PublicCampaigns
from "./pages/PublicCampaigns";

import PublicCampaignDetails
from "./pages/PublicCampaignDetails";

import AdminDashboard
from "./pages/AdminDashboard";

import AdminLayout from "./layouts/AdminLayout";

import ActivityLogs
from "./pages/ActivityLogs";

import UserManagement
from "./pages/UserManagement";

import AdminHealsDashboard
from "./pages/AdminHealsDashboard";

import AdminHealsApplications
from "./pages/AdminHealsApplications";

import AdminHealsApplicationDetails
from "./pages/AdminHealsApplicationDetails";
import ExamCatalog from "./pages/exams/ExamCatalog";
import DynamicExamRegistrationPage from "./pages/exams/DynamicExamRegistrationPage";
import ExamPaymentCallback from "./pages/exams/ExamPaymentCallback";
import MyExamRegistrations from "./pages/exams/MyExamRegistrations";
import RegistrationDetailsPage from "./pages/exams/RegistrationDetailsPage";
import ExamDashboard from "./pages/admin/AdminExamRegDashboard";
import ExamRegistrations from "./pages/admin/AdminExamRegistrations"
import AdminExamRegistrationDetails from "./pages/admin/AdminExamRegistrationDetails"
import ExamPayments from "./pages/admin/ExamPayments"
import ExamPaymentDetails from "./pages/admin/ExamPaymentDetails";
import ExamStats from "./pages/admin/ExamStats";
import ExportRegistrations from "./pages/admin/ExportRegistrations"


// (Optional later)
// import Dashboard from "./pages/Dashboard";
// import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Navbar always visible */}
        <Navbar />

        <Routes>
          {/* Public routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />


          <Route
            path="/student/profile"
            element={
              <ProtectedRoute>
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tutor/profile"
            element={
              <ProtectedRoute>
                <TutorProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutor/dashboard"
            element={
              <ProtectedRoute>
                <TutorDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/student/dashboard" 
          element={<ProtectedRoute>
            <StudentDashboard  /> 
          </ProtectedRoute>} />

        <Route
          path="/admin/dashboard"
          element={

            <AdminLayout>

              <AdminDashboard />

            </AdminLayout>
          }
        />

          <Route path="/courses" element={<CourseCatalog />} />

          <Route path="/courses/:id" element={<CourseDetail />} />
            <Route
            path="/learn/:courseId"
            element={
              <ProtectedRoute>
                <StudentCourseLearning />
              </ProtectedRoute>
            }
          />

          <Route path="/payment/callback"   
          element={ <ProtectedRoute><PaymentCallback /></ProtectedRoute>} />

          <Route

            path="/admin/users"

            element={

              <AdminLayout>

                <UserManagement />

              </AdminLayout>
            }
          />

          <Route
            path="/admin/tutor-kyc"
            element={
              <AdminLayout>
                <AdminTutorKyc />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/tutor-kyc/:id"
            element={
              <AdminLayout>
                <AdminTutorKycDetails />
              </AdminLayout>
            }
          />
          <Route path="/admin/add-courses" 
          element={<AdminLayout><AdminCourses /></AdminLayout>} />
          <Route
              path="/admin/courses/:courseId/modules"
              element={
                <AdminLayout>
                  <AdminCourseModules />
                </AdminLayout>
              }
            />

            <Route
              path="/admin/modules/:moduleId/lessons"
              element={
               <AdminLayout>
                  <AdminLessons />
                </AdminLayout>
              }
            />
            <Route
            path="/admin/tutor-assignments"
            element={
              <AdminLayout>
                <AdminTutorAssignments />
              </AdminLayout>
            }
          />
                    
          <Route
            path="/heals/apply"
            element={
              <ProtectedRoute>
                <HealsApplicationForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/heals/my-applications"
            element={
              <ProtectedRoute>
                <HealsApplications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/heals/application/:id"
            element={
              <ProtectedRoute>
                <HealsApplicationDetails />
              </ProtectedRoute>
            }
          />


          <Route
  path="/admin/heals/dashboard"
  element={
    <AdminLayout>
      <AdminHealsDashboard />
    </AdminLayout>
  }
/>

<Route
  path="/admin/heals/applications"
  element={
    <AdminLayout>
      <AdminHealsApplications />
    </AdminLayout>
  }
/>

<Route
  path="/admin/heals/applications/:id"
  element={
    <AdminLayout>
      <AdminHealsApplicationDetails />
    </AdminLayout>
  }
/>



          <Route
          path="/student/live-classes"
          element={
            <ProtectedRoute>
              <StudentLiveClasses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tutor/live-classes"
          element={
            <ProtectedRoute>
              <TutorLiveClasses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/live/:roomName/:sessionId"
          element={
            <ProtectedRoute>
              <LiveClassroom />
            </ProtectedRoute>
          }
        />

        <Route
          path="/articles"
          element={<PublicArticlesUsers />}
        />

        <Route
          path="/articles/:slug"
          element={<PublicArticleDetailsUsers />}
        />

        <Route
          path="/admin/cms/articles"
          element={
           <AdminLayout>
              <AdminArticles />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/cms/articles/create"
          element={
            <AdminLayout>
              <CreateArticle />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/cms/articles/:id"
          element={
            <AdminLayout>
              <AdminArticleDetails />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/cms/articles/:id/edit"
          element={
            <AdminLayout>
              <EditArticle />
            </AdminLayout>
          }
        />

       <Route
  path="/admin/campaigns"
  element={
    <AdminLayout>
      <CampaignList />
    </AdminLayout>
  }
/>

<Route
  path="/admin/campaigns/create"
  element={
    <AdminLayout>
      <CreateCampaign />
    </AdminLayout>
  }
/>

<Route
  path="/admin/campaigns/:id"
  element={
    <AdminLayout>
      <CampaignDetails />
    </AdminLayout>
  }
/>

<Route
  path="/admin/campaigns/:id/edit"
  element={
    <AdminLayout>
      <EditCampaign />
    </AdminLayout>
  }
/>

<Route
  path="/admin/campaigns/:id/messages"
  element={
    <AdminLayout>
      <CampaignMessages />
    </AdminLayout>
  }
/>

<Route
  path="/admin/campaigns/:id/registrations"
  element={
    <AdminLayout>
      <CampaignRegistrations />
    </AdminLayout>
  }
/>

<Route
  path="/admin/campaigns/:id/registration-analytics"
  element={
    <AdminLayout>
      <CampaignRegistrationAnalytics />
    </AdminLayout>
  }
/>
<Route
  path="/campaigns"
  element={<PublicCampaigns />}
/>

<Route
  path="/campaigns/:id"
  element={<PublicCampaignDetails />}
/>

<Route

  path="/admin/activity-logs"

  element={

    <AdminLayout>

      <ActivityLogs />

    </AdminLayout>
  }
/>
        {/* student/applicant frontend route */}
        <Route
          path="/exam-catalog"
          element={<ExamCatalog />}
        />

        <Route
          path="/exam-register/:examType"
          element={
            <DynamicExamRegistrationPage />
          }
        />

          <Route
            path="/exam-payment/callback"
            element={
              <ExamPaymentCallback />
            }
          />

          <Route
            path="/my-exam-registrations"
            element={<MyExamRegistrations />}
          />

          <Route
            path="/exam-registrations/:id"
            element={
              <RegistrationDetailsPage />
            }
          />
          {/* admin exams reg section */}
          <Route
            path="/admin/exams"
            element={<AdminLayout><ExamDashboard /></AdminLayout>}
          />
          <Route
            path="/admin/exams/registrations"
            element={<AdminLayout><ExamRegistrations /></AdminLayout>}
          />
          <Route
          path="/admin/exams/registrations/:id"
          element={<AdminLayout><AdminExamRegistrationDetails /></AdminLayout>}
        />
        <Route
          path="/admin/exams/payments"
          element={<AdminLayout><ExamPayments /></AdminLayout>}
        />
        <Route
          path="/admin/exams/payments/:id"
          element={<AdminLayout><ExamPaymentDetails /></AdminLayout>}
        />
        <Route
          path="/admin/exams/stats"
          element={<AdminLayout><ExamStats /></AdminLayout>}
        />
        <Route
          path="/admin/exams/export"
          element={
            <AdminLayout><ExportRegistrations /></AdminLayout>
          }
        />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;