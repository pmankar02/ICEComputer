import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import "./Settings.css";
import { API_BASE_URL } from "../config/apiConfig";
import {
  getInstituteProfile,
  updateInstituteProfile,
  uploadInstituteLogo,
  type InstituteProfile,
} from "../services/settingsService";

type SettingsTabKey =
  | "institute"
  | "academic"
  | "courses"
  | "fees"
  | "attendance"
  | "notifications"
  | "security"
  | "backup";

interface SettingsTabMeta {
  key: SettingsTabKey;
  label: string;
  icon: string;
  implemented: boolean;
}

const SETTINGS_TABS: SettingsTabMeta[] = [
  { key: "institute", label: "Institute Profile", icon: "bi-building", implemented: true },
  { key: "academic", label: "Academic", icon: "bi-calendar3", implemented: false },
  { key: "courses", label: "Courses", icon: "bi-book", implemented: false },
  { key: "fees", label: "Fees", icon: "bi-wallet2", implemented: false },
  { key: "attendance", label: "Attendance", icon: "bi-calendar-check", implemented: false },
  { key: "notifications", label: "Notifications", icon: "bi-bell", implemented: false },
  { key: "security", label: "Security", icon: "bi-shield-lock", implemented: false },
  { key: "backup", label: "Backup", icon: "bi-database-check", implemented: false },
];

function isSuperAdminUser(): boolean {
  try {
    const raw = localStorage.getItem("user");
    const parsed = raw ? JSON.parse(raw) : null;
    const roles: string[] = Array.isArray(parsed?.roles)
      ? parsed.roles
      : parsed?.role
        ? [parsed.role]
        : [];
    return roles.some((r) => r.toLowerCase() === "superadmin");
  } catch {
    return false;
  }
}

