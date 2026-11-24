
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { API_BASE_URL } from "../config/apiConfig";
import "./UserManagement.css";

interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  isActive: boolean;
  createdAt: string;
  roles: string[];
}

interface CreateUserRequest {
  fullName: string;
  mobile: string;
  password: string;
  role: string;
}

function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const [formData, setFormData] = useState<CreateUserRequest>({
    fullName: "",
    mobile: "",
    password: "",
    role: "AdminStaff",
  });

  const getToken = () => localStorage.getItem("token");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/UserManagement/users`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load users (${response.status})`);
      }

      const data: User[] = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!/^[0-9]{10}$/.test(formData.mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(formData.password)) {
      setError("Password must contain at least 8 characters, one uppercase, one lowercase and one number.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE_URL}/api/UserManagement/create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.errors?.join(", ") ||
          result.message ||
          "Failed to create user."
        );
      }

      setSuccess("User created successfully!");
      setFormData({
        fullName: "",
        mobile: "",
        password: "",
        role: "AdminStaff",
      });
      setShowForm(false);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // Edit User
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setError("");
    setSuccess("");
  };

  const handleUpdateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/api/UserManagement/users/${editingUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            fullName: editingUser.fullName,
            mobile: editingUser.phoneNumber,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.errors?.join(", ") ||
          result.message ||
          "Failed to update user."
        );
      }

      setSuccess("User updated successfully!");
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  // Activate / Deactivate User
  const handleToggleStatus = async (user: User) => {
    const action = user.isActive ? "deactivate" : "activate";

    if (!window.confirm(`Are you sure you want to ${action} ${user.fullName}?`)) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/api/UserManagement/users/${user.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ isActive: !user.isActive }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update status.");
      }

      setSuccess(`User ${action}d successfully!`);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed.");
    }
  };

  // Reset Password
  const handleResetPassword = (user: User) => {
    setEditingUser(user);
    setNewPassword("");
    setShowPasswordForm(true);
    setError("");
    setSuccess("");
  };

  const handleSavePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingUser) return;

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(newPassword)) {
      setError("Password must have 8 characters, uppercase, lowercase and a number.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/UserManagement/users/${editingUser.id}/reset-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ newPassword }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.errors?.map((e: { description: string }) => e.description).join(", ") ||
          result.message ||
          "Password reset failed."
        );
      }

      setSuccess("Password reset successfully!");
      setShowPasswordForm(false);
      setEditingUser(null);
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed.");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const userName = user.fullName ?? "";
    const mobile = user.phoneNumber ?? "";
    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    const searchText = search.trim().toLowerCase();

    return (
      (userName.toLowerCase().includes(searchText) ||
        mobile.includes(searchText)) &&
      (roleFilter === "All" || userRoles.includes(roleFilter))
    );
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.isActive).length;
  const totalRoles = new Set(users.flatMap((user) => user.roles ?? [])).size;

  return (
    <div className="user-management">
      <div className="um-header">
        <div>
          <h1 className="um-title">User Management</h1>
          <p className="um-subtitle">
            Manage institute users, roles and account access.
          </p>
        </div>

        <div className="um-header-actions">
          <button className="um-btn um-btn-secondary" onClick={fetchUsers} disabled={loading}>
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>

          <button
            className="um-btn um-btn-primary"
            onClick={() => {
              setShowForm(!showForm);
              setError("");
              setSuccess("");
              setEditingUser(null);
            }}
          >
            <i className="bi bi-plus-lg"></i> Add User
          </button>
        </div>
      </div>

      {success && <div className="um-message um-success">{success}</div>}
      {error && <div className="um-message um-error">{error}</div>}

      <div className="um-stats">
        <div className="um-stat-card">
          <div className="um-stat-icon"><i className="bi bi-people"></i></div>
          <div className="um-stat-label">Total Users</div>
          <div className="um-stat-value">{totalUsers}</div>
        </div>
        <div className="um-stat-card">
          <div className="um-stat-icon"><i className="bi bi-person-check"></i></div>
          <div className="um-stat-label">Active Users</div>
          <div className="um-stat-value">{activeUsers}</div>
        </div>
        <div className="um-stat-card">
          <div className="um-stat-icon"><i className="bi bi-shield-check"></i></div>
          <div className="um-stat-label">Assigned Roles</div>
          <div className="um-stat-value">{totalRoles}</div>
        </div>
      </div>

      {showForm && (
        <div className="um-form-card">
          <h2 className="um-form-title">Create New User</h2>
          <form onSubmit={handleCreateUser}>
            <div className="um-form-grid">
              <div className="um-form-group">
                <label>Full Name *</label>
                <input className="um-input" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Enter full name" required />
              </div>
              <div className="um-form-group">
                <label>Mobile Number *</label>
                <input className="um-input" type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange} placeholder="Enter 10-digit mobile" maxLength={10} required />
              </div>
              <div className="um-form-group">
                <label>Password *</label>
                <input className="um-input" type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Enter password" required />
              </div>
              <div className="um-form-group">
                <label>Assign Role *</label>
                <select className="um-select" name="role" value={formData.role} onChange={handleInputChange}>
                  <option value="AdminStaff">AdminStaff</option>
                  <option value="Faculty">Faculty</option>
                </select>
              </div>
            </div>
            <div className="um-form-actions">
              <button className="um-btn um-btn-primary" type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create User"}
              </button>
              <button className="um-btn um-btn-secondary" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {editingUser && !showPasswordForm && (
        <div className="um-form-card">
          <h2 className="um-form-title">Edit User</h2>
          <form onSubmit={handleUpdateUser}>
            <div className="um-form-grid">
              <div className="um-form-group">
                <label>Full Name *</label>
                <input
                  className="um-input"
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="um-form-group">
                <label>Mobile Number</label>
                <input className="um-input" value={editingUser.phoneNumber} disabled />
              </div>
            </div>
            <div className="um-form-actions">
              <button className="um-btn um-btn-primary" type="submit" disabled={saving}>
                {saving ? "Updating..." : "Save Changes"}
              </button>
              <button className="um-btn um-btn-secondary" type="button" onClick={() => setEditingUser(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showPasswordForm && editingUser && (
        <div className="um-form-card">
          <h2 className="um-form-title">Reset Password - {editingUser.fullName}</h2>
          <form onSubmit={handleSavePassword}>
            <div className="um-form-group">
              <label>New Password *</label>
              <input
                className="um-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>
            <div className="um-form-actions">
              <button className="um-btn um-btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Reset Password"}
              </button>
              <button className="um-btn um-btn-secondary" type="button" onClick={() => {
                setShowPasswordForm(false);
                setEditingUser(null);
              }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="um-content-card">
        <div className="um-card-header">
          <div>
            <h2 className="um-card-title">Users Directory</h2>
            <p className="um-card-description">View and manage all registered institute accounts.</p>
          </div>
          <span className="um-badge um-badge-role">{filteredUsers.length} Users</span>
        </div>

        <div className="um-filters">
          <input
            className="um-search"
            type="search"
            placeholder="Search name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="um-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: "180px" }}
          >
            <option value="All">All Roles</option>
            <option value="AdminStaff">AdminStaff</option>
            <option value="Faculty">Faculty</option>
            <option value="Student">Student</option>
            <option value="SuperAdmin">SuperAdmin</option>
          </select>
        </div>

        {loading ? (
          <div className="um-empty">Loading users...</div>
        ) : (
          <div className="um-table-wrapper">
            <table className="um-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="um-user-name">{user.fullName}</div>
                      <div className="um-user-mobile">{user.phoneNumber}</div>
                    </td>
                    <td>
                      {(user.roles ?? []).map((role) => (
                        <span key={role} className="um-badge um-badge-role" style={{ marginRight: "5px" }}>
                          {role}
                        </span>
                      ))}
                    </td>
                    <td>
                      <span className={`um-badge ${user.isActive ? "um-badge-active" : "um-badge-inactive"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="um-action-buttons">
                        <button className="um-action-btn" title="Edit User" onClick={() => handleEditUser(user)}>
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button
                          className="um-action-btn"
                          title={user.isActive ? "Deactivate" : "Activate"}
                          onClick={() => handleToggleStatus(user)}
                        >
                          <i className={`bi ${user.isActive ? "bi-person-x" : "bi-person-check"}`}></i>
                        </button>
                        <button className="um-action-btn" title="Reset Password" onClick={() => handleResetPassword(user)}>
                          <i className="bi bi-key"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="um-empty">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;
