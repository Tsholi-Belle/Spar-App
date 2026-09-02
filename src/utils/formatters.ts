import {
  AttendanceStatus,
  LearnerStatus,
  DepartmentType,
  ReconciliationStatus,
  ReconciliationOutcome,
} from '../types';

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

// Professional Black & White / Neutral styling for Floor, HMR, Bakery, Butchery, Deli, Front End
export const departmentConfig: Record<
  DepartmentType,
  { label: string; bg: string; text: string; border: string }
> = {
  Floor: {
    label: 'Floor',
    bg: 'bg-zinc-100',
    text: 'text-zinc-900',
    border: 'border-zinc-300',
  },
  HMR: {
    label: 'HMR',
    bg: 'bg-zinc-100',
    text: 'text-zinc-900',
    border: 'border-zinc-300',
  },
  Bakery: {
    label: 'Bakery',
    bg: 'bg-zinc-100',
    text: 'text-zinc-900',
    border: 'border-zinc-300',
  },
  Butchery: {
    label: 'Butchery',
    bg: 'bg-zinc-100',
    text: 'text-zinc-900',
    border: 'border-zinc-300',
  },
  Deli: {
    label: 'Deli',
    bg: 'bg-zinc-100',
    text: 'text-zinc-900',
    border: 'border-zinc-300',
  },
  'Front End': {
    label: 'Front End',
    bg: 'bg-zinc-100',
    text: 'text-zinc-900',
    border: 'border-zinc-300',
  },
};

export const attendanceStatusConfig: Record<
  AttendanceStatus,
  { label: string; bg: string; text: string; dot: string; icon: string }
> = {
  present: {
    label: 'Present',
    bg: 'bg-zinc-900 text-white border-zinc-900',
    text: 'text-zinc-900',
    dot: 'bg-zinc-900',
    icon: 'CheckCircle2',
  },
  late: {
    label: 'Late',
    bg: 'bg-zinc-200 text-zinc-900 border-zinc-300',
    text: 'text-zinc-900',
    dot: 'bg-zinc-600',
    icon: 'Clock',
  },
  half_day: {
    label: 'Half Day',
    bg: 'bg-zinc-100 text-zinc-800 border-zinc-300',
    text: 'text-zinc-800',
    dot: 'bg-zinc-500',
    icon: 'Clock3',
  },
  excused_sick: {
    label: 'Sick / Excused',
    bg: 'bg-zinc-100 text-zinc-700 border-zinc-300',
    text: 'text-zinc-700',
    dot: 'bg-zinc-400',
    icon: 'FileText',
  },
  leave: {
    label: 'Approved Leave',
    bg: 'bg-zinc-100 text-zinc-900 border-zinc-400',
    text: 'text-zinc-900',
    dot: 'bg-zinc-700',
    icon: 'Calendar',
  },
  unexcused_absent: {
    label: 'Absent',
    bg: 'bg-white text-zinc-900 border-zinc-400',
    text: 'text-zinc-900',
    dot: 'bg-zinc-900',
    icon: 'XCircle',
  },
  left_program: {
    label: 'Left Programme',
    bg: 'bg-zinc-100 text-zinc-500 border-zinc-200',
    text: 'text-zinc-500',
    dot: 'bg-zinc-300',
    icon: 'UserX',
  },
};

export const learnerStatusConfig: Record<
  LearnerStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  active: {
    label: 'Active',
    bg: 'bg-zinc-900 text-white',
    text: 'text-zinc-900',
    border: 'border-zinc-900',
  },
  completed: {
    label: 'Graduated / Completed',
    bg: 'bg-zinc-800 text-white',
    text: 'text-zinc-800',
    border: 'border-zinc-800',
  },
  dropped_out: {
    label: 'Exited / Dropped Out',
    bg: 'bg-zinc-100 text-zinc-700',
    text: 'text-zinc-700',
    border: 'border-zinc-300',
  },
  suspended: {
    label: 'Suspended',
    bg: 'bg-zinc-200 text-zinc-800',
    text: 'text-zinc-800',
    border: 'border-zinc-400',
  },
  medical_leave: {
    label: 'Medical Leave',
    bg: 'bg-zinc-100 text-zinc-700',
    text: 'text-zinc-700',
    border: 'border-zinc-300',
  },
};

export const reconciliationStatusConfig: Record<
  ReconciliationStatus,
  { label: string; bg: string; text: string; border: string; step: number }
> = {
  draft: {
    label: 'Draft Reconciled',
    bg: 'bg-zinc-100',
    text: 'text-zinc-700',
    border: 'border-zinc-300',
    step: 1,
  },
  reviewed: {
    label: 'Supervisor Verified',
    bg: 'bg-zinc-200',
    text: 'text-zinc-900',
    border: 'border-zinc-400',
    step: 2,
  },
  approved: {
    label: 'HR Manager Approved',
    bg: 'bg-zinc-900',
    text: 'text-white',
    border: 'border-zinc-900',
    step: 3,
  },
  closed: {
    label: 'Audited & Signed Off',
    bg: 'bg-black',
    text: 'text-white',
    border: 'border-black',
    step: 4,
  },
};

export const outcomeConfig: Record<
  ReconciliationOutcome,
  { label: string; bg: string; text: string; border: string }
> = {
  certified: {
    label: 'Certified / Met Target',
    bg: 'bg-zinc-900 text-white',
    text: 'text-zinc-900',
    border: 'border-zinc-900',
  },
  in_progress: {
    label: 'Participation On-Track',
    bg: 'bg-zinc-100 text-zinc-900',
    text: 'text-zinc-900',
    border: 'border-zinc-300',
  },
  disqualified: {
    label: 'Disqualified (Excess Absences)',
    bg: 'bg-zinc-200 text-zinc-900',
    text: 'text-zinc-900',
    border: 'border-zinc-400',
  },
  pro_rata_exit: {
    label: 'Pro-Rated Participation (Exited)',
    bg: 'bg-zinc-100 text-zinc-700',
    text: 'text-zinc-700',
    border: 'border-zinc-300',
  },
  medical_concession: {
    label: 'Medical Leave Concession',
    bg: 'bg-zinc-100 text-zinc-700',
    text: 'text-zinc-700',
    border: 'border-zinc-300',
  },
};