function Settings() {
  const isSuperAdmin = useMemo(() => isSuperAdminUser(), []);
  const [activeTab, setActiveTab] = useState<SettingsTabKey>("institute");

  // Category A: Institute Profile state
  const [profile, setProfile] = useState<InstituteProfile>({
    instituteName: "ICE Computer Institute",
    logoUrl: null,
    address: "",
    mobileNumber: "",
    emailAddress: "",
    website: "",
    workingHours: "08:00 AM - 08:00 PM (Mon - Sat)",
  });
  const [savedProfile, setSavedProfile] = useState<InstituteProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (activeTab !== "institute") return;

    let mounted = true;
    setLoading(true);
    setError("");

    getInstituteProfile()
      .then((data) => {
        if (!mounted) return;
        setProfile(data);
        setSavedProfile(data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load institute profile."
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeTab]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;

    setError("");
    setSuccess("");

    if (!profile.instituteName.trim()) {
      setError("Institute Name is required.");
      return;
    }
    if (!profile.address.trim()) {
      setError("Address is required.");
      return;
    }
    if (!/^[0-9+\-\s]{10,15}$/.test(profile.mobileNumber.trim())) {
      setError("Please enter a valid mobile number (10–15 digits).");
      return;
    }

    try {
      setSaving(true);
      const updated = await updateInstituteProfile(profile);
      setProfile(updated);
      setSavedProfile(updated);
      setSuccess("Institute Profile settings saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save institute profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelProfile = () => {
    setError("");
    setSuccess("");
    if (savedProfile) {
      setProfile(savedProfile);
    }
  };

  const handleLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isSuperAdmin) return;

    setError("");
    setSuccess("");

    try {
      setUploadingLogo(true);
      const result = await uploadInstituteLogo(file);
      setProfile((prev) => ({ ...prev, logoUrl: result.logoUrl }));
      setSavedProfile((prev) =>
        prev ? { ...prev, logoUrl: result.logoUrl } : prev
      );
      setSuccess("Institute logo uploaded successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload institute logo."
      );
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const resolvedLogoUrl = profile.logoUrl
    ? profile.logoUrl.startsWith("http")
      ? profile.logoUrl
      : `${API_BASE_URL}${profile.logoUrl}`
    : null;

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div>
          <h1>
            <i className="bi bi-gear-fill"></i>
            System Settings
          </h1>
          <p>
            Configure institute profile, academic sessions, modules, notifications, and security.
          </p>
        </div>

        {!isSuperAdmin && (
          <span className="settings-readonly-badge">
            <i className="bi bi-eye"></i> View Only (AdminStaff)
          </span>
        )}
      </header>

      {/* Settings Category Tabs */}
      <nav className="settings-tabs" aria-label="Settings Categories">
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`settings-tab-btn${activeTab === tab.key ? " active" : ""}`}
            onClick={() => {
              setActiveTab(tab.key);
              setError("");
              setSuccess("");
            }}
          >
            <i className={`bi ${tab.icon}`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {error && (
        <div className="settings-alert settings-alert-error" role="alert">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="settings-alert settings-alert-success" role="status">
          <i className="bi bi-check-circle-fill"></i>
          <span>{success}</span>
        </div>
      )}

      {/* Category A: Institute Profile Settings */}
      {activeTab === "institute" && (
        <section className="settings-card">
          <div className="settings-card-header">
            <div>
              <h2>Institute Profile Settings</h2>
              <p>
                Manage your institute identity, contact details, logo, and working hours.
              </p>
            </div>
            {profile.updatedAt && (
              <small className="settings-updated-meta">
                Last updated: {new Date(profile.updatedAt).toLocaleString("en-IN")}
              </small>
            )}
          </div>

          {loading ? (
            <div className="settings-loading">
              <div className="spinner-border text-primary" role="status" />
              <p>Loading Institute Profile...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="settings-form">
              <div className="settings-logo-row">
                <div className="settings-logo-preview">
                  {resolvedLogoUrl ? (
                    <img src={resolvedLogoUrl} alt="Institute Logo" />
                  ) : (
                    <i className="bi bi-mortarboard-fill"></i>
                  )}
                </div>
                <div className="settings-logo-actions">
                  <label className="settings-field-label">Institute Logo</label>
                  <p>Recommended: PNG, JPG, or SVG (max 2 MB).</p>
                  {isSuperAdmin && (
                    <label className="settings-upload-btn">
                      <i className="bi bi-upload"></i>
                      <span>{uploadingLogo ? "Uploading..." : "Upload Logo"}</span>
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,.svg"
                        onChange={handleLogoChange}
                        disabled={uploadingLogo}
                        hidden
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="settings-field">
                  <label htmlFor="instituteName">Institute Name *</label>
                  <input
                    id="instituteName"
                    type="text"
                    value={profile.instituteName}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, instituteName: e.target.value }))
                    }
                    disabled={!isSuperAdmin}
                    required
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="mobileNumber">Mobile Number *</label>
                  <input
                    id="mobileNumber"
                    type="tel"
                    value={profile.mobileNumber}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, mobileNumber: e.target.value }))
                    }
                    placeholder="e.g. 9503160267"
                    disabled={!isSuperAdmin}
                    required
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="emailAddress">Email Address</label>
                  <input
                    id="emailAddress"
                    type="email"
                    value={profile.emailAddress ?? ""}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, emailAddress: e.target.value }))
                    }
                    placeholder="info@icecomputer.com"
                    disabled={!isSuperAdmin}
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    type="text"
                    value={profile.website ?? ""}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, website: e.target.value }))
                    }
                    placeholder="https://icecomputer.in"
                    disabled={!isSuperAdmin}
                  />
                </div>

                <div className="settings-field settings-field-full">
                  <label htmlFor="workingHours">Working Hours</label>
                  <input
                    id="workingHours"
                    type="text"
                    value={profile.workingHours}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, workingHours: e.target.value }))
                    }
                    placeholder="08:00 AM - 08:00 PM (Mon - Sat)"
                    disabled={!isSuperAdmin}
                  />
                </div>

                <div className="settings-field settings-field-full">
                  <label htmlFor="address">Address *</label>
                  <textarea
                    id="address"
                    rows={3}
                    value={profile.address}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, address: e.target.value }))
                    }
                    placeholder="Enter institute full address"
                    disabled={!isSuperAdmin}
                    required
                  />
                </div>
              </div>

              {isSuperAdmin && (
                <div className="settings-form-actions">
                  <button
                    type="button"
                    className="settings-btn-secondary"
                    onClick={handleCancelProfile}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="settings-btn-primary"
                    disabled={saving}
                  >
                    <i className="bi bi-check2-circle"></i>
                    <span>{saving ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              )}
            </form>
          )}
        </section>
      )}

      {activeTab !== "institute" && (
        <section className="settings-card settings-placeholder">
          <i className="bi bi-hourglass-split"></i>
          <h3>
            {SETTINGS_TABS.find((t) => t.key === activeTab)?.label} Settings
          </h3>
          <p>
            This settings category will be implemented in the next step after your confirmation.
          </p>
        </section>
      )}
    </div>
  );
}

export default Settings;
