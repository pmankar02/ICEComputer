import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Login from "./pages/Login";
import MainLayout from "./layouts/MainLayout";

import Fees from "./pages/Fees";
import PaymentHistory from "./pages/PaymentHistory";
import Attendance from "./pages/Attendance";
import AIAssistant from "./pages/AIAssistant";
import StudentInsights from "./pages/StudentInsights";
import UserManagement from "./pages/UserManagement";
import Courses from "./pages/Courses";
import GovtUpdates from "./pages/GovtUpdates";
import ChangePassword from "./pages/ChangePassword";
import StudentDashboard from "./pages/StudentDashboard";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

// Check whether JWT token exists and is valid by expiry
function isTokenValid(): boolean {
  const token = localStorage.getItem("token");

  if (!token) return false;

  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function getStoredUser(): {
  roles?: unknown;
  role?: unknown;
  mustChangePassword?: boolean;
} | null {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

function getUserRoles(): string[] {
  const user = getStoredUser();

  if (Array.isArray(user?.roles)) {
    return user.roles.filter(
      (role): role is string => typeof role === "string"
    );
  }

  if (typeof user?.role === "string") {
    return [user.role];
  }

  return [];
}

function isStudentOnlyUser(roles: string[]): boolean {
  return (
    roles.some((r) => r.toLowerCase() === "student") &&
    !roles.some((r) =>
      ["superadmin", "adminstaff", "faculty"].includes(r.toLowerCase())
    )
  );
}

// Protected Route
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const location = useLocation();

  if (!isTokenValid()) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  const user = getStoredUser();
  if (user?.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  const roles = getUserRoles();

  if (
    allowedRoles &&
    !roles.some((role) =>
      allowedRoles.some(
        (allowedRole) => role.toLowerCase() === allowedRole.toLowerCase()
      )
    )
  ) {
    return (
      <Navigate
        to={isStudentOnlyUser(roles) ? "/student-dashboard" : "/"}
        replace
      />
    );
  }

  return children;
}

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public Login Page */}
        <Route path="/login" element={<Login />} />

        {/* First-Login Mandatory Password Change */}
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        {/* Protected Application Pages */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "AdminStaff", "Faculty"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "AdminStaff", "Faculty"]}>
                <Students />
              </ProtectedRoute>
            }
          />
          <Route path="/courses" element={<Courses />} />
          <Route path="/govt-updates" element={<GovtUpdates />} />
          <Route
            path="/fees"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin"]}>
                <Fees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-history"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "AdminStaff", "Faculty"]}>
                <PaymentHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "AdminStaff", "Faculty"]}>
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-assistant"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "AdminStaff", "Faculty"]}>
                <AIAssistant />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-insights"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "AdminStaff", "Faculty"]}>
                <StudentInsights />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-management"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute
                allowedRoles={["SuperAdmin", "AdminStaff", "Faculty", "Student"]}
              >
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "AdminStaff"]}>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Invalid URL */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
