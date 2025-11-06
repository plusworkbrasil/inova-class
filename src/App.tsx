import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Users from "./pages/Users";
import Classes from "./pages/Classes";
import Subjects from "./pages/Subjects";
import Attendance from "./pages/Attendance";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Grades from "./pages/Grades";
import TeacherGrades from "./pages/TeacherGrades";
import SubjectGrades from "./pages/SubjectGrades";
import Declarations from "./pages/Declarations";
import Evasions from "./pages/Evasions";
import Communications from "./pages/Communications";
import StudentDashboard from "./pages/StudentDashboard";
import StudentGrades from "./pages/StudentGrades";
import Equipment from "./pages/Equipment";
import Security from "./pages/Security";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Notices from "./pages/Notices";
import InstructorSubjects from "./pages/InstructorSubjects";
import ClassTimeline from "./pages/ClassTimeline";
import StudentHistory from "./pages/StudentHistory";
import StudentAbsences from "./pages/StudentAbsences";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/grades" element={<Grades />} />
          <Route path="/subject-grades" element={<SubjectGrades />} />
          <Route path="/teacher-grades" element={<TeacherGrades />} />
          <Route path="/declarations" element={<Declarations />} />
          <Route path="/evasions" element={<Evasions />} />
          <Route path="/communications" element={<Communications />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/security" element={<Security />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/student-dashboard/:studentId" element={<StudentDashboard />} />
          <Route path="/student-grades" element={<StudentGrades />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/instructor-subjects" element={<InstructorSubjects />} />
          <Route path="/class-timeline" element={<ClassTimeline />} />
          <Route path="/student-history" element={<StudentHistory />} />
          <Route path="/student-absences" element={<StudentAbsences />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
