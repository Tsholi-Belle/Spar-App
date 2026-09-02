import React, { useEffect, useState } from 'react';
import {
  X,
  Printer,
  Award,
  CheckCircle2,
  Calendar,
  FileCheck,
  Store,
  UserCheck,
  UserX,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../api/client';
import { formatDate, outcomeConfig } from '../../utils/formatters';
import sparLogo from '../../assets/spar_academy_logo.png';

interface ParticipationCertificateModalProps {
  reconciliationId: string;
  learnerId: string;
  onClose: () => void;
}

export const ParticipationCertificateModal: React.FC<ParticipationCertificateModalProps> = ({
  reconciliationId,
  learnerId,
  onClose,
}) => {
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecord();
  }, [reconciliationId, learnerId]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      const data = await api.getPayslip(reconciliationId, learnerId);
      setRecord(data);
    } catch (err) {
      console.error('Failed to load participation record', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !record) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-zinc-500 font-medium">Generating official HR participation certificate...</p>
        </div>
      </div>
    );
  }

  const { learner } = record;
  const isDropped = !!learner.exit_date;
  const outcomeKey = (learner.outcome || (isDropped ? 'pro_rata_exit' : learner.attendance_rate >= 85 ? 'certified' : 'in_progress')) as keyof typeof outcomeConfig;
  const outcome = outcomeConfig[outcomeKey] || outcomeConfig.certified;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 my-8">
        {/* Action Header (No-print) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200 no-print">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-black" />
            <h3 className="text-base font-bold text-zinc-900">Official HR Participation & Attendance Record</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-black hover:bg-zinc-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-black p-1.5 rounded-lg hover:bg-zinc-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Body */}
        <div id="printable-payslip" className="space-y-6 text-zinc-900">
          {/* Header with SPAR Academy Logo */}
          <div className="border-b-2 border-black pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-lg border border-zinc-200">
                <img
                  src={sparLogo}
                  alt="SPAR Academy of Learning"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900">
                  SPAR Group (Pty) Ltd
                </div>
                <div className="text-[10px] text-zinc-500">
                  Human Resources Department • SETA / W&RSETA Youth Skills Audit Record
                </div>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-zinc-300 sm:pl-4">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                HR Attendance Audit Slip
              </div>
              <div className="text-xs font-mono font-bold text-zinc-900">{record.cycle_name}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                Period: {formatDate(record.period_start)} - {formatDate(record.period_end)}
              </div>
            </div>
          </div>

          {/* Learner & Programme Information */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                Learner Details
              </span>
              <div>
                <strong>Name:</strong> {learner.first_name} {learner.last_name}
              </div>
              <div>
                <strong>Learner Code:</strong> <span className="font-mono font-bold">{learner.learner_code}</span>
              </div>
              <div>
                <strong>Email:</strong> <span className="font-medium text-zinc-900">{learner.email || `${learner.first_name.toLowerCase()}.${learner.last_name.toLowerCase()}@sparacademy.co.za`}</span>
              </div>
              <div>
                <strong>Contact Phone:</strong> <span>{learner.phone || '072 841 0921'}</span>
              </div>
              <div>
                <strong>Enrolment Date:</strong> {formatDate(learner.joined_date)}
              </div>
              <div>
                <strong>Status:</strong>{' '}
                <span className={isDropped ? 'text-zinc-900 font-bold' : 'text-black font-bold'}>
                  {isDropped ? `Exited on ${formatDate(learner.exit_date)}` : 'Active in Programme'}
                </span>
              </div>
            </div>

            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                Programme & Training Track
              </span>
              <div>
                <strong>Track / Role:</strong> {learner.programme_name} ({learner.programme_department})
              </div>
              <div>
                <strong>Cohort Code:</strong> <span className="font-mono">{learner.cohort_code}</span>
              </div>
              <div>
                <strong>Branch Location:</strong> {learner.branch_location || 'SUPERSPAR Sandton City'}
              </div>
              <div>
                <strong>Supervisor:</strong> {learner.supervisor_name}
              </div>
              <div>
                <strong>Shift Hours:</strong> {learner.shift_start || '07:30'} - {learner.shift_end || '16:00'}
              </div>
            </div>
          </div>

          {/* Attendance Breakdown Box (Including Approved Leave) */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5">
            <div className="text-xs font-bold text-zinc-900 mb-2 flex items-center justify-between">
              <span>Attendance & Participation Breakdown</span>
              <span className="text-xs font-bold text-black">
                Participation Rate: {learner.attendance_rate || Math.round((((learner.days_present || 0) + (learner.days_leave || 0)) / Math.max(1, learner.scheduled_days)) * 100)}%
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-zinc-200">
                <span className="text-[9px] text-zinc-500 uppercase font-bold block">Scheduled</span>
                <span className="font-bold text-zinc-900 text-sm">{learner.scheduled_days}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-zinc-200">
                <span className="text-[9px] text-zinc-500 uppercase font-bold block">Present</span>
                <span className="font-bold text-black text-sm">{learner.days_present}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-zinc-200">
                <span className="text-[9px] text-zinc-500 uppercase font-bold block">Late</span>
                <span className="font-bold text-zinc-800 text-sm">{learner.days_late}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-zinc-200">
                <span className="text-[9px] text-zinc-500 uppercase font-bold block">Sick Note</span>
                <span className="font-bold text-zinc-800 text-sm">{learner.days_excused}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-zinc-200">
                <span className="text-[9px] text-zinc-500 uppercase font-bold block">Leave</span>
                <span className="font-bold text-zinc-800 text-sm">{learner.days_leave || 0}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-zinc-200">
                <span className="text-[9px] text-zinc-500 uppercase font-bold block">Absent</span>
                <span className="font-bold text-black text-sm">{learner.days_unexcused}</span>
              </div>
            </div>
          </div>

          {/* Outcome & Compliance Box */}
          <div className="p-4 rounded-xl border border-zinc-300 bg-zinc-50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-black" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                  HR Qualification & Audit Finding
                </span>
                <span className="text-sm font-extrabold text-black">
                  {outcome.label}
                </span>
              </div>
            </div>
            <div className="text-xs text-zinc-700 mt-2">
              {learner.notes || (isDropped
                ? `Learner exited early on ${formatDate(learner.exit_date)} (${learner.exit_reason || 'Left programme'}). Total ${learner.days_present} days credited for training records.`
                : learner.days_unexcused === 0
                ? 'Excellent attendance record. All scheduled retail skills development shifts and approved leave days fulfilled.'
                : `Recorded ${learner.days_unexcused} unexcused absence(s).`)}
            </div>
          </div>

          {/* Signatures / Disclaimer Footer */}
          <div className="pt-6 border-t border-zinc-200 grid grid-cols-2 gap-8 text-[10px] text-zinc-500">
            <div>
              <div className="border-b border-zinc-300 pb-1 mb-1 font-semibold text-zinc-700">
                Reconciled by: Brenda Khanyile (Store HR Administrator)
              </div>
              <div>SPAR Academy of Learning • Official Compliance Audit</div>
            </div>
            <div>
              <div className="border-b border-zinc-300 pb-1 mb-1 font-semibold text-zinc-700">
                Verified by: {learner.supervisor_name} (Track Supervisor)
              </div>
              <div>Audit Ref: SPAR-REC-{learner.learner_code}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
