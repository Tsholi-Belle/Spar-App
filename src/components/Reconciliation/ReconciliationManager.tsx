import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Printer,
  ChevronRight,
  ShieldCheck,
  UserX,
  X,
  Award,
  Filter,
  Layers,
  UserCheck,
} from 'lucide-react';
import { api } from '../../api/client';
import {
  ReconciliationRun,
  ReconciliationItem,
  Programme,
  ReconciliationStatus,
} from '../../types';
import {
  formatDate,
  departmentConfig,
  reconciliationStatusConfig,
  outcomeConfig,
} from '../../utils/formatters';
import { ParticipationCertificateModal } from './ParticipationCertificateModal';

export const ReconciliationManager: React.FC = () => {
  const [runs, setRuns] = useState<ReconciliationRun[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRunDetail, setSelectedRunDetail] = useState<
    (ReconciliationRun & { items: ReconciliationItem[] }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Certificate Modal state
  const [certModalState, setCertModalState] = useState<{
    runId: string;
    learnerId: string;
  } | null>(null);

  // New Run Wizard state
  const [wizardForm, setWizardForm] = useState({
    cycle_name: 'August 2026 SPAR Youth Academy Attendance Reconciliation',
    period_start: '2026-08-01',
    period_end: '2026-08-31',
    programme_id: '',
    notes: 'End-of-period participation and attendance audit for SPAR retail academy cohorts.',
  });

  const [previewData, setPreviewData] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [itemSearch, setItemSearch] = useState('');
  const [itemStatusFilter, setItemStatusFilter] = useState('All');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRunId) {
      loadRunDetail(selectedRunId);
    }
  }, [selectedRunId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [runsData, progsData] = await Promise.all([
        api.getReconciliations(),
        api.getProgrammes(),
      ]);
      setRuns(runsData);
      setProgrammes(progsData);
      if (runsData.length > 0 && !selectedRunId) {
        setSelectedRunId(runsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load reconciliations', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRunDetail = async (id: string) => {
    try {
      const detail = await api.getReconciliationById(id);
      setSelectedRunDetail(detail);
    } catch (err) {
      console.error('Failed to load run detail', err);
    }
  };

  const handleOpenCreateModal = () => {
    setWizardForm({
      cycle_name: 'August 2026 SPAR Youth Academy Attendance Reconciliation',
      period_start: '2026-08-01',
      period_end: '2026-08-31',
      programme_id: '',
      notes: 'End-of-period participation and attendance audit for SPAR retail academy cohorts.',
    });
    setPreviewData(null);
    setIsCreateModalOpen(true);
    handleFetchPreview('2026-08-01', '2026-08-31', '');
  };

  const handleFetchPreview = async (start: string, end: string, progId?: string) => {
    try {
      setPreviewLoading(true);
      const prev = await api.previewReconciliation({
        period_start: start,
        period_end: end,
        programme_id: progId || undefined,
      });
      setPreviewData(prev);
    } catch (err) {
      console.error('Preview error', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreateRunSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createReconciliation(wizardForm);
      setIsCreateModalOpen(false);
      await loadData();
      setSelectedRunId(res.reconciliation_id);
    } catch (err: any) {
      alert(`Error creating reconciliation: ${err.message}`);
    }
  };

  const handleStatusTransition = async (newStatus: ReconciliationStatus) => {
    if (!selectedRunDetail) return;
    try {
      await api.updateReconciliationStatus(selectedRunDetail.id, {
        status: newStatus,
        approved_by: 'Store HR Administrator Brenda Khanyile',
      });
      await loadData();
      await loadRunDetail(selectedRunDetail.id);
    } catch (err: any) {
      alert(`Status transition error: ${err.message}`);
    }
  };

  const handleDownloadAuditCSV = () => {
    if (!selectedRunDetail) return;
    window.open(`/api/reconciliation/${selectedRunDetail.id}/export-bank-csv`, '_blank');
  };

  const filteredItems = selectedRunDetail?.items?.filter((item) => {
    const matchSearch =
      `${item.first_name} ${item.last_name}`.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.learner_code.toLowerCase().includes(itemSearch.toLowerCase());
    const matchStatus =
      itemStatusFilter === 'All' ||
      (itemStatusFilter === 'dropped_out' && !!item.exit_date) ||
      (itemStatusFilter === 'active' && !item.exit_date) ||
      (itemStatusFilter === 'absences' && item.days_unexcused > 0);
    return matchSearch && matchStatus;
  });

  const certifiedCount = selectedRunDetail?.items?.filter((i) => !i.exit_date && i.days_unexcused <= 1).length || 0;
  const dropoutCount = selectedRunDetail?.items?.filter((i) => !!i.exit_date).length || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">
              HR Attendance & Participation Reconciliation
            </h2>
            <span className="bg-zinc-100 text-zinc-800 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-zinc-300">
              Audit & Sign-Off Engine
            </span>
          </div>
          <p className="text-zinc-500 text-xs mt-0.5">
            Reconcile learner participation days, excused clinic leaves, and early exits to verify qualification outcomes and generate official W&RSETA audit certificates.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 bg-black hover:bg-zinc-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Attendance Reconciliation</span>
        </button>
      </div>

      {/* Cycle Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {runs.map((r) => {
          const isSelected = selectedRunId === r.id;
          const statusCfg = reconciliationStatusConfig[r.status] || reconciliationStatusConfig.draft;

          return (
            <div
              key={r.id}
              onClick={() => setSelectedRunId(r.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-black text-white border-black shadow-md ring-2 ring-zinc-400'
                  : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-400'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    isSelected
                      ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                      : 'bg-zinc-100 text-zinc-800 border-zinc-300'
                  }`}
                >
                  {statusCfg.label}
                </span>
                <span className={`text-[11px] font-mono ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {r.total_learners} Learners
                </span>
              </div>

              <div className={`font-bold text-sm line-clamp-1 ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                {r.cycle_name}
              </div>

              <div className={`text-xs mt-1 ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Period: {formatDate(r.period_start)} - {formatDate(r.period_end)}
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-200/40 flex items-center justify-between text-xs">
                <span className={isSelected ? 'text-zinc-400' : 'text-zinc-500'}>Status:</span>
                <span className={`font-bold ${isSelected ? 'text-white' : 'text-black'}`}>
                  {statusCfg.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Run Details View */}
      {selectedRunDetail && (
        <div className="space-y-6">
          {/* Status & Approval Pipeline */}
          <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900">{selectedRunDetail.cycle_name}</h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-300">
                  {reconciliationStatusConfig[selectedRunDetail.status]?.label}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Audit Window: {formatDate(selectedRunDetail.period_start)} to{' '}
                {formatDate(selectedRunDetail.period_end)} • {selectedRunDetail.programme_name || 'All Store Programmes'}
              </p>
              {selectedRunDetail.approved_by && (
                <div className="text-[11px] text-zinc-700 font-bold mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-black" />
                  <span>
                    Approved by {selectedRunDetail.approved_by} on {selectedRunDetail.approved_at}
                  </span>
                </div>
              )}
            </div>

            {/* Workflow Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedRunDetail.status === 'draft' && (
                <button
                  onClick={() => handleStatusTransition('reviewed')}
                  className="bg-zinc-100 hover:bg-zinc-200 text-black border border-zinc-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Mark Supervisor Verified
                </button>
              )}

              {selectedRunDetail.status === 'reviewed' && (
                <button
                  onClick={() => handleStatusTransition('approved')}
                  className="bg-black hover:bg-zinc-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  HR Manager Approval & Sign-Off
                </button>
              )}

              {selectedRunDetail.status === 'approved' && (
                <button
                  onClick={() => handleStatusTransition('closed')}
                  className="bg-black hover:bg-zinc-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Close & Archive Cycle
                </button>
              )}

              <button
                onClick={handleDownloadAuditCSV}
                className="flex items-center gap-1.5 bg-black hover:bg-zinc-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Attendance Audit (CSV)</span>
              </button>
            </div>
          </div>

          {/* Audit Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Learners Audited</span>
              <span className="text-2xl font-extrabold text-zinc-900 mt-1 block">
                {selectedRunDetail.total_learners}
              </span>
              <span className="text-[10px] text-zinc-500">Across 5 departments</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Met Target / Certified</span>
              <span className="text-2xl font-extrabold text-zinc-900 mt-1 block">
                {certifiedCount}
              </span>
              <span className="text-[10px] text-zinc-500">&gt; 85% attendance standard</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Early Exits / Dropouts</span>
              <span className="text-2xl font-extrabold text-zinc-900 mt-1 block">
                {dropoutCount}
              </span>
              <span className="text-[10px] text-zinc-500">Pro-rated attendance credited</span>
            </div>

            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-700 block">Audit Compliance</span>
              <span className="text-2xl font-extrabold text-black mt-1 block">
                Verified
              </span>
              <span className="text-[10px] text-zinc-600 font-medium">Ready for SETA submission</span>
            </div>
          </div>

          {/* Line Items Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <input
              type="text"
              placeholder="Search learner name or ID..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black"
            />

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setItemStatusFilter('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                  itemStatusFilter === 'All' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                All Learners ({selectedRunDetail.items?.length})
              </button>
              <button
                onClick={() => setItemStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                  itemStatusFilter === 'active' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setItemStatusFilter('dropped_out')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                  itemStatusFilter === 'dropped_out' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                Pro-Rated Exits
              </button>
              <button
                onClick={() => setItemStatusFilter('absences')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                  itemStatusFilter === 'absences' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                With Absences
              </button>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700 font-bold border-b border-zinc-200">
                    <th className="py-3 px-4">Learner</th>
                    <th className="py-3 px-4">Department Track</th>
                    <th className="py-3 px-4 text-center">Scheduled Days</th>
                    <th className="py-3 px-4">Attendance Breakdown</th>
                    <th className="py-3 px-4 text-center font-bold text-zinc-900">Participation Rate</th>
                    <th className="py-3 px-4">HR Qualification Finding</th>
                    <th className="py-3 px-4 text-right">Audit Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredItems?.map((item) => {
                    const isDropped = !!item.exit_date;
                    const rate = Math.min(
                      100,
                      Math.round(((item.days_present + item.days_half * 0.5) / Math.max(1, item.scheduled_days)) * 100)
                    );
                    const outcomeKey = isDropped
                      ? 'pro_rata_exit'
                      : rate >= 85
                      ? 'certified'
                      : 'in_progress';
                    const outcome = outcomeConfig[outcomeKey];

                    return (
                      <tr key={item.learner_id} className={`hover:bg-zinc-50 ${isDropped ? 'bg-zinc-50/50' : ''}`}>
                        {/* Learner */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-zinc-900">
                            {item.first_name} {item.last_name}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
                            <span>{item.learner_code}</span>
                            {isDropped && (
                              <span className="text-zinc-800 font-bold bg-zinc-200 px-1.5 py-0.2 rounded">
                                Left {formatDate(item.exit_date)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-300 bg-zinc-100 text-zinc-800 inline-block">
                            {item.programme_department}
                          </span>
                        </td>

                        {/* Scheduled Days */}
                        <td className="py-3 px-4 text-center font-semibold text-zinc-800">
                          {item.scheduled_days} Days
                        </td>

                        {/* Attendance Summary */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-zinc-900 font-bold">
                              {item.days_present} Present
                            </span>
                            {item.days_late > 0 && (
                              <span className="text-zinc-600">({item.days_late} Late)</span>
                            )}
                            {item.days_excused > 0 && (
                              <span className="text-zinc-600">({item.days_excused} Sick)</span>
                            )}
                            {item.days_unexcused > 0 && (
                              <span className="text-zinc-900 font-bold bg-zinc-200 px-1 py-0.2 rounded">
                                {item.days_unexcused} Absent
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 italic mt-0.5 truncate max-w-xs">
                            {item.notes}
                          </div>
                        </td>

                        {/* Attendance Rate */}
                        <td className="py-3 px-4 text-center">
                          <span className="font-extrabold text-sm text-zinc-900">
                            {rate}%
                          </span>
                        </td>

                        {/* HR Outcome */}
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${outcome.bg} ${outcome.border}`}>
                            {outcome.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() =>
                              setCertModalState({
                                runId: selectedRunDetail.id,
                                learnerId: item.learner_id,
                              })
                            }
                            className="bg-black hover:bg-zinc-800 text-white px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer shadow-xs"
                          >
                            Certificate Slip
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Reconciliation Wizard Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">
                  New Attendance Reconciliation Cycle
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-black p-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRunSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Reconciliation Cycle Name *
                </label>
                <input
                  type="text"
                  required
                  value={wizardForm.cycle_name}
                  onChange={(e) => setWizardForm({ ...wizardForm, cycle_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black focus:bg-white font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Period Start *</label>
                  <input
                    type="date"
                    required
                    value={wizardForm.period_start}
                    onChange={(e) => {
                      setWizardForm({ ...wizardForm, period_start: e.target.value });
                      handleFetchPreview(e.target.value, wizardForm.period_end, wizardForm.programme_id);
                    }}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Period End *</label>
                  <input
                    type="date"
                    required
                    value={wizardForm.period_end}
                    onChange={(e) => {
                      setWizardForm({ ...wizardForm, period_end: e.target.value });
                      handleFetchPreview(wizardForm.period_start, e.target.value, wizardForm.programme_id);
                    }}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Programme Scope</label>
                  <select
                    value={wizardForm.programme_id}
                    onChange={(e) => {
                      setWizardForm({ ...wizardForm, programme_id: e.target.value });
                      handleFetchPreview(wizardForm.period_start, wizardForm.period_end, e.target.value);
                    }}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg font-bold"
                  >
                    <option value="">All Store Programmes</option>
                    {programmes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="bg-zinc-900 text-white rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                  <span>Live Audit Preview</span>
                  {previewLoading && <span className="text-zinc-400 font-normal">Auditing records...</span>}
                </div>

                {previewData && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-400 text-[10px] block">Audited Learners</span>
                      <span className="font-extrabold text-base text-white">
                        {previewData.total_learners}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px] block">Working Days</span>
                      <span className="font-extrabold text-base text-white">
                        {previewData.working_days_count} Days
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px] block">Estimated Certified</span>
                      <span className="font-extrabold text-base text-white">
                        {previewData.items?.filter((i: any) => !i.exit_date && i.days_unexcused <= 1).length || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px] block">Early Exits</span>
                      <span className="font-extrabold text-base text-white">
                        {previewData.items?.filter((i: any) => !!i.exit_date).length || 0}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Notes & Audit Remarks</label>
                <textarea
                  rows={2}
                  value={wizardForm.notes}
                  onChange={(e) => setWizardForm({ ...wizardForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black hover:bg-zinc-800 text-white font-bold px-5 py-2 rounded-lg text-xs shadow-xs cursor-pointer"
                >
                  Confirm & Generate Reconciliation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate / Audit Slip Modal */}
      {certModalState && (
        <ParticipationCertificateModal
          reconciliationId={certModalState.runId}
          learnerId={certModalState.learnerId}
          onClose={() => setCertModalState(null)}
        />
      )}
    </div>
  );
};
