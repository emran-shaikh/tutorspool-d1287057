import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ChatBot } from "@/components/ChatBot";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Subjects from "./pages/Subjects";
import FindTutors from "./pages/FindTutors";
import Reviews from "./pages/Reviews";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import TutorDashboard from "./pages/dashboard/TutorDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import BrowseTutors from "./pages/student/BrowseTutors";
import BookSession from "./pages/student/BookSession";
import MySessions from "./pages/student/MySessions";
import LearningGoals from "./pages/student/LearningGoals";
import TutorSessions from "./pages/tutor/TutorSessions";
import TutorAvailability from "./pages/tutor/TutorAvailability";
import EditTutorProfile from "./pages/tutor/EditTutorProfile";
import ManageUsers from "./pages/admin/ManageUsers";
import SessionMonitoring from "./pages/admin/SessionMonitoring";
import Reports from "./pages/admin/Reports";
import ManageBlogs from "./pages/admin/ManageBlogs";
import BlogEditor from "./pages/admin/BlogEditor";
import NotFound from "./pages/NotFound";

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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/tutors" element={<FindTutors />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
            <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
            
            {/* Student Routes */}
            <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/tutors" element={<ProtectedRoute allowedRoles={['student']}><BrowseTutors /></ProtectedRoute>} />
            <Route path="/student/book/:tutorId" element={<ProtectedRoute allowedRoles={['student']}><BookSession /></ProtectedRoute>} />
            <Route path="/student/sessions" element={<ProtectedRoute allowedRoles={['student']}><MySessions /></ProtectedRoute>} />
            <Route path="/student/goals" element={<ProtectedRoute allowedRoles={['student']}><LearningGoals /></ProtectedRoute>} />
            
            {/* Tutor Routes */}
            <Route path="/tutor/dashboard" element={<ProtectedRoute allowedRoles={['tutor']}><TutorDashboard /></ProtectedRoute>} />
            <Route path="/tutor/sessions" element={<ProtectedRoute allowedRoles={['tutor']}><TutorSessions /></ProtectedRoute>} />
            <Route path="/tutor/availability" element={<ProtectedRoute allowedRoles={['tutor']}><TutorAvailability /></ProtectedRoute>} />
            <Route path="/tutor/profile" element={<ProtectedRoute allowedRoles={['tutor']}><EditTutorProfile /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><ManageUsers /></ProtectedRoute>} />
            <Route path="/admin/sessions" element={<ProtectedRoute allowedRoles={['admin']}><SessionMonitoring /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />
            <Route path="/admin/blogs" element={<ProtectedRoute allowedRoles={['admin']}><ManageBlogs /></ProtectedRoute>} />
            <Route path="/admin/blogs/new" element={<ProtectedRoute allowedRoles={['admin']}><BlogEditor /></ProtectedRoute>} />
            <Route path="/admin/blogs/edit/:id" element={<ProtectedRoute allowedRoles={['admin']}><BlogEditor /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatBot />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
