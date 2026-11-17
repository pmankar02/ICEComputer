
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

// Protected Route
function ProtectedRoute({ children }: { children: React.ReactNode }) {
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

  return children;
}

function App() {
  return (
    <HashRouter>
      <Routes>

        {/* Public Login Page */}
        <Route path="/login" element={<Login />} />

        {/* Protected Application Pages */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/payment-history" element={<PaymentHistory />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/student-insights" element={<StudentInsights />} />
          <Route path="/user-management" element={<UserManagement />} />
        </Route>

        {/* Invalid URL */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </HashRouter>
  );
}

export default App;
