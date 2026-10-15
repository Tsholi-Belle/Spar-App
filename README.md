# FreshBite Retail Youth Skills Academy — Clock-In & Stipend Payment Reconciliation System

A comprehensive, modern full-stack web application for retail grocery store chains running youth skills development programmes (SETA & Youth Employment Service / YES accredited).

Tailored specifically for retail grocery environments with departments such as:
- **FLOOR**
- **HMR**
- **Butchery**
- **Deli**
- **Front End**
- **Bakery**

---

##  Key Features

### 1.  Programme & Intake Management
- Create, edit, and manage skills programmes with duration dates, target headcount capacity, and store supervisor assignments.
- Configurable monthly stipend allowances and daily rates (e.g. R3,800/month or R190/day).
- Real-time headcount capacity tracking (Enrolled vs Target).

### 2.  Learner Directory & Dropout Tracking
- Complete learner profiles including Learner Code and emergency contacts.
- **Dropout & Early Exit Workflow**: Record exit dates, reasons (e.g., *Found permanent retail employment*, *Relocation*, *Health reasons*, *Dismissal*), notes, and automatic pro-rating for payment settlements.
- Detailed Learner Profile modal with 30-day attendance history and timesheet ledger.

### 3.  Dual Attendance & Clock-In Modes
- **Learner Kiosk Terminal**:
  - Touchscreen / tablet-optimized clock-in terminal with digital clock and 4-digit PIN pad.
  - One-touch **Clock In**, **Start/End Lunch**, and **Clock Out** with live shift hours calculation.
  - Demo quick-select bar for rapid testing.
- **Supervisor Daily Roll-Call**:
  - Daily roster with 1-click status pills: `Present (Full Day)`, `Late`, `Half Day`, `Sick / Excused`, `Unexcused Absent`, `Left Programme`.
  - Bulk actions: "Mark All Active as Present (07:30 - 19:00)".
  - Notes modal to attach supervisor observations and clinic / medical certificates.
- **Monthly Attendance Matrix**:
  - Calendar grid view (Learners $\times$ Days of the Month) with colour indicators and monthly attendance percentage.

### 4.  Automated Stipend Payment Reconciliation Engine
- Rule-based reconciliation engine:
  - **Gross Stipend**: Full monthly allowance or scheduled days $\times$ daily rate.
  - **Pro-Rata Settlement**: Automatically calculated for learners who exited or dropped out early.
  - **Absence Deductions**: Deducts daily rate for unexcused absences.
  - **Net Stipend Payable**: Net amount ready for direct bank disbursement.
- Multi-step approval workflow: `Draft` $\rightarrow$ `Supervisor Reviewed` $\rightarrow$ `Manager Approved` $\rightarrow$ `Disbursed / Paid`.
- **Bank Batch Export**: Standard direct credit CSV file for bank upload.
- **Printable Learner Stipend Advice (Payslip)**: High-fidelity, printable/PDF slip with company branding, learner details, attendance breakdown, and itemized earnings/deductions.

### 5.  Executive Dashboard & Analytics
- Live KPI cards: Active Learners, Target Capacity %, August Attendance Rate %, Early Exit / Dropout Rate %, and Monthly Stipend Liability.
- Department Attendance Performance bar chart comparing Bakery vs Culinary vs Cashier vs Butchery vs Merchandising.
- Attendance Distribution pie chart.
- At-risk learner alerts (flagging learners with consecutive unexcused absences).
- Full audit log stream.

---

##  Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Launch

```bash
# Navigate to the project directory
cd /Users/kgomotsolekganyane/.gemini/antigravity/scratch/retail-youth-skills-tracker

# Install dependencies (already installed)
npm install

# Start the full-stack server (serves frontend + backend on port 3001)
NODE_ENV=production npm run start
# OR run the backend:
npm run server
# In another terminal, run Vite dev server:
npm run dev
```

Open your browser to:
**http://localhost:3001** (or **http://localhost:5173** in dev mode)

---

##  Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, Canvas-Confetti
- **Backend API**: Node.js, Express, TypeScript (via `tsx`)
- **Database**: SQLite (via `better-sqlite3` with WAL mode and foreign keys)
- **Data Export**: South African EFT Banking CSV & Printable HTML/CSS Payslips
