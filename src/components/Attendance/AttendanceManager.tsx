import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Search,
  CheckCircle2,
  Clock,
  Clock3,
  FileText,
  XCircle,
  UserX,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Award,
  AlertCircle,
  FileCheck2,
  X,
  Coffee,
  Calendar,
} from 'lucide-react';
import { api } from '../../api/client';
import {
  AttendanceRecord,
  Programme,
  AttendanceStatus,
  DailyRosterItem,
} from '../../types';
import {
  formatDate,
  formatShortDate,
  departmentConfig,
  attendanceStatusConfig,
} from '../../utils/formatters';

interface AttendanceManagerProps {
  selectedDeptFilter?: string;
  currentRole?: string;
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  selectedDeptFilter = 'All',
  currentRole = 'admin',
}) => {
  const [viewMode, setViewMode] = useState<'daily' | 'matrix'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-25');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>('All');
  const [search, setSearch] = useState<string>('');

  // Daily roster data
  const [dailyRoster, setDailyRoster] = useState<DailyRosterItem[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Monthly matrix data
  const [matrixData, setMatrixData] = useState<any | null>(null);
  const [matrixLoading, setMatrixLoading] = useState(false);

  // Clinic Note Modal state
  const [sickModalLearner, setSickModalLearner] = useState<any | null>(null);
  const [sickNotes, setSickNotes] = useState('');
  const [sickClinicName, setSickClinicName] = useState('Sandton Municipal Clinic');

  // Leave Modal state
  const [leaveModalLearner, setLeaveModalLearner] = useState<any | null>(null);
  const [leaveType, setLeaveType] = useState('Annual Leave');
  const [leaveNotes, setLeaveNotes] = useState('');
  const [leaveApprovedBy, setLeaveApprovedBy] = useState('Store HR Administrator Brenda Khanyile');

  useEffect(() => {
    loadProgrammes();
  }, []);

  useEffect(() => {
    if (viewMode === 'daily') {
      loadDailyRoster();
    } else {
      loadMatrix();
    }
  }, [viewMode, selectedDate, selectedMonth, selectedProgrammeId]);

  const loadProgrammes = async () => {
    try {
      const data = await api.getProgrammes();
      setProgrammes(data);
      if (data.length > 0 && selectedProgrammeId === 'All' && viewMode === 'matrix') {
        setSelectedProgrammeId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load programmes', err);
    }
  };

  const loadDailyRoster = async () => {
    try {
      setLoading(true);
      const progParam = selectedProgrammeId !== 'All' ? selectedProgrammeId : undefined;
      const res = await api.getRoster(selectedDate, progParam);
      setDailyRoster(res.data || []);
    } catch (err) {
      console.error('Failed to load daily roster', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMatrix = async () => {
    try {
      setMatrixLoading(true);
      const progId = selectedProgrammeId !== 'All' ? selectedProgrammeId : programmes[0]?.id;
      if (!progId) return;
      const res = await api.getMonthlyMatrix(progId, selectedMonth);
      setMatrixData(res);
    } catch (err) {
      console.error('Failed to load month matrix', err);
    } finally {
      setMatrixLoading(false);
    }
  };

  const handleStatusChange = async (
    learnerId: string,
    status: AttendanceStatus,
    extraNotes?: string,
    leaveDetails?: { leave_type?: string; leave_approved_by?: string }
  ) => {
    try {
      setSavingId(learnerId);
      // Optimistic update
      setDailyRoster((prev) =>
        prev.map((item) =>
          item.learner_id === learnerId
            ? {
                ...item,
                attendance_status: status,
                status: status,
                hours_worked: status === 'present' ? 8 : status === 'half_day' ? 4 : status === 'late' ? 7.5 : 0,
                supervisor_notes: extraNotes !== undefined ? extraNotes : item.supervisor_notes,
                leave_type: leaveDetails?.leave_type || item.leave_type,
                leave_approved_by: leaveDetails?.leave_approved_by || item.leave_approved_by,
              }
            : item
        )
      );

      await api.updateAttendance({
        learner_id: learnerId,
        date: selectedDate,
        status,
        supervisor_notes: extraNotes,
        leave_type: leaveDetails?.leave_type,
        leave_approved_by: leaveDetails?.leave_approved_by,
      });
    } catch (err: any) {
      alert(`Failed to record status: ${err.message}`);
      loadDailyRoster();
    } finally {
      setSavingId(null);
    }
  };

  const handleBulkMarkPresent = async () => {
    try {
      setLoading(true);
      const progParam = selectedProgrammeId !== 'All' ? selectedProgrammeId : undefined;
      await api.bulkUpdateAttendance({
        programme_id: progParam,
        date: selectedDate,
        status: 'present',
      });
      loadDailyRoster();
    } catch (err: any) {
      alert(`Bulk update error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSickModal = (learner: any) => {
    setSickModalLearner(learner);
    setSickNotes(learner.supervisor_notes || 'Medical Certificate / Clinic Note provided');
    setSickClinicName('Sandton Municipal Clinic');
  };

  const handleSaveSickModal = () => {
    if (!sickModalLearner) return;
    const fullNote = `${sickClinicName} • ${sickNotes}`;
    handleStatusChange(sickModalLearner.learner_id, 'excused_sick', fullNote);
    setSickModalLearner(null);
  };

  const handleOpenLeaveModal = (learner: any) => {
    setLeaveModalLearner(learner);
    setLeaveType(learner.leave_type || 'Annual Leave');
    setLeaveNotes(learner.supervisor_notes || 'Pre-approved formal leave request');
    setLeaveApprovedBy('Store HR Administrator Brenda Khanyile');
  };

  const handleSaveLeaveModal = () => {
    if (!leaveModalLearner) return;
    const fullNote = `[${leaveType}] Approved by ${leaveApprovedBy}. ${leaveNotes}`;
    handleStatusChange(leaveModalLearner.learner_id, 'leave', fullNote, {
      leave_type: leaveType,
      leave_approved_by: leaveApprovedBy,
    });
    setLeaveModalLearner(null);
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const filteredRoster = dailyRoster.filter((item) => {
    const matchSearch =
      `${item.first_name} ${item.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      item.learner_code.toLowerCase().includes(search.toLowerCase());

    const matchDept =
      selectedDeptFilter === 'All' || item.programme_department === selectedDeptFilter;

    return matchSearch && matchDept;
  });

  const presentCount = dailyRoster.filter((i) => i.status === 'present').length;
  const lateCount = dailyRoster.filter((i) => i.status === 'late').length;
  const sickCount = dailyRoster.filter((i) => i.status === 'excused_sick').length;
  const leaveCount = dailyRoster.filter((i) => i.status === 'leave').length;
  const absentCount = dailyRoster.filter((i) => i.status === 'unexcused_absent').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">
              {viewMode === 'daily' ? 'Daily Attendance Roll-Call' : 'Monthly Attendance Audit Matrix'}
            </h2>
            <span className="bg-zinc-100 text-zinc-800 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-zinc-300">
              {dailyRoster.length} Learners Scheduled
            </span>
          </div>
          <p className="text-zinc-500 text-xs mt-0.5">
            1-click status logging, tea break verification, approved leave tracking, doctor notes, and month-long SETA matrix.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'daily'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Daily Roll-Call
          </button>
          <button
            onClick={() => {
              setViewMode('matrix');
              if (selectedProgrammeId === 'All' && programmes.length > 0) {
                setSelectedProgrammeId(programmes[0].id);
              }
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Monthly Matrix Grid
          </button>
        </div>
      </div>

      {/* Date & Filter Controls Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {viewMode === 'daily' ? (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handlePrevDay}
              className="p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg">
              <CalendarIcon className="w-4 h-4 text-zinc-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-zinc-900 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={handleNextDay}
              className="p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-zinc-500 font-medium ml-1">
              {formatShortDate(selectedDate)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg">
              <CalendarIcon className="w-4 h-4 text-zinc-500" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-bold text-zinc-900 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Programme Filter & Search */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search learner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <select
            value={selectedProgrammeId}
            onChange={(e) => setSelectedProgrammeId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg font-bold text-zinc-800 focus:ring-2 focus:ring-black"
          >
            {viewMode === 'daily' && <option value="All">All Programmes</option>}
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {viewMode === 'daily' && (
            <button
              onClick={handleBulkMarkPresent}
              className="bg-black hover:bg-zinc-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              Bulk Mark Active Present
            </button>
          )}
        </div>
      </div>

      {/* Daily Quick Summary Pills (Including Leave) */}
      {viewMode === 'daily' && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white border border-zinc-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-zinc-900 text-white font-bold flex items-center justify-center text-xs">
                P
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Present</span>
                <span className="text-base font-extrabold text-zinc-900">{presentCount}</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded">Full Shift</span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-zinc-200 text-zinc-800 font-bold flex items-center justify-center text-xs">
                L
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Late</span>
                <span className="text-base font-extrabold text-zinc-900">{lateCount}</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded">Partial</span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-zinc-100 text-zinc-800 font-bold flex items-center justify-center text-xs border border-zinc-300">
                S
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Sick</span>
                <span className="text-base font-extrabold text-zinc-900">{sickCount}</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded">Clinic Note</span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-zinc-800 text-white font-bold flex items-center justify-center text-xs">
                LV
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Approved Leave</span>
                <span className="text-base font-extrabold text-zinc-900">{leaveCount}</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded">Authorized</span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-black text-white font-bold flex items-center justify-center text-xs">
                A
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Absent</span>
                <span className="text-base font-extrabold text-zinc-900">{absentCount}</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded">Unexcused</span>
          </div>
        </div>
      )}

      {/* VIEW 1: DAILY ROSTER TABLE */}
      {viewMode === 'daily' && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-100/80 text-zinc-700 font-bold border-b border-zinc-200">
                  <th className="py-3.5 px-4">Learner</th>
                  <th className="py-3.5 px-4">Track</th>
                  <th className="py-3.5 px-4">Scheduled Shift</th>
                  <th className="py-3.5 px-4 text-center">Status Action Pill</th>
                  <th className="py-3.5 px-4">Break Log & Timesheet Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-400">
                      Loading roll-call roster...
                    </td>
                  </tr>
                ) : filteredRoster.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-400">
                      No learners match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredRoster.map((item) => {
                    const isSaving = savingId === item.learner_id;
                    const isDropped = item.is_dropped_out || !!item.exit_date;
                    const currentStatus = (item.status || item.attendance_status || 'unexcused_absent') as AttendanceStatus;

                    return (
                      <tr
                        key={item.learner_id}
                        className={`hover:bg-zinc-50 transition-colors ${
                          isDropped ? 'bg-zinc-50/50 opacity-60' : ''
                        }`}
                      >
                        {/* Learner Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-black text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {item.first_name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-zinc-900 block">
                                {item.first_name} {item.last_name}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                {item.learner_code}
                              </span>
                              {isDropped && (
                                <span className="ml-2 text-[9px] font-bold text-zinc-800 bg-zinc-200 px-1 py-0.2 rounded">
                                  Exited
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Department Track */}
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-300 bg-zinc-100 text-zinc-800">
                            {item.programme_department}
                          </span>
                        </td>

                        {/* Shift Times */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-zinc-800">
                            {item.shift_start} - {item.shift_end}
                          </div>
                          <div className="text-[10px] text-zinc-500">Mon - Fri Shift</div>
                        </td>

                        {/* Status Toggle Buttons (Black & White, including LEAVE) */}
                        <td className="py-3.5 px-4 text-center">
                          {isDropped ? (
                            <span className="text-xs font-bold text-zinc-500 italic">
                              Learner Exited Programme
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                              {/* PRESENT */}
                              <button
                                onClick={() => handleStatusChange(item.learner_id, 'present')}
                                disabled={isSaving}
                                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === 'present'
                                    ? 'bg-black text-white shadow-xs'
                                    : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                                }`}
                              >
                                Present
                              </button>

                              {/* LATE */}
                              <button
                                onClick={() => handleStatusChange(item.learner_id, 'late')}
                                disabled={isSaving}
                                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === 'late'
                                    ? 'bg-black text-white shadow-xs'
                                    : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                                }`}
                              >
                                Late
                              </button>

                              {/* HALF DAY */}
                              <button
                                onClick={() => handleStatusChange(item.learner_id, 'half_day')}
                                disabled={isSaving}
                                className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === 'half_day'
                                    ? 'bg-black text-white shadow-xs'
                                    : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                                }`}
                              >
                                Half
                              </button>

                              {/* SICK NOTE */}
                              <button
                                onClick={() => handleOpenSickModal(item)}
                                disabled={isSaving}
                                className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === 'excused_sick'
                                    ? 'bg-black text-white shadow-xs'
                                    : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                                }`}
                              >
                                Sick Note
                              </button>

                              {/* LEAVE */}
                              <button
                                onClick={() => handleOpenLeaveModal(item)}
                                disabled={isSaving}
                                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === 'leave'
                                    ? 'bg-black text-white shadow-xs'
                                    : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                                }`}
                              >
                                Leave
                              </button>

                              {/* ABSENT */}
                              <button
                                onClick={() => handleStatusChange(item.learner_id, 'unexcused_absent')}
                                disabled={isSaving}
                                className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === 'unexcused_absent'
                                    ? 'bg-black text-white shadow-xs'
                                    : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Timesheet Details & Tea Break */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs text-zinc-900 flex items-center gap-2">
                            <span>
                              {item.clock_in_time ? `${item.clock_in_time} - ${item.clock_out_time || 'In Progress'}` : 'No punch logged'}
                            </span>
                            {item.hours_worked !== undefined && item.hours_worked > 0 && (
                              <span className="font-bold text-black">({item.hours_worked}h)</span>
                            )}
                          </div>

                          {/* Tea break indicator */}
                          {item.tea_break_start && (
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-700 mt-1 font-mono">
                              <Coffee className="w-3 h-3 text-black shrink-0" />
                              <span>
                                Tea Break: {item.tea_break_start} - {item.tea_break_end || 'On Break'}
                              </span>
                            </div>
                          )}

                          {item.leave_type && (
                            <div className="text-[10px] text-zinc-800 font-semibold mt-0.5">
                              Leave Type: {item.leave_type}
                            </div>
                          )}

                          {item.supervisor_notes && (
                            <div className="text-[10px] text-zinc-500 italic truncate max-w-xs mt-0.5">
                              {item.supervisor_notes}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: MONTHLY MATRIX GRID */}
      {viewMode === 'matrix' && matrixData && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Attendance Matrix for {matrixData.year_month}
            </h3>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-black inline-block"></span> Present (P)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-zinc-300 inline-block"></span> Sick (S)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-zinc-800 text-white inline-block text-center leading-2.5 text-[8px]">LV</span> Leave
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-zinc-400 inline-block"></span> Late (L)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded border border-zinc-400 inline-block"></span> Absent (A)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-[10px]">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700 font-bold border-b border-zinc-200">
                  <th className="py-2.5 px-3 text-left sticky left-0 bg-zinc-100 z-10 min-w-40">
                    Learner Name
                  </th>
                  <th className="py-2.5 px-2 text-left sticky left-40 bg-zinc-100 z-10 min-w-20">
                    Code
                  </th>
                  {Array.from({ length: 31 }, (_, i) => {
                    const dayNum = String(i + 1).padStart(2, '0');
                    return (
                      <th key={dayNum} className="py-2.5 px-1 min-w-7 border-l border-zinc-200 font-mono">
                        {dayNum}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {matrixData.learners?.map((lrn: any) => {
                  const learnerAtt = matrixData.attendance?.[lrn.id] || {};

                  return (
                    <tr key={lrn.id} className="hover:bg-zinc-50">
                      <td className="py-2 px-3 text-left font-bold text-zinc-900 sticky left-0 bg-white z-10 whitespace-nowrap">
                        {lrn.first_name} {lrn.last_name}
                      </td>
                      <td className="py-2 px-2 text-left text-zinc-500 sticky left-40 bg-white z-10 whitespace-nowrap font-mono">
                        {lrn.learner_code}
                      </td>

                      {Array.from({ length: 31 }, (_, i) => {
                        const dayNum = String(i + 1).padStart(2, '0');
                        const fullDate = `${matrixData.year_month}-${dayNum}`;
                        const rec = learnerAtt[fullDate];
                        const status = rec?.status;

                        return (
                          <td key={fullDate} className="py-2 px-1 border-l border-zinc-100 text-center">
                            {status === 'present' && (
                              <span className="inline-block w-4 h-4 rounded bg-black text-white font-bold leading-4 text-[9px]">
                                P
                              </span>
                            )}
                            {status === 'late' && (
                              <span className="inline-block w-4 h-4 rounded bg-zinc-400 text-black font-bold leading-4 text-[9px]">
                                L
                              </span>
                            )}
                            {status === 'half_day' && (
                              <span className="inline-block w-4 h-4 rounded bg-zinc-200 text-zinc-800 font-bold leading-4 text-[9px]">
                                H
                              </span>
                            )}
                            {status === 'excused_sick' && (
                              <span className="inline-block w-4 h-4 rounded bg-zinc-200 text-zinc-800 font-bold leading-4 text-[9px]">
                                S
                              </span>
                            )}
                            {status === 'leave' && (
                              <span className="inline-block w-4 h-4 rounded bg-zinc-800 text-white font-bold leading-4 text-[8px]">
                                LV
                              </span>
                            )}
                            {status === 'unexcused_absent' && (
                              <span className="inline-block w-4 h-4 rounded border border-zinc-900 text-zinc-900 font-bold leading-3.5 text-[9px]">
                                A
                              </span>
                            )}
                            {status === 'left_program' && (
                              <span className="text-zinc-300 font-mono">-</span>
                            )}
                            {!status && <span className="text-zinc-200">•</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leave Approval Modal */}
      {leaveModalLearner && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Record Approved Leave</h3>
                  <p className="text-xs text-zinc-500">
                    {leaveModalLearner.first_name} {leaveModalLearner.last_name} ({leaveModalLearner.learner_code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLeaveModalLearner(null)}
                className="text-zinc-400 hover:text-black p-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-800 mb-1">Leave Category / Reason *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black font-semibold"
                >
                  <option value="Annual Leave">Annual Leave (Scheduled Training Recess)</option>
                  <option value="Study / Exam Leave">Study & Assessment Leave (SETA Preparation)</option>
                  <option value="Family Responsibility">Family Responsibility Leave</option>
                  <option value="Compassionate Leave">Compassionate / Bereavement Leave</option>
                  <option value="Authorized Unpaid Leave">Authorized Special Leave</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-800 mb-1">Approving HR Manager / Officer</label>
                <input
                  type="text"
                  value={leaveApprovedBy}
                  onChange={(e) => setLeaveApprovedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 mb-1">Leave Application Reference / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Record leave application reference number, approved dates..."
                  value={leaveNotes}
                  onChange={(e) => setLeaveNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                ></textarea>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 flex justify-end gap-2">
              <button
                onClick={() => setLeaveModalLearner(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLeaveModal}
                className="bg-black hover:bg-zinc-800 text-white font-bold px-4 py-2 text-xs rounded-lg shadow-xs cursor-pointer"
              >
                Approve & Record Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sick Leave / Doctor Note Modal */}
      {sickModalLearner && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 text-black flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Attach Medical Note</h3>
                  <p className="text-xs text-zinc-500">
                    {sickModalLearner.first_name} {sickModalLearner.last_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSickModalLearner(null)}
                className="text-zinc-400 hover:text-black p-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-800 mb-1">Clinic / Hospital / Doctor Name</label>
                <input
                  type="text"
                  value={sickClinicName}
                  onChange={(e) => setSickClinicName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 mb-1">Doctor's Certificate Ref / Notes</label>
                <textarea
                  rows={3}
                  value={sickNotes}
                  onChange={(e) => setSickNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                ></textarea>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 flex justify-end gap-2">
              <button
                onClick={() => setSickModalLearner(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSickModal}
                className="bg-black hover:bg-zinc-800 text-white font-bold px-4 py-2 text-xs rounded-lg shadow-xs cursor-pointer"
              >
                Confirm Medical Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
