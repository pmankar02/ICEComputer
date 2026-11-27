# ICE Computer - Recent Changes & Implementation Guide

This document summarizes all the recent implementations, architectural improvements, and new features added to the **ICE Computer** project.

---

## 1. Single-Click Dual Project Startup (Visual Studio & CLI)

### Problem Solved
Previously, running the project in Visual Studio only started the backend API (`ICEComputer.API`), while the frontend (`ICEComputer.client`) failed to start or caused `ERR_CONNECTION_REFUSED` in the browser.

### What Was Done
1. **Auto-Launch Frontend from Backend (`ICEComputer.API/Program.cs`)**:
   - Added an asynchronous development task inside `Program.cs`.
   - When the API starts in `Development` mode, it probes port `5173`.
   - If Vite is not running, it automatically executes `npm run dev` in the background with its window **minimized** to the taskbar.
2. **Auto-Open Browser in Vite (`ICEComputer.client/vite.config.ts`)**:
   - Configured `server: { port: 5173, host: true, open: true }`.
   - As soon as the Vite dev server starts, it automatically opens your default browser directly to your application (which redirects to `http://localhost:5173/#/login`).
3. **Visual Studio Project Linking**:
   - Created **`ICEComputer.sln`** linking both `ICEComputer.API` (.NET 9) and `ICEComputer.client` (`.esproj`).
   - Created **`ICEComputer.client.esproj`** and **`ICEComputer.client/Properties/launchSettings.json`** so Visual Studio recognizes both projects in the Solution Explorer.
   - Added `"start": "vite"` script into `ICEComputer.client/package.json`.
4. **Standalone 1-Click Launchers**:
   - Created **`start-all.bat`** and **`start-all.ps1`** in `C:\Users\prajwal mankar\ICEComputer\` to launch both projects in dedicated terminal windows outside of Visual Studio.

---

## 2. Floating WhatsApp Chat Button

### Features Implemented
* **Visual Design**: Follows the official WhatsApp style with green gradient background, WhatsApp icon (`bi-whatsapp`), bold text **"WhatsApp Chat"**, and notification badge **"3"**.
* **Direct Chat Action**: Clicking opens the official WhatsApp click-to-chat URL:
  `https://wa.me/919503160267?text=...` in a new browser tab.
* **Smart Layout & No Overlap**:
  - Positioned at `bottom: 24px; right: 24px; z-index: 9998`.
  - Positioned neatly below the AI Assistant button so both buttons remain accessible and attractive without colliding.
* **Persistent Across Navigation**:
  - Mounted globally in `MainLayout.tsx`, remaining visible and fixed across all pages.

### Files Created
* `src/components/FloatingWhatsApp.tsx` — Reusable React TypeScript component.
* `src/components/FloatingWhatsApp.css` — Responsive pill styling, pulse animation, and hover effects.

---

## 3. Floating AI Assistant Chat Widget

### Features Implemented
* **Bottom-Right Floating Pill**: Styled with an Indigo/Blue AI gradient theme (`linear-gradient(135deg, #2563eb, #7c3aed)`), robot icon, and notification badge. Positioned at `bottom: 80px; right: 24px`.
* **Interactive AI Chat Window**:
  - Pops up right above the floating buttons (`bottom: 138px; right: 24px`).
  - Active status indicator (green online dot).
  - Quick suggested question chips (Fees, Attendance, Student Insights).
  - Message bubble formatting (User vs AI Assistant).
  - Animated typing indicator (three bouncing dots) while the Gemini API thinks.
  - Clear conversation button (`bi-arrow-clockwise`) and close button (`bi-x-lg`).
  - Directly connected to your backend Gemini API: `http://localhost:5056/api/Gemini/chat`.
* **Sidebar Cleanup**:
  - Removed "AI Assistant" from the left sidebar navigation in `MainLayout.tsx` as requested, keeping the interface uncluttered.

