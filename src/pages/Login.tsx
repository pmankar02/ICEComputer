
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { API_BASE_URL } from "../config/apiConfig";

const API_URL = `${API_BASE_URL}/api/Auth/login`;

interface LoginResponse {
  message: string;
  token: string;
  expiresAt: string;
  user: {
    id: string;
    fullName: string;
    mobile: string;
    roles: string[];
    mustChangePassword?: boolean;
  };
}

function Login() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!mobile.trim() || !password) {
      setError("Please enter your mobile number and password.");
      return;
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile: mobile.trim(),
          password: password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Invalid mobile number or password."
        );
      }

      const data = result as LoginResponse;

      if (!data.token) {
        throw new Error("Token not received from server.");
      }

      // Save JWT token
      localStorage.setItem("token", data.token);

      // Save logged-in user details
      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("Login successful");
      console.log("Logged-in user:", data.user.fullName);
      console.log("User roles:", data.user.roles);

      alert("Login successful!");

      if (data.user.mustChangePassword) {
        navigate("/change-password", { replace: true });
        return;
      }

      const isStudentOnly =
        data.user.roles?.some((r) => r.toLowerCase() === "student") &&
        !data.user.roles?.some((r) =>
          ["superadmin", "adminstaff", "faculty"].includes(r.toLowerCase())
        );

      if (isStudentOnly) {
        navigate("/student-dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }

    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-icon">
          <i className="bi bi-mortarboard-fill"></i>
        </div>

        <h1><span>ICE</span> Computer</h1>
        <p>Institute &amp; Online Service Management System</p>
      </section>

      <section className="login-card">
        <h2>Welcome Back!</h2>
        <p className="login-subtitle">
          Enter your credentials to access your account.
        </p>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <label htmlFor="mobile">Mobile Number</label>

          <input
            id="mobile"
            type="tel"
            className="form-control"
            placeholder="Enter 10-digit mobile number"
            value={mobile}
            onChange={(e) =>
              setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            autoComplete="username"
            maxLength={10}
            required
          />

          <label htmlFor="password" className="password-label">
            Password
          </label>

          <div className="password-wrapper">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
            </button>
          </div>

          <div className="login-options">
            <label className="remember-option">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>

            <button
              type="button"
              className="forgot-link"
              onClick={() => alert("Password recovery will be added later.")}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-button"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
            {!loading && <i className="bi bi-arrow-right"></i>}
          </button>
        </form>

        <p className="login-footer">
          Need an account? <span>Contact Admin</span>
        </p>
      </section>

      <p className="login-copyright">
        © {new Date().getFullYear()} ICE Computer. All rights reserved.
      </p>
    </main>
  );
}

export default Login;
