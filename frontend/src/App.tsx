import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CourseList } from './pages/CourseList';
import { MyEnrollments } from './pages/MyEnrollments';

// New Student Pages
import { StudentDashboard } from './pages/StudentDashboard';
import { MyGrades } from './pages/MyGrades';
import { FinancialInfo } from './pages/FinancialInfo';
import { PersonalInfo } from './pages/PersonalInfo';
import { DegreePlanning } from './pages/DegreePlanning';
import { Applications } from './pages/Applications';
import { CampusInfo } from './pages/CampusInfo';
import { Transcript } from './pages/Transcript';

// Faculty Pages
import { FacultyDashboard } from './pages/FacultyDashboard';
import { GradeSubmission } from './pages/GradeSubmission';

// New Feature Pages
import AcademicCalendarPage from './pages/AcademicCalendarPage';
import AddDropPage from './pages/AddDropPage';
import MajorChangePage from './pages/MajorChangePage';
import EvaluationsPage from './pages/EvaluationsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function RoleDashboard() {
  const { user } = useAuth();

  if (user?.role === 'INSTRUCTOR') {
    return <FacultyDashboard />;
  }

  if (user?.role === 'ADMIN') {
    return <Dashboard />; // Admin uses the existing Dashboard
  }

  return <StudentDashboard />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Dashboard - Role-based */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <RoleDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Course Management */}
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CourseList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/enrollments"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MyEnrollments />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Academic Pages */}
            <Route
              path="/academic/grades"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MyGrades />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/academic/transcript"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Transcript />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Financial */}
            <Route
              path="/financial"
              element={
                <ProtectedRoute>
                  <Layout>
                    <FinancialInfo />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Personal Info */}
            <Route
              path="/personal"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PersonalInfo />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Degree Planning */}
            <Route
              path="/planning"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DegreePlanning />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Applications */}
            <Route
              path="/applications"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Applications />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Campus Info */}
            <Route
              path="/campus"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CampusInfo />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Academic Calendar */}
            <Route
              path="/academic-calendar"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AcademicCalendarPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Add/Drop Courses */}
            <Route
              path="/add-drop"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AddDropPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Major Change Request */}
            <Route
              path="/major-change"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MajorChangePage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Course Evaluations */}
            <Route
              path="/evaluations"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EvaluationsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Faculty Routes */}
            <Route
              path="/faculty"
              element={
                <ProtectedRoute>
                  <Layout>
                    <FacultyDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/courses"
              element={
                <ProtectedRoute>
                  <Layout>
                    <FacultyDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/courses/:courseId/grades"
              element={
                <ProtectedRoute>
                  <Layout>
                    <GradeSubmission />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