### Files Created/Modified
* `src/components/FloatingAIAssistant.tsx` — Chat window and pill button logic.
* `src/components/FloatingAIAssistant.css` — Modern glassmorphism card styling and responsive design.

---

## 4. Role-Based Access Control (RBAC) & Route Protection

### Features Implemented
* **`ProtectedRoute` Component (`App.tsx`)**:
  - Validates JWT token expiry on every route change.
  - Accepts `allowedRoles?: string[]` to restrict access by user role.
  - Automatically redirects unauthenticated users to `/login`.
  - Automatically redirects unauthorized users to `/` (Dashboard).
* **Role Restrictions Applied**:
  - `/fees` ➔ Restricted to `SuperAdmin`.
  - `/user-management` ➔ Restricted to `SuperAdmin`.
* **Dynamic Sidebar Navigation (`MainLayout.tsx`)**:
  - Evaluates user roles from `localStorage.getItem("user")`.
  - Hides restricted menu items ("Fees" and "Users & Roles") for non-SuperAdmin users (AdminStaff, Faculty, Student).

---

## 5. Dynamic API Base URL Configuration

### What Was Done
* Created **`ICEComputer.client/src/config/apiConfig.ts`** exporting `API_BASE_URL`:
  - Uses `http://localhost:5056` when running on `localhost`.
  - Uses `window.location.origin` when hosted on a remote domain.
* Updated API service and page modules (`api.ts`, `FloatingAIAssistant.tsx`, `PaymentHistory.tsx`, `StudentInsights.tsx`, `AIAssistant.tsx`, `UserManagement.tsx`, `Login.tsx`, and service files) to use `API_BASE_URL` instead of hardcoded localhost URLs.

---

## 6. Courses Management Module

### Backend (`ICEComputer.API`)
* Added **`Models/Course.cs`**, **`DTOs/CourseDtos.cs`**, and EF Core migration **`20261124104719_AddCoursesTable`**.
* Added **`Controllers/CoursesController.cs`** (`api/Courses`) supporting search, status filtering, and CRUD operations:
  - `SuperAdmin`, `AdminStaff`, and `Faculty` can view all courses and manage course records.
  - `Student` users can view active courses only.

### Frontend (`ICEComputer.client`)
* Added **`src/services/courseService.ts`**, **`src/pages/Courses.tsx`**, and **`src/pages/Courses.css`** with route `/courses` in `App.tsx` and sidebar link in `MainLayout.tsx`.
* Added course SVG assets in **`public/course-images/`** (`mscit.svg`, `tally.svg`, `typing-marathi.svg`, `typing-english.svg`, `data-entry.svg`, `html-css.svg`, `advanced-excel.svg`, `cyber-security.svg`, `default-course.svg`).

---

## 7. Government Updates & Schemes Module

### Backend (`ICEComputer.API`)
* Added **`Models/GovernmentUpdate.cs`**, **`DTOs/GovernmentUpdateDtos.cs`**, and EF Core migration **`20261125044557_AddGovernmentUpdatesTable`**.
* Added **`Controllers/GovernmentUpdatesController.cs`** (`api/GovernmentUpdates`) with CRUD, publish/important flags, and file attachment upload/cleanup in `wwwroot/government-updates/`.

### Frontend (`ICEComputer.client`)
* Added **`src/services/govtUpdateService.ts`**, **`src/pages/GovtUpdates.tsx`**, and **`src/pages/GovtUpdates.css`** with route `/govt-updates` in `App.tsx`.
* Added unread update tracking and notification badge in **`MainLayout.tsx`** and updates integration in **`Dashboard.tsx`**.

---

## 8. Student Portal, Account Linking & First-Login Password Change

