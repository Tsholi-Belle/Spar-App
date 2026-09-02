import { db } from './database.js';

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin', -- 'admin', 'supervisor'
      department TEXT DEFAULT 'All', -- 'All', 'Floor', 'HMR', 'Bakery', 'Butchery', 'Deli', 'Front End'
      avatar_initials TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS email_verifications (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS programmes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT NOT NULL, -- 'Floor', 'HMR', 'Bakery', 'Butchery', 'Deli', 'Front End'
      cohort_code TEXT NOT NULL UNIQUE,
      branch_location TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      target_headcount INTEGER NOT NULL,
      stipend_type TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'daily'
      monthly_stipend REAL NOT NULL,
      daily_rate REAL NOT NULL,
      shift_start TEXT NOT NULL DEFAULT '07:30',
      shift_end TEXT NOT NULL DEFAULT '16:00',
      supervisor_name TEXT NOT NULL,
      supervisor_email TEXT,
      status TEXT DEFAULT 'active', -- 'active', 'completed', 'upcoming'
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS learners (
      id TEXT PRIMARY KEY,
      programme_id TEXT NOT NULL REFERENCES programmes(id) ON DELETE RESTRICT,
      learner_code TEXT UNIQUE NOT NULL,
      pin_code TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      id_number TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      branch_code TEXT NOT NULL,
      account_type TEXT DEFAULT 'savings',
      status TEXT DEFAULT 'active', -- 'active', 'completed', 'dropped_out', 'suspended', 'medical_leave'
      joined_date TEXT NOT NULL,
      exit_date TEXT,
      exit_reason TEXT,
      exit_notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
      programme_id TEXT NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
      date TEXT NOT NULL, -- YYYY-MM-DD
      status TEXT NOT NULL, -- 'present', 'late', 'half_day', 'excused_sick', 'leave', 'unexcused_absent', 'left_program'
      clock_in_time TEXT,
      clock_out_time TEXT,
      tea_break_start TEXT,
      tea_break_end TEXT,
      hours_worked REAL DEFAULT 0,
      supervisor_notes TEXT,
      has_medical_note INTEGER DEFAULT 0,
      leave_type TEXT,
      leave_approved_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(learner_id, date)
    );

    CREATE TABLE IF NOT EXISTS reconciliations (
      id TEXT PRIMARY KEY,
      programme_id TEXT,
      cycle_name TEXT NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      total_learners INTEGER NOT NULL,
      total_gross_amount REAL NOT NULL,
      total_deductions REAL NOT NULL,
      total_net_payout REAL NOT NULL,
      status TEXT DEFAULT 'draft',
      notes TEXT,
      approved_by TEXT,
      approved_at TEXT,
      paid_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reconciliation_items (
      id TEXT PRIMARY KEY,
      reconciliation_id TEXT NOT NULL REFERENCES reconciliations(id) ON DELETE CASCADE,
      learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
      learner_status_at_cycle TEXT NOT NULL,
      scheduled_days INTEGER NOT NULL,
      days_present INTEGER NOT NULL,
      days_late INTEGER NOT NULL,
      days_half INTEGER NOT NULL,
      days_excused INTEGER NOT NULL,
      days_leave INTEGER NOT NULL DEFAULT 0,
      days_unexcused INTEGER NOT NULL,
      base_stipend REAL NOT NULL,
      deductions REAL NOT NULL,
      allowances REAL NOT NULL DEFAULT 0,
      net_payable REAL NOT NULL,
      payment_status TEXT DEFAULT 'pending',
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT,
      user_role TEXT DEFAULT 'Admin',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Safe migrations for existing SQLite databases
  const columnsToAdd = [
    { table: 'attendance_records', column: 'tea_break_start', type: 'TEXT' },
    { table: 'attendance_records', column: 'tea_break_end', type: 'TEXT' },
    { table: 'attendance_records', column: 'leave_type', type: 'TEXT' },
    { table: 'attendance_records', column: 'leave_approved_by', type: 'TEXT' },
    { table: 'reconciliation_items', column: 'days_leave', type: 'INTEGER DEFAULT 0' },
  ];

  for (const { table, column, type } of columnsToAdd) {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
    } catch {
      // Column already exists, ignore
    }
  }

  // Ensure ONLY the 2 authorized emails exist in the database for strict IP protection:
  // 1. Kgomotso.Lekganyane@spar.co.za
  // 2. tsholanangpodile@gmail.com
  const authorizedUsers = [
    {
      id: 'usr-kgomotso-01',
      email: 'Kgomotso.Lekganyane@spar.co.za',
      password_hash: 'SPAR@Kgomotso2026!',
      full_name: 'Kgomotso Lekganyane (Lead IP Owner & HR Director)',
      role: 'admin',
      department: 'All',
      avatar_initials: 'KL',
    },
    {
      id: 'usr-tsholanang-02',
      email: 'tsholanangpodile@gmail.com',
      password_hash: 'SPAR@Tsholanang2026!',
      full_name: 'Tsholanang Podile (Executive Project Lead)',
      role: 'admin',
      department: 'All',
      avatar_initials: 'TP',
    },
  ];

  // Clean out any unauthorized/legacy test accounts so only these 2 emails have access
  db.exec('DELETE FROM users;');

  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, email, password_hash, full_name, role, department, avatar_initials)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const u of authorizedUsers) {
    insertUser.run(u.id, u.email, u.password_hash, u.full_name, u.role, u.department, u.avatar_initials);
  }
  console.log('Seeded strictly authorized IP protection users (Kgomotso & Tsholanang).');

  console.log('Database schema verified.');
}
