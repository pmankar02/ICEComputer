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

## 5. File Summary

| File | Purpose / Change |
| :--- | :--- |
| **`ICEComputer.sln`** | Visual Studio solution connecting Backend API and Frontend Client. |
| **`ICEComputer.API/Program.cs`** | Added automated background launch of Vite dev server during development. |
| **`ICEComputer.client/vite.config.ts`** | Enabled `port: 5173`, `host: true`, and `open: true` (auto-opens login page in browser). |
| **`ICEComputer.client/package.json`** | Added `"start": "vite"` script for IDE compatibility. |
| **`ICEComputer.client/Properties/launchSettings.json`** | Added Chrome/Edge launch profiles for Visual Studio. |
| **`src/components/FloatingWhatsApp.tsx`** | Floating WhatsApp contact button component. |
| **`src/components/FloatingWhatsApp.css`** | Styling, gradient, and responsive rules for WhatsApp button. |
| **`src/components/FloatingAIAssistant.tsx`** | Floating AI Assistant chat popup widget. |
| **`src/components/FloatingAIAssistant.css`** | Positioning, chat bubbles, and animations for AI Assistant. |
| **`src/layouts/MainLayout.tsx`** | Mounted WhatsApp & AI buttons; hidden restricted menu items from non-SuperAdmin. |
| **`src/App.tsx`** | Route protection rules with `allowedRoles` for sensitive pages. |
| **`start-all.bat`** | 1-click batch launcher to start API and Client side-by-side. |

---

## 6. How to Run Your Project

### Option A: From Microsoft Visual Studio
1. Open **`ICEComputer.sln`** in Visual Studio.
2. Press **F5** (or click the green **Start ▶** button).
3. The API will start, Vite will launch minimized in your taskbar, and your browser will automatically open your **Login Page**!

### Option B: Standalone 1-Click Launch (Without Visual Studio)
1. Double-click **`C:\Users\prajwal mankar\ICEComputer\start-all.bat`**.
2. Both Backend and Frontend consoles will open and run side-by-side.
