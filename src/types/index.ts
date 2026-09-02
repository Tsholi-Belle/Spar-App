export type DepartmentType =
  | 'Floor'
  | 'HMR'
  | 'Bakery'
  | 'Butchery'
  | 'Deli'
  | 'Front End';

export type LearnerStatus =
  | 'active'
  | 'completed'
  | 'dropped_out'
  | 'suspended'
  | 'medical_leave';

export type AttendanceStatus =
  | 'present'
  | 'late'
  | 'half_day'
  | 'excused_sick'
  | 'leave'
  | 'unexcused_absent'
  | 'left_program';

export type ReconciliationStatus = 'draft' | 'reviewed' | 'approved' | 'closed';

export type ReconciliationOutcome =
  | 'certified'
  | 'in_progress'
  | 'disqualified'
  | 'pro_rata_exit'
  | 'medical_concession';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'kiosk';
  department: string;
  avatar_initials?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface AuthLoginResponse {
  success: boolean;
  step: 'verification_required';
  verification_id: string;
  email: string;
  full_name: string;
  simulated_code: string;
  message: string;
}

export interface AuthAccount {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'kiosk';
  department: string;
  avatar_initials?: string;
  default_password?: string;
}

export interface Programme {
  id: string;
  name: string;
  department: DepartmentType;
  cohort_code: string;
  branch_location: string;
  start_date: string;
  end_date: string;
  target_headcount: number;
  total_required_days?: number;
  min_attendance_rate?: number;
  shift_start: string;
  shift_end: string;
  supervisor_name: string;
  supervisor_email?: string;
  status: 'active' | 'completed' | 'upcoming';
  total_enrolled?: number;
  active_learners?: number;
  dropped_out_learners?: number;
  created_at?: string;
}

export interface Learner {
  id: string;
  programme_id: string;
  programme_name?: string;
  programme_department?: DepartmentType;
  learner_code: string;
  pin_code: string;
  first_name: string;
  last_name: string;
  id_number: string;
  phone?: string;
  email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  seta_registration_number?: string;
  status: LearnerStatus;
  joined_date: string;
  exit_date?: string | null;
  exit_reason?: string | null;
  exit_notes?: string | null;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  learner_id: string;
  programme_id: string;
  date: string;
  status: AttendanceStatus;
  clock_in_time?: string | null;
  clock_out_time?: string | null;
  tea_break_start?: string | null;
  tea_break_end?: string | null;
  hours_worked: number;
  supervisor_notes?: string | null;
  has_medical_note: number;
  leave_type?: string | null;
  leave_approved_by?: string | null;
  created_at?: string;
}

export interface DailyRosterItem {
  learner_id: string;
  first_name: string;
  last_name: string;
  learner_code: string;
  pin_code: string;
  learner_status: LearnerStatus;
  exit_date?: string | null;
  exit_reason?: string | null;
  programme_id: string;
  programme_name: string;
  programme_department: DepartmentType;
  shift_start: string;
  shift_end: string;
  attendance_id?: string | null;
  attendance_date?: string | null;
  attendance_status?: AttendanceStatus;
  status?: AttendanceStatus;
  clock_in_time?: string | null;
  clock_out_time?: string | null;
  tea_break_start?: string | null;
  tea_break_end?: string | null;
  hours_worked?: number;
  supervisor_notes?: string | null;
  has_medical_note?: number;
  leave_type?: string | null;
  leave_approved_by?: string | null;
  is_dropped_out?: boolean;
}

export interface ReconciliationRun {
  id: string;
  programme_id?: string | null;
  programme_name?: string | null;
  programme_department?: DepartmentType | null;
  cycle_name: string;
  period_start: string;
  period_end: string;
  total_learners: number;
  status: ReconciliationStatus;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  paid_at?: string;
  created_at: string;
}

export interface ReconciliationItem {
  id?: string;
  reconciliation_id?: string;
  learner_id: string;
  learner_code: string;
  first_name: string;
  last_name: string;
  id_number: string;
  programme_id: string;
  programme_name?: string;
  programme_department?: DepartmentType;
  cohort_code?: string;
  branch_location?: string;
  supervisor_name?: string;
  shift_start?: string;
  shift_end?: string;
  learner_status_at_cycle?: LearnerStatus;
  joined_date?: string;
  exit_date?: string | null;
  exit_reason?: string | null;
  scheduled_days: number;
  days_present: number;
  days_late: number;
  days_half: number;
  days_excused: number;
  days_leave: number;
  days_unexcused: number;
  effective_days_attended?: number;
  attendance_rate: number;
  outcome: ReconciliationOutcome;
  compliance_status?: string;
  notes?: string;
}

export interface AnalyticsOverview {
  total_programmes: number;
  total_learners: number;
  active_learners: number;
  dropped_out_learners: number;
  completed_learners: number;
  target_headcount: number;
  enrolment_rate: number;
  attendance_rate: number;
  dropout_rate: number;
  current_month: string;
  attendance_breakdown?: {
    total_records: number;
    present_count: number;
    half_day_count: number;
    excused_count: number;
    leave_count?: number;
    absent_count: number;
    left_count: number;
  };
}

export interface DepartmentStat {
  department: DepartmentType;
  programme_name: string;
  programme_id: string;
  target_headcount: number;
  total_learners: number;
  active_learners: number;
  dropped_out_learners: number;
  present_days: number;
  absent_days: number;
  total_att_records: number;
  attendance_rate: number;
}

export interface AtRiskLearner {
  id: string;
  first_name: string;
  last_name: string;
  learner_code: string;
  phone?: string;
  status: string;
  programme_name: string;
  department: string;
  supervisor_name: string;
  unexcused_count: number;
  late_count: number;
  sick_count: number;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  user_role: string;
  created_at: string;
}