### Backend (`ICEComputer.API`)
* Added EF Core migration **`20261125063701_AddStudentAccountFields`** and updated **`Models/Student.cs`**, **`Identity/ApplicationUser.cs`**, and **`Data/ApplicationDbContext.cs`** to link student records to Identity user accounts.
* Updated **`Controllers/StudentsController.cs`** and **`Controllers/AuthController.cs`** for student account creation and mandatory first-login password change (`mustChangePassword`).
* Added **`Controllers/StudentPortalController.cs`** (`api/StudentPortal`, restricted to `Student` role) with:
  - `GET /api/StudentPortal/my-profile` (student details & enrolled course info)
  - `GET /api/StudentPortal/my-fees` (fee summary & payment history)
  - `GET /api/StudentPortal/my-attendance` (attendance percentage & records)

### Frontend (`ICEComputer.client`)
* Added **`src/services/studentPortalService.ts`**, **`src/pages/StudentDashboard.tsx`**, and **`src/pages/StudentDashboard.css`** mapped to `/student-dashboard` for `Student` role.
* Added **`src/pages/ChangePassword.tsx`** mapped to `/change-password`, enforced by `ProtectedRoute` in `App.tsx` when `mustChangePassword` is `true`.
* Updated **`MainLayout.tsx`** to render a dedicated Student sidebar (`My Dashboard`, `Courses`, `Govt. Updates`).

---

## 9. Sidebar Navigation Cleanup

* Removed **Online Services** (`/services`) and **Net Cafe** (`/netcafe`) menu items from `menuItems` in **`ICEComputer.client/src/layouts/MainLayout.tsx`**.

---

## 10. File Summary

| File | Purpose / Change |
| :--- | :--- |
| **`ICEComputer.sln`** | Visual Studio solution connecting Backend API and Frontend Client. |
| **`ICEComputer.API/Program.cs`** | Automated background launch of Vite dev server during development and static/SPA hosting configuration. |
| **`ICEComputer.client/vite.config.ts`** | Enabled `port: 5173`, `host: true`, and `open: true` (auto-opens login page in browser). |
| **`ICEComputer.client/package.json`** | Added `"start": "vite"` script for IDE compatibility. |
| **`ICEComputer.client/Properties/launchSettings.json`** | Added Chrome/Edge launch profiles for Visual Studio. |
| **`src/config/apiConfig.ts`** | Dynamic `API_BASE_URL` for local development vs. hosted origin. |
| **`src/components/FloatingWhatsApp.tsx` / `.css`** | Floating WhatsApp contact button component and styling. |
| **`src/components/FloatingAIAssistant.tsx` / `.css`** | Floating AI Assistant chat popup widget and styling. |
| **`src/layouts/MainLayout.tsx` / `.css`** | Mounted WhatsApp & AI buttons; role-based sidebar (`Student` vs Staff/SuperAdmin); unread Govt. Updates badge; removed `Online Services` and `Net Cafe`. |
| **`src/App.tsx`** | Route protection rules with `allowedRoles`, `/student-dashboard`, `/change-password`, `/courses`, and `/govt-updates`. |
| **`CoursesController.cs` / `Courses.tsx` / `courseService.ts`** | Courses Management backend API, database table, and frontend UI. |
| **`GovernmentUpdatesController.cs` / `GovtUpdates.tsx` / `govtUpdateService.ts`** | Government Updates backend API, attachments, database table, and frontend UI. |
| **`StudentPortalController.cs` / `StudentDashboard.tsx` / `ChangePassword.tsx`** | Student Portal API, student dashboard UI, and first-login password change flow. |
| **`start-all.bat`** | 1-click batch launcher to start API and Client side-by-side. |

---

## 11. How to Run Your Project

### Option A: From Microsoft Visual Studio
1. Open **`ICEComputer.sln`** in Visual Studio.
2. Press **F5** (or click the green **Start ▶** button).
3. The API will start, Vite will launch minimized in your taskbar, and your browser will automatically open your **Login Page**!

### Option B: Standalone 1-Click Launch (Without Visual Studio)
1. Double-click **`C:\Users\prajwal mankar\ICEComputer\start-all.bat`**.
2. Both Backend and Frontend consoles will open and run side-by-side.
