import React, { useState, useEffect } from 'react';
import {
  Users,
  CalendarCheck,
  UserX,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  Phone,
  ChevronRight,
  ShieldAlert,
  FileCheck2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../../api/client';
import { AnalyticsOverview, DepartmentStat, AtRiskLearner, AuditLog } from '../../types';
import { departmentConfig } from '../../utils/formatters';

interface DashboardOverviewProps {
  setActiveTab: (tab: string) => void;
  onSelectProgramme?: (id: string) => void;
  onSelectLearner?: (id: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  setActiveTab,
  onSelectProgramme,
  onSelectLearner,
}) => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [departments, setDepartments] = useState<DepartmentStat[]>([]);
  const [atRisk, setAtRisk] = useState<AtRiskLearner[]>([]);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewData, deptData, atRiskData, actData] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getDepartmentStats(),
        api.getAtRiskLearners(),
        api.getAuditLogs(),
      ]);
      setOverview(overviewData);
      setDepartments(deptData);
      setAtRisk(atRiskData);
      setActivity(actData);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !overview) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-zinc-500 font-medium">Loading HR Academy Performance Data...</p>
        </div>
      </div>
    );
  }

  // Monochromatic Black & White shades for attendance distribution
  const attendancePieData = [
    { name: 'Present (Full Day)', value: overview.attendance_breakdown?.present_count || 0, color: '#18181b' },
    { name: 'Half Day', value: overview.attendance_breakdown?.half_day_count || 0, color: '#52525b' },
    { name: 'Excused / Medical Note', value: overview.attendance_breakdown?.excused_count || 0, color: '#a1a1aa' },
    { name: 'Unexcused Absent', value: overview.attendance_breakdown?.absent_count || 0, color: '#d4d4d8' },
  ];

  const retentionRate =
    overview.total_learners > 0
      ? Number((((overview.total_learners - overview.dropped_out_learners) / overview.total_learners) * 100).toFixed(1))
      : 100;

  return (
    <div className="space-y-6 pb-12">
      {/* Black & White Hero Card */}
      <div className="bg-black rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-zinc-800 text-zinc-300 text-[11px] px-2.5 py-0.5 rounded-md font-semibold border border-zinc-700">
              August 2026 Active Cycle
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-zinc-400 text-xs">5 Tracks Active</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            SPAR Academy Attendance & Participation Portal
          </h2>
          <p className="text-zinc-400 text-xs mt-1 max-w-2xl">
            Real-time learner roll-call verification, attendance audits, and end-of-programme SETA qualification reconciliation.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('attendance')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 text-black font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-xs"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Mark Daily Roll-Call</span>
          </button>
          <button
            onClick={() => setActiveTab('reconciliation')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-2.5 rounded-xl text-xs transition-all border border-zinc-700 cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>HR Reconciliation</span>
          </button>
          <button
            onClick={() => setActiveTab('kiosk')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium px-3.5 py-2.5 rounded-xl text-xs transition-all border border-zinc-700 cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>Kiosk Terminal</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Learners */}
        <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Active Learners</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-black flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900">{overview.active_learners}</span>
            <span className="text-xs text-zinc-500 font-medium">/ {overview.target_headcount} Capacity</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
            <span>Enrolment rate</span>
            <span className="font-bold text-zinc-900">{overview.enrolment_rate}%</span>
          </div>
        </div>

        {/* Monthly Attendance Rate */}
        <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Aug Attendance Rate</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-black flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900">{overview.attendance_rate}%</span>
            <span className="text-xs text-zinc-600 font-medium flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +2.4% vs July
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
            <span>Target qualification threshold</span>
            <span className="font-bold text-zinc-900">&gt; 85% Required</span>
          </div>
        </div>

        {/* Programme Dropouts / Exits */}
        <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Early Exits / Dropouts</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-black flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900">{overview.dropped_out_learners}</span>
            <span className="text-xs text-zinc-500 font-medium">({overview.dropout_rate}%)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
            <span>Participation record</span>
            <span className="font-bold text-zinc-900">Pro-Rated on Exit</span>
          </div>
        </div>

        {/* Programme Retention */}
        <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Programme Retention</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-black flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900">{retentionRate}%</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
            <span>Reconciliation status</span>
            <span className="font-bold text-zinc-900">Ready for HR Audit</span>
          </div>
        </div>
      </div>

      {/* Charts Row: Department Performance & Attendance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Attendance Comparison */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Department Participation & Attendance Rate</h2>
              <p className="text-xs text-zinc-500">Attendance percentage across retail training tracks for August 2026</p>
            </div>
            <button
              onClick={() => setActiveTab('programmes')}
              className="text-xs font-semibold text-black hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Programmes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#52525b' }} interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#52525b' }} unit="%" />
                <Tooltip
                  formatter={(value: any) => [`${value}% Attendance Rate`, 'Participation']}
                  labelFormatter={(label) => `${label} Track`}
                  contentStyle={{
                    backgroundColor: '#000000',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="attendance_rate" fill="#18181b" radius={[4, 4, 0, 0]} barSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Department Quick List */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-4 pt-4 border-t border-zinc-100">
            {departments.map((d) => {
              return (
                <div key={d.department} className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                  <div className="text-[11px] font-bold text-zinc-700 truncate">{d.department}</div>
                  <div className="text-sm font-extrabold text-zinc-900 mt-0.5">{d.attendance_rate}%</div>
                  <div className="text-[10px] text-zinc-500">{d.active_learners} Active Learners</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attendance Distribution Pie */}
        <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-900">Attendance Distribution</h2>
            <p className="text-xs text-zinc-500">Breakdown of recorded days this cycle</p>
          </div>

          <div className="h-48 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendancePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {attendancePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} Days`, 'Count']}
                  contentStyle={{
                    backgroundColor: '#000000',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {attendancePieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-zinc-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full border border-zinc-400" style={{ backgroundColor: item.color }}></span>
                  <span>{item.name}</span>
                </div>
                <span className="font-bold text-zinc-900">{item.value} days</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Columns: At-Risk Absentee Alerts & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* At-Risk Learner Alerts */}
        <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-zinc-100 text-black flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-900">Attendance Warnings & At-Risk Learners</h2>
                <p className="text-[11px] text-zinc-500">Learners requiring follow-up or clinic note verification</p>
              </div>
            </div>
            <span className="bg-zinc-100 text-zinc-900 border border-zinc-300 text-[11px] font-bold px-2 py-0.5 rounded-md">
              {atRisk.length} flagged
            </span>
          </div>

          <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
            {atRisk.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                No attendance alerts at this time. All learners are in good standing.
              </div>
            ) : (
              atRisk.map((lrn) => (
                <div key={lrn.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-zinc-900">
                        {lrn.first_name} {lrn.last_name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">{lrn.learner_code}</span>
                      <span className="text-[10px] bg-zinc-100 text-zinc-700 px-1.5 py-0.2 rounded font-medium border border-zinc-200">
                        {lrn.department}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-3">
                      <span>Supervisor: {lrn.supervisor_name}</span>
                      {lrn.phone && (
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Phone className="w-3 h-3" /> {lrn.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {lrn.unexcused_count > 0 && (
                      <span className="bg-zinc-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        {lrn.unexcused_count} Unexcused
                      </span>
                    )}
                    {lrn.late_count > 0 && (
                      <span className="bg-zinc-100 text-zinc-800 border border-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded">
                        {lrn.late_count} Late
                      </span>
                    )}
                    <button
                      onClick={() => setActiveTab('attendance')}
                      className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer"
                    >
                      Check
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Audit & Activity Log */}
        <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-zinc-100 text-black flex items-center justify-center">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-900">Recent HR Audit & Activity Trail</h2>
                <p className="text-[11px] text-zinc-500">System actions, roll-calls, exits, and attendance reconciliations</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
            {activity.slice(0, 7).map((act) => (
              <div key={act.id} className="py-2.5 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-black mt-1.5 shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-zinc-800 leading-snug">{act.details}</div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                    <span className="font-bold text-zinc-600">{act.user_role}</span>
                    <span>•</span>
                    <span>{act.created_at}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
