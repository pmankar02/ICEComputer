
import { useState } from "react";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      alert("Please enter your email and password.");
      return;
    }

    // Temporary: API authentication comes later.
    console.log({ email, rememberMe });
    alert("Login UI is working! API connection comes next.");
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

        <form onSubmit={handleLogin}>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            className="form-control"
            placeholder="admin@icecomputer.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
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

          <button type="submit" className="btn btn-primary login-button">
            Sign In <i className="bi bi-arrow-right"></i>
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
