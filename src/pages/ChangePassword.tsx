import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { API_BASE_URL } from "../config/apiConfig";

const CHANGE_PASSWORD_URL = `${API_BASE_URL}/api/Auth/change-password`;

function ChangePassword() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError("All password fields are required.");
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(newPassword)) {
      setError(
        "New password must be at least 8 characters and include uppercase, lowercase, and a number."
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(CHANGE_PASSWORD_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to change password.");
      }

      // Update stored user flag
      let isStudentOnly = false;
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.mustChangePassword = false;
          localStorage.setItem("user", JSON.stringify(parsed));

          const roles: string[] = Array.isArray(parsed.roles)
            ? parsed.roles
            : parsed.role
            ? [parsed.role]
            : [];

          isStudentOnly =
            roles.some((r) => r.toLowerCase() === "student") &&
            !roles.some((r) =>
              ["superadmin", "adminstaff", "faculty"].includes(r.toLowerCase())
            );
        }
      } catch {
        // ignore parse errors
      }

      alert("Password changed successfully!");
      navigate(isStudentOnly ? "/student-dashboard" : "/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-icon">
          <i className="bi bi-shield-lock-fill"></i>
        </div>

        <h1>
          <span>ICE</span> Computer
        </h1>
        <p>First-Time Account Security Setup</p>
      </section>

      <section className="login-card">
        <h2>Change Temporary Password</h2>
        <p className="login-subtitle">
          Please set your own secure password before accessing your dashboard.
        </p>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Temporary / Current Password
            <div className="input-group">
              <i className="bi bi-key"></i>
              <input
                type="password"
                placeholder="Enter your temporary password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
          </label>

          <label>
            New Password
            <div className="input-group">
              <i className="bi bi-lock"></i>
              <input
                type="password"
                placeholder="Min 8 chars, Upper, Lower & Number"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          </label>

          <label>
            Confirm New Password
            <div className="input-group">
              <i className="bi bi-lock-fill"></i>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>
          </label>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Updating Password..." : "Update Password & Continue"}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              marginTop: "8px",
              background: "transparent",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "10px",
              color: "#475569",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Back to Login
          </button>
        </form>
      </section>
    </main>
  );
}

export default ChangePassword;
