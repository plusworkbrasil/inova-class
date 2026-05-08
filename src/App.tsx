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
import StudentsAtRisk from "./pages/StudentsAtRisk";
import SelectedStudents from "./pages/SelectedStudents";
import ConfirmEnrollment from "./pages/ConfirmEnrollment";
import SystemDocumentation from "./pages/SystemDocumentation";
import ResetPassword from "./pages/ResetPassword";
import StudentDeclarationsHistory from "./pages/StudentDeclarationsHistory";
import MyAttendance from "./pages/MyAttendance";
import { RoleGuard } from "./components/auth/RoleGuard";

const queryClient = new QueryClient();

const ADMIN = ['admin', 'secretary'];
const STAFF = ['admin', 'secretary', 'instructor', 'tutor', 'coordinator'];
const INSTRUCTOR_STAFF = ['admin', 'secretary', 'instructor', 'tutor'];

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
          <Route path="/users" element={<RoleGuard allowedRoles={ADMIN}><Users /></RoleGuard>} />
          <Route path="/classes" element={<RoleGuard allowedRoles={ADMIN}><Classes /></RoleGuard>} />
          <Route path="/subjects" element={<RoleGuard allowedRoles={[...ADMIN, 'instructor']}><Subjects /></RoleGuard>} />
          <Route path="/attendance" element={<RoleGuard allowedRoles={INSTRUCTOR_STAFF}><Attendance /></RoleGuard>} />
          <Route path="/grades" element={<RoleGuard allowedRoles={INSTRUCTOR_STAFF}><Grades /></RoleGuard>} />
          <Route path="/subject-grades" element={<RoleGuard allowedRoles={[...ADMIN, 'instructor']}><SubjectGrades /></RoleGuard>} />
          <Route path="/teacher-grades" element={<RoleGuard allowedRoles={['instructor']}><TeacherGrades /></RoleGuard>} />
          <Route path="/declarations" element={<Declarations />} />
          <Route path="/minhas-declaracoes" element={<RoleGuard allowedRoles={['student']}><StudentDeclarationsHistory /></RoleGuard>} />
          <Route path="/evasions" element={<RoleGuard allowedRoles={[...ADMIN, 'tutor', 'instructor']}><Evasions /></RoleGuard>} />
          <Route path="/communications" element={<Communications />} />
          <Route path="/equipment" element={<RoleGuard allowedRoles={[...ADMIN, 'instructor']}><Equipment /></RoleGuard>} />
          <Route path="/security" element={<RoleGuard allowedRoles={['admin']}><Security /></RoleGuard>} />
          <Route path="/reports" element={<RoleGuard allowedRoles={INSTRUCTOR_STAFF}><Reports /></RoleGuard>} />
          <Route path="/student-dashboard/:studentId" element={<RoleGuard allowedRoles={INSTRUCTOR_STAFF}><StudentDashboard /></RoleGuard>} />
          <Route path="/student-grades" element={<RoleGuard allowedRoles={['student']}><StudentGrades /></RoleGuard>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/instructor-subjects" element={<RoleGuard allowedRoles={['instructor']}><InstructorSubjects /></RoleGuard>} />
          <Route path="/class-timeline" element={<RoleGuard allowedRoles={STAFF}><ClassTimeline /></RoleGuard>} />
          <Route path="/student-history" element={<RoleGuard allowedRoles={INSTRUCTOR_STAFF}><StudentHistory /></RoleGuard>} />
          <Route path="/student-absences" element={<RoleGuard allowedRoles={[...INSTRUCTOR_STAFF, 'coordinator']}><StudentAbsences /></RoleGuard>} />
          <Route path="/students-at-risk" element={<RoleGuard allowedRoles={[...ADMIN, 'tutor', 'instructor']}><StudentsAtRisk /></RoleGuard>} />
          <Route path="/selected-students" element={<RoleGuard allowedRoles={ADMIN}><SelectedStudents /></RoleGuard>} />
          <Route path="/confirm-enrollment/:token" element={<ConfirmEnrollment />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/settings" element={<RoleGuard allowedRoles={['admin']}><Settings /></RoleGuard>} />
          <Route path="/documentacao" element={<SystemDocumentation />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
