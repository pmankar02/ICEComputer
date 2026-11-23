
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./MainLayout.css";
import FloatingAIAssistant from "../components/FloatingAIAssistant";
import FloatingWhatsApp from "../components/FloatingWhatsApp";

const menuItems = [
  { label: "Dashboard", path: "/", icon: "bi-grid-fill" },
  { label: "Students", path: "/students", icon: "bi-people" },
  { label: "Courses", path: "/courses", icon: "bi-book" },
  { label: "Fees", path: "/fees", icon: "bi-wallet2" },
  { label: "Attendance", path: "/attendance", icon: "bi-calendar-check" },
  { label: "Online Services", path: "/services", icon: "bi-file-earmark-text" },
  { label: "Net Cafe", path: "/netcafe", icon: "bi-pc-display" },
  { label: "Inventory", path: "/inventory", icon: "bi-box-seam" },
  { label: "Reports", path: "/reports", icon: "bi-bar-chart" },
  { label: "Users & Roles", path: "/user-management", icon: "bi-person-gear" },
  { label: "Settings", path: "/settings", icon: "bi-gear" },
];

function MainLayout() {
  const navigate = useNavigate();

  // Get logged-in user details
  let userRoles: string[] = [];

  try {
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (Array.isArray(user?.roles)) {
      userRoles = user.roles;
    } else if (user?.role) {
      userRoles = [user.role];
    }
  } catch {
    userRoles = [];
  }

  const isSuperAdmin = userRoles.some(
    (role) => role.toLowerCase() === "superadmin"
  );

  // Show Fees and Users & Roles only to SuperAdmin
  const visibleMenuItems = menuItems.filter((item) => {
    if (item.label === "Fees" || item.label === "Users & Roles") {
      return isSuperAdmin;
    }

    return true;
  });

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmLogout) return;

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="app-brand">
          <i className="bi bi-mortarboard-fill"></i>
          <span>ICE Computer</span>
        </div>

        <nav className="app-navigation">
          {visibleMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `app-nav-link${isActive ? " active" : ""}`
              }
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar-footer">
          <div className="app-system-status">
            <span className="app-status-dot"></span>
            System Online
          </div>

          <button
            type="button"
            className="app-logout-button"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="app-content">
        <Outlet />
      </main>

      {/* Floating AI Assistant Fixed Widget */}
      <FloatingAIAssistant />

      {/* Floating WhatsApp Chat Fixed Widget */}
      <FloatingWhatsApp />
    </div>
  );
}

export default MainLayout;
