
import { NavLink, Outlet } from "react-router-dom";
import "./MainLayout.css";

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
  { label: "AI Assistant", path: "/ai-assistant", icon: "bi-robot" },
  { label: "Users & Roles", path: "/users", icon: "bi-person-gear" },
  { label: "Settings", path: "/settings", icon: "bi-gear" },
];

function MainLayout() {
  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="app-brand">
          <i className="bi bi-mortarboard-fill"></i>
          <span>ICE Computer</span>
        </div>

        <nav className="app-navigation">
          {menuItems.map((item) => (
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
          <span className="app-status-dot"></span>
          System Online
        </div>
      </aside>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
