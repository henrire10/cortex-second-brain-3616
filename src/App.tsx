
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { GamificationToast } from "@/components/GamificationToast";
// Auto-execute Suzana workout approval
import "@/utils/executeSuzanaApproval";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ProfileSetup from "./pages/ProfileSetup";
import WorkoutGeneration from "./pages/WorkoutGeneration";
import PersonalLogin from "./pages/PersonalLogin";
import PersonalDashboard from "./pages/PersonalDashboard";
import PersonalPaymentHistory from "./pages/PersonalPaymentHistory";
import PersonalReview from "./pages/PersonalReview";
import PlanReview from "./pages/PlanReview";
import AdminPanel from "./pages/AdminPanel";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminUserDetail from "./pages/AdminUserDetail";
import AdminPersonalDetail from "./pages/AdminPersonalDetail";
import AdminApprovals from "./pages/AdminApprovals";
import AdminPayments from "./pages/AdminPayments";
import AdminLogs from "./pages/AdminLogs";
import AdminNotifications from "./pages/AdminNotifications";
import MyStudents from "./pages/MyStudents";
import StudentDetails from "./pages/StudentDetails";
import WorkoutAnalysis from "./pages/WorkoutAnalysis";
import WorkoutEvolution from "./pages/WorkoutEvolution";
import PhotoEvolution from "./pages/PhotoEvolution";
import { Achievements } from "./pages/Achievements";
import { Ranking } from "./pages/Ranking";
import NotFound from "./pages/NotFound";
import Measurements from "./pages/Measurements";
import Profile from "./pages/Profile";
import WorkoutHistory from "./pages/WorkoutHistory";
import Messages from "./pages/Messages";
import ChatConversation from "./pages/ChatConversation";
import ProductDetailPage from "./pages/ProductDetailPage";
import Activity from "./pages/Activity";
import OnboardingPage from "./pages/OnboardingPage";
import Pricing from "./pages/Pricing";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <GamificationToast />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile-setup" element={<ProfileSetup />} />
              <Route path="/workout-generation" element={<WorkoutGeneration />} />
              <Route path="/personal-login" element={<PersonalLogin />} />
              <Route path="/personal-dashboard" element={<PersonalDashboard />} />
              <Route path="/personal-dashboard/payments" element={<PersonalPaymentHistory />} />
              <Route path="/personal-review/:workoutId" element={<PersonalReview />} />
              <Route path="/plan-review/:planId" element={<PlanReview />} />
              <Route path="/workout-analysis" element={<WorkoutAnalysis />} />
              <Route path="/workout-evolution" element={<WorkoutEvolution />} />
              <Route path="/photo-evolution" element={<PhotoEvolution />} />
              <Route path="/measurements" element={<Measurements />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/workout-history" element={<WorkoutHistory />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:conversationId" element={<ChatConversation />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/my-students" element={<MyStudents />} />
              <Route path="/student-details/:studentId" element={<StudentDetails />} />
              <Route path="/admin-panel" element={<AdminPanel />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/user/:userId" element={<AdminUserDetail />} />
              <Route path="/admin/personal/:personalId" element={<AdminPersonalDetail />} />
              <Route path="/admin/approvals" element={<AdminApprovals />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
              <Route path="/admin/notifications" element={<AdminNotifications />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
