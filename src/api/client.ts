import {
  Programme,
  Learner,
  AttendanceRecord,
  DailyRosterItem,
  ReconciliationRun,
  ReconciliationItem,
  AnalyticsOverview,
  DepartmentStat,
  AtRiskLearner,
  AuditLog,
  User,
  AuthResponse,
  AuthLoginResponse,
  AuthAccount,
} from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('spar_academy_auth_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('spar_academy_auth_token', token);
  } else {
    localStorage.removeItem('spar_academy_auth_token');
  }
}

export function getStoredUser(): User | null {
  const userJson = localStorage.getItem('spar_academy_auth_user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null): void {
  if (user) {
    localStorage.setItem('spar_academy_auth_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('spar_academy_auth_user');
  }
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${url}`, {
    headers,
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errorData = await res.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Authentication & IP Access Control
  login: async (credentials: { email: string; password: string }): Promise<AuthLoginResponse> => {
    return fetchJSON<AuthLoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  verifyCode: async (data: {
    email: string;
    code: string;
    verification_id?: string;
  }): Promise<AuthResponse> => {
    const res = await fetchJSON<AuthResponse>('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) {
      setAuthToken(res.token);
      setStoredUser(res.user);
    }
    return res;
  },

  resendCode: async (email: string): Promise<{ simulated_code: string; message: string }> => {
    return fetchJSON('/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  getMe: async (): Promise<{ user: User }> => {
    return fetchJSON<{ user: User }>('/auth/me');
  },

  getAccounts: async (): Promise<AuthAccount[]> => {
    const res = await fetchJSON<{ data: AuthAccount[] }>('/auth/accounts');
    return res.data;
  },

  logout: () => {
    setAuthToken(null);
    setStoredUser(null);
  },

  // Programmes
  getProgrammes: async (): Promise<Programme[]> => {
    const res = await fetchJSON<{ data: Programme[] }>('/programmes');
    return res.data;
  },

  getProgrammeById: async (
    id: string
  ): Promise<Programme & { learners: Learner[]; attendance_summary: any[] }> => {
    const res = await fetchJSON<{ data: any }>(`/programmes/${id}`);
    return res.data;
  },

  createProgramme: async (data: Partial<Programme>): Promise<Programme> => {
    const res = await fetchJSON<{ data: Programme }>('/programmes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  updateProgramme: async (id: string, data: Partial<Programme>): Promise<Programme> => {
    const res = await fetchJSON<{ data: Programme }>(`/programmes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  deleteProgramme: async (id: string): Promise<void> => {
    await fetchJSON(`/programmes/${id}`, { method: 'DELETE' });
  },

  // Learners
  getLearners: async (params?: { programme_id?: string; status?: string; search?: string }): Promise<Learner[]> => {
    const searchParams = new URLSearchParams();
    if (params?.programme_id) searchParams.append('programme_id', params.programme_id);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetchJSON<{ data: Learner[] }>(`/learners${query}`);
    return res.data;
  },

  getLearnerById: async (id: string): Promise<Learner & { attendance_stats: any; recent_attendance: any[] }> => {
    const res = await fetchJSON<{ data: any }>(`/learners/${id}`);
    return res.data;
  },

  createLearner: async (data: Partial<Learner>): Promise<Learner> => {
    const res = await fetchJSON<{ data: Learner }>('/learners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  updateLearner: async (id: string, data: Partial<Learner>): Promise<Learner> => {
    const res = await fetchJSON<{ data: Learner }>(`/learners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  recordLearnerExit: async (
    id: string,
    data: { exit_date: string; exit_reason: string; exit_notes?: string }
  ): Promise<Learner> => {
    const res = await fetchJSON<{ data: Learner }>(`/learners/${id}/exit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  deleteLearner: async (id: string): Promise<void> => {
    await fetchJSON(`/learners/${id}`, { method: 'DELETE' });
  },

  // Attendance
  getRoster: async (date: string, programme_id?: string): Promise<{ date: string; data: DailyRosterItem[] }> => {
    const params = new URLSearchParams({ date });
    if (programme_id) params.append('programme_id', programme_id);
    return fetchJSON(`/attendance/roster?${params.toString()}`);
  },

  updateAttendance: async (data: {
    learner_id: string;
    programme_id?: string;
    date: string;
    status: string;
    clock_in_time?: string | null;
    clock_out_time?: string | null;
    tea_break_start?: string | null;
    tea_break_end?: string | null;
    hours_worked?: number;
    supervisor_notes?: string | null;
    has_medical_note?: number;
    leave_type?: string | null;
    leave_approved_by?: string | null;
  }): Promise<void> => {
    await fetchJSON('/attendance/update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  bulkUpdateAttendance: async (data: {
    programme_id?: string;
    date: string;
    status: string;
    default_clock_in?: string;
    default_clock_out?: string;
  }): Promise<{ message: string }> => {
    return fetchJSON('/attendance/bulk-update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMonthlyMatrix: async (programme_id: string, year_month: string): Promise<{
    year_month: string;
    learners: Array<{ id: string; first_name: string; last_name: string; learner_code: string; status: string; exit_date: string }>;
    attendance: Record<string, Record<string, { status: string; hours_worked: number; tea_break_start?: string; tea_break_end?: string; leave_type?: string }>>;
  }> => {
    return fetchJSON(`/attendance/matrix?programme_id=${programme_id}&year_month=${year_month}`);
  },

  // Kiosk
  kioskLookup: async (identifier: { code?: string; pin?: string }): Promise<{
    learner: any;
    today: {
      date: string;
      record: any;
      is_clocked_in: boolean;
      is_completed: boolean;
      tea_break_status: 'none' | 'on_break' | 'completed';
      tea_break_start: string | null;
      tea_break_end: string | null;
    };
    tip: string;
  }> => {
    return fetchJSON('/kiosk/lookup', {
      method: 'POST',
      body: JSON.stringify(identifier),
    });
  },

  kioskPunch: async (data: {
    learner_id: string;
    action: 'clock_in' | 'clock_out' | 'tea_break_start' | 'tea_break_end';
    current_time?: string;
  }): Promise<{
    message: string;
    record: any;
    tip: string;
  }> => {
    return fetchJSON('/kiosk/punch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Reconciliation
  getReconciliations: async (): Promise<ReconciliationRun[]> => {
    const res = await fetchJSON<{ data: ReconciliationRun[] }>('/reconciliation');
    return res.data;
  },

  getReconciliationById: async (
    id: string
  ): Promise<ReconciliationRun & { items: ReconciliationItem[] }> => {
    const res = await fetchJSON<{ data: any }>(`/reconciliation/${id}`);
    return res.data;
  },

  previewReconciliation: async (params: {
    period_start: string;
    period_end: string;
    programme_id?: string;
  }): Promise<{
    period_start: string;
    period_end: string;
    working_days_count: number;
    total_learners: number;
    total_gross_amount: number;
    total_deductions: number;
    total_net_payout: number;
    items: any[];
  }> => {
    const res = await fetchJSON<{ data: any }>('/reconciliation/preview', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return res.data;
  },

  createReconciliation: async (data: {
    cycle_name: string;
    period_start: string;
    period_end: string;
    programme_id?: string;
    notes?: string;
  }): Promise<{ reconciliation_id: string; data: any }> => {
    return fetchJSON('/reconciliation/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateReconciliationStatus: async (
    id: string,
    data: { status: string; approved_by?: string }
  ): Promise<ReconciliationRun> => {
    const res = await fetchJSON<{ data: ReconciliationRun }>(`/reconciliation/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  getPayslip: async (runId: string, learnerId: string): Promise<{
    company_name: string;
    academy_name: string;
    tax_registration: string;
    cycle_name: string;
    period_start: string;
    period_end: string;
    reconciliation_status: string;
    learner: any;
  }> => {
    const res = await fetchJSON<{ payslip: any }>(`/reconciliation/${runId}/payslip/${learnerId}`);
    return res.payslip;
  },

  // Analytics
  getAnalyticsOverview: async (): Promise<AnalyticsOverview> => {
    const res = await fetchJSON<{ data: AnalyticsOverview }>('/analytics/overview');
    return res.data;
  },

  getDepartmentStats: async (): Promise<DepartmentStat[]> => {
    const res = await fetchJSON<{ data: DepartmentStat[] }>('/analytics/departments');
    return res.data;
  },

  getAtRiskLearners: async (): Promise<AtRiskLearner[]> => {
    const res = await fetchJSON<{ data: AtRiskLearner[] }>('/analytics/at-risk');
    return res.data;
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await fetchJSON<{ data: AuditLog[] }>('/analytics/activity');
    return res.data;
  },
};
