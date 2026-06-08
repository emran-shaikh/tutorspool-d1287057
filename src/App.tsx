import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ChatBot } from "@/components/ChatBot";
import { VoiceAgent } from "@/components/VoiceAgent";
import Index from "./pages/Index";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieConsent } from "@/components/CookieConsent";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

// Lazy-loaded routes — keeps initial JS bundle small (better LCP/INP)
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Subjects = lazy(() => import("./pages/Subjects"));
const FindTutors = lazy(() => import("./pages/FindTutors"));
const Reviews = lazy(() => import("./pages/Reviews"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const StudentDashboard = lazy(() => import("./pages/dashboard/StudentDashboard"));
const TutorDashboard = lazy(() => import("./pages/dashboard/TutorDashboard"));
const AdminDashboard = lazy(() => import("./pages/dashboard/AdminDashboard"));
const BrowseTutors = lazy(() => import("./pages/student/BrowseTutors"));
const BookSession = lazy(() => import("./pages/student/BookSession"));
const MySessions = lazy(() => import("./pages/student/MySessions"));
const LearningGoals = lazy(() => import("./pages/student/LearningGoals"));
const StudentQuizzes = lazy(() => import("./pages/student/StudentQuizzes"));
const TakeQuiz = lazy(() => import("./pages/student/TakeQuiz"));
const QuizResults = lazy(() => import("./pages/student/QuizResults"));
const TutorSessions = lazy(() => import("./pages/tutor/TutorSessions"));
const TutorAvailability = lazy(() => import("./pages/tutor/TutorAvailability"));
const EditTutorProfile = lazy(() => import("./pages/tutor/EditTutorProfile"));
const ManageQuizzes = lazy(() => import("./pages/tutor/ManageQuizzes"));
const CreateQuiz = lazy(() => import("./pages/tutor/CreateQuiz"));
const QuizDetail = lazy(() => import("./pages/tutor/QuizDetail"));
const EditStudentProfile = lazy(() => import("./pages/student/EditStudentProfile"));
const ManageUsers = lazy(() => import("./pages/admin/ManageUsers"));
const SessionMonitoring = lazy(() => import("./pages/admin/SessionMonitoring"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const ManageBlogs = lazy(() => import("./pages/admin/ManageBlogs"));
const BlogEditor = lazy(() => import("./pages/admin/BlogEditor"));
const ManageAnnouncements = lazy(() => import("./pages/admin/ManageAnnouncements"));
const AdminEditTutor = lazy(() => import("./pages/admin/AdminEditTutor"));
const AdminEditStudent = lazy(() => import("./pages/admin/AdminEditStudent"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const Careers = lazy(() => import("./pages/Careers"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const SharedQuizResults = lazy(() => import("./pages/SharedQuizResults"));
const Achievements = lazy(() => import("./pages/student/Achievements"));
const ParentDashboard = lazy(() => import("./pages/dashboard/ParentDashboard"));
const LinkChild = lazy(() => import("./pages/parent/LinkChild"));
const ChildProgress = lazy(() => import("./pages/parent/ChildProgress"));
const EditParentProfile = lazy(() => import("./pages/parent/EditParentProfile"));
const ParentNotifications = lazy(() => import("./pages/parent/ParentNotifications"));
const NotificationPreferences = lazy(() => import("./pages/parent/NotificationPreferences"));
const VisitorAnalytics = lazy(() => import("./pages/admin/VisitorAnalytics"));
const ManageConnections = lazy(() => import("./pages/admin/ManageConnections"));
const MyStudents = lazy(() => import("./pages/tutor/MyStudents"));
const MyTutors = lazy(() => import("./pages/student/MyTutors"));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to={`/${userProfile.role}/dashboard`} replace />;
  }

  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user && userProfile) {
    return <Navigate to={`/${userProfile.role}/dashboard`} replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <AnalyticsTracker />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/subjects" element={<Subjects />} />
                <Route path="/tutors" element={<FindTutors />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/disclaimer" element={<Disclaimer />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/results/:resultId" element={<SharedQuizResults />} />
                <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
                <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
                <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />

                {/* Student Routes */}
                <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
                <Route path="/student/tutors" element={<ProtectedRoute allowedRoles={['student']}><BrowseTutors /></ProtectedRoute>} />
                <Route path="/student/book/:tutorId" element={<ProtectedRoute allowedRoles={['student']}><BookSession /></ProtectedRoute>} />
                <Route path="/student/sessions" element={<ProtectedRoute allowedRoles={['student']}><MySessions /></ProtectedRoute>} />
                <Route path="/student/goals" element={<ProtectedRoute allowedRoles={['student']}><LearningGoals /></ProtectedRoute>} />
                <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['student']}><EditStudentProfile /></ProtectedRoute>} />
                <Route path="/student/quizzes" element={<ProtectedRoute allowedRoles={['student']}><StudentQuizzes /></ProtectedRoute>} />
                <Route path="/student/quiz/:quizId" element={<ProtectedRoute allowedRoles={['student']}><TakeQuiz /></ProtectedRoute>} />
                <Route path="/student/quiz/:quizId/results" element={<ProtectedRoute allowedRoles={['student']}><QuizResults /></ProtectedRoute>} />
                <Route path="/student/achievements" element={<ProtectedRoute allowedRoles={['student']}><Achievements /></ProtectedRoute>} />
                <Route path="/student/tutors-connected" element={<ProtectedRoute allowedRoles={['student']}><MyTutors /></ProtectedRoute>} />

                {/* Tutor Routes */}
                <Route path="/tutor/dashboard" element={<ProtectedRoute allowedRoles={['tutor']}><TutorDashboard /></ProtectedRoute>} />
                <Route path="/tutor/sessions" element={<ProtectedRoute allowedRoles={['tutor']}><TutorSessions /></ProtectedRoute>} />
                <Route path="/tutor/availability" element={<ProtectedRoute allowedRoles={['tutor']}><TutorAvailability /></ProtectedRoute>} />
                <Route path="/tutor/profile" element={<ProtectedRoute allowedRoles={['tutor']}><EditTutorProfile /></ProtectedRoute>} />
                <Route path="/tutor/quizzes" element={<ProtectedRoute allowedRoles={['tutor']}><ManageQuizzes /></ProtectedRoute>} />
                <Route path="/tutor/quizzes/create" element={<ProtectedRoute allowedRoles={['tutor']}><CreateQuiz /></ProtectedRoute>} />
                <Route path="/tutor/quizzes/:quizId" element={<ProtectedRoute allowedRoles={['tutor']}><QuizDetail /></ProtectedRoute>} />
                <Route path="/tutor/students" element={<ProtectedRoute allowedRoles={['tutor']}><MyStudents /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><ManageUsers /></ProtectedRoute>} />
                <Route path="/admin/sessions" element={<ProtectedRoute allowedRoles={['admin']}><SessionMonitoring /></ProtectedRoute>} />
                <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />
                <Route path="/admin/blogs" element={<ProtectedRoute allowedRoles={['admin']}><ManageBlogs /></ProtectedRoute>} />
                <Route path="/admin/blogs/new" element={<ProtectedRoute allowedRoles={['admin']}><BlogEditor /></ProtectedRoute>} />
                <Route path="/admin/blogs/edit/:id" element={<ProtectedRoute allowedRoles={['admin']}><BlogEditor /></ProtectedRoute>} />
                <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={['admin']}><ManageAnnouncements /></ProtectedRoute>} />
                <Route path="/admin/users/tutor/:uid" element={<ProtectedRoute allowedRoles={['admin']}><AdminEditTutor /></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><VisitorAnalytics /></ProtectedRoute>} />
                <Route path="/admin/users/student/:uid" element={<ProtectedRoute allowedRoles={['admin']}><AdminEditStudent /></ProtectedRoute>} />
                <Route path="/admin/connections" element={<ProtectedRoute allowedRoles={['admin']}><ManageConnections /></ProtectedRoute>} />

                {/* Parent Routes */}
                <Route path="/parent/dashboard" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
                <Route path="/parent/link-child" element={<ProtectedRoute allowedRoles={['parent']}><LinkChild /></ProtectedRoute>} />
                <Route path="/parent/progress/:childId" element={<ProtectedRoute allowedRoles={['parent']}><ChildProgress /></ProtectedRoute>} />
                <Route path="/parent/profile" element={<ProtectedRoute allowedRoles={['parent']}><EditParentProfile /></ProtectedRoute>} />
                <Route path="/parent/notifications" element={<ProtectedRoute allowedRoles={['parent']}><ParentNotifications /></ProtectedRoute>} />
                <Route path="/parent/notification-preferences" element={<ProtectedRoute allowedRoles={['parent']}><NotificationPreferences /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <ChatBot />
            <VoiceAgent />
            <CookieConsent />
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
