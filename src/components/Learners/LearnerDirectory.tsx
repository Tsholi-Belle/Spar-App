import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  UserCheck,
  UserX,
  Calendar,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  X,
  ChevronRight,
  ShieldCheck,
  Info,
  Clock,
  Award,
  Edit,
  Save,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../api/client';
import { Learner, Programme, LearnerStatus } from '../../types';
import {
  formatDate,
  departmentConfig,
  learnerStatusConfig,
} from '../../utils/formatters';

interface LearnerDirectoryProps {
  onSelectLearner?: (id: string) => void;
}

export const LearnerDirectory: React.FC<LearnerDirectoryProps> = ({ onSelectLearner }) => {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modals & Profile Drawer
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPrivatePin, setShowPrivatePin] = useState(false);
  const [activeLearnerForExit, setActiveLearnerForExit] = useState<Learner | null>(null);
  const [selectedLearnerDetail, setSelectedLearnerDetail] = useState<any>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Edit form state inside profile modal
  const [editForm, setEditForm] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    programme_id: string;
    status: LearnerStatus;
    pin_code: string;
  }>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    programme_id: '',
    status: 'active',
    pin_code: '',
  });

  // Enroll Form state
  const [enrollForm, setEnrollForm] = useState({
    programme_id: '',
    first_name: '',
    last_name: '',
    learner_code: '',
    pin_code: '',
    phone: '',
    email: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    joined_date: new Date().toISOString().split('T')[0],
  });

  // Exit Form state
  const [exitForm, setExitForm] = useState({
    exit_date: new Date().toISOString().split('T')[0],
    exit_reason: 'Offered permanent employment in retail store',
    exit_notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [learnersData, programmesData] = await Promise.all([
        api.getLearners(),
        api.getProgrammes(),
      ]);
      setLearners(learnersData);
      setProgrammes(programmesData);
      if (programmesData.length > 0 && !enrollForm.programme_id) {
        setEnrollForm((prev) => ({ ...prev, programme_id: programmesData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load learners', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEnrollModal = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    const randomCode = `SPAR-${Date.now().toString().slice(-4)}`;
    setEnrollForm({
      programme_id: programmes[0]?.id || '',
      first_name: '',
      last_name: '',
      learner_code: randomCode,
      pin_code: randomPin,
      phone: '',
      email: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      joined_date: new Date().toISOString().split('T')[0],
    });
    setIsEnrollModalOpen(true);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLearner(enrollForm);
      setIsEnrollModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error enrolling learner: ${err.message}`);
    }
  };

  const handleOpenProfileModal = async (id: string, startInEditMode = false) => {
    try {
      setSaveSuccessNotice(null);
      setShowPrivatePin(false);
      const data = await api.getLearnerById(id);
      setSelectedLearnerDetail(data);
      setEditForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || `${data.first_name.toLowerCase()}.${data.last_name.toLowerCase()}@sparacademy.co.za`,
        phone: data.phone || '072 841 0921',
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
        programme_id: data.programme_id || programmes[0]?.id || '',
        status: data.status || 'active',
        pin_code: data.pin_code || '1234',
      });
      setIsEditMode(startInEditMode);
      setIsProfileModalOpen(true);
    } catch (err) {
      console.error('Failed to load learner details', err);
    }
  };

  const handleSaveProfileEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLearnerDetail) return;

    try {
      setSavingEdit(true);
      await api.updateLearner(selectedLearnerDetail.id, editForm);
      // Reload details
      const updated = await api.getLearnerById(selectedLearnerDetail.id);
      setSelectedLearnerDetail(updated);
      setIsEditMode(false);
      setSaveSuccessNotice('Learner profile details updated successfully.');
      loadData();
      setTimeout(() => setSaveSuccessNotice(null), 3000);
    } catch (err: any) {
      alert(`Error updating profile: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenExitModal = (learner: Learner, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveLearnerForExit(learner);
    setExitForm({
      exit_date: new Date().toISOString().split('T')[0],
      exit_reason: 'Offered permanent employment in retail store',
      exit_notes: '',
    });
    setIsExitModalOpen(true);
  };

  const handleExitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLearnerForExit) return;

    try {
      await api.recordLearnerExit(activeLearnerForExit.id, exitForm);
      setIsExitModalOpen(false);
      setActiveLearnerForExit(null);
      if (selectedLearnerDetail?.id === activeLearnerForExit.id) {
        const updated = await api.getLearnerById(activeLearnerForExit.id);
        setSelectedLearnerDetail(updated);
      }
      loadData();
    } catch (err: any) {
      alert(`Error recording exit: ${err.message}`);
    }
  };

  const filteredLearners = learners.filter((lrn) => {
    const matchSearch =
      `${lrn.first_name} ${lrn.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      (lrn.email && lrn.email.toLowerCase().includes(search.toLowerCase())) ||
      (lrn.phone && lrn.phone.toLowerCase().includes(search.toLowerCase()));

    const matchProg = selectedProgramme === 'All' || lrn.programme_id === selectedProgramme;
    const matchStatus = selectedStatus === 'All' || lrn.status === selectedStatus;

    return matchSearch && matchProg && matchStatus;
  });

  const activeCount = learners.filter((l) => l.status === 'active').length;
  const droppedCount = learners.filter((l) => l.status === 'dropped_out').length;
  const completedCount = learners.filter((l) => l.status === 'completed').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">Youth Skills Learners Directory</h2>
            <span className="bg-zinc-100 text-zinc-800 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-zinc-300">
              {learners.length} Registered Learners
            </span>
          </div>
          <p className="text-zinc-500 text-xs mt-0.5">
            Click any learner account to view or edit their full profile, contact details, supervisor track, and participation logs.
          </p>
        </div>

        <button
          onClick={handleOpenEnrollModal}
          className="flex items-center justify-center gap-2 bg-black hover:bg-zinc-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Enroll New Learner</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Active Learners</span>
            <span className="text-2xl font-extrabold text-zinc-900">{activeCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-zinc-100 text-black flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Completed / Graduated</span>
            <span className="text-2xl font-extrabold text-zinc-900">{completedCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-zinc-100 text-black flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Exited / Dropped Out</span>
            <span className="text-2xl font-extrabold text-zinc-900">{droppedCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center">
            <UserX className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by learner name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedProgramme}
            onChange={(e) => setSelectedProgramme(e.target.value)}
            className="px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-semibold text-zinc-800"
          >
            <option value="All">All Programmes</option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-semibold text-zinc-800"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="dropped_out">Exited / Dropped Out</option>
            <option value="medical_leave">Medical Leave</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Minimal Learners Table: Strictly Name, Department, Status, Actions */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-100/80 text-zinc-700 font-bold border-b border-zinc-200">
                <th className="py-3 px-4">Learner Name</th>
                <th className="py-3 px-4">Department Track</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-zinc-400">
                    Loading learner profiles...
                  </td>
                </tr>
              ) : filteredLearners.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-zinc-400">
                    No learners match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLearners.map((lrn) => {
                  return (
                    <tr
                      key={lrn.id}
                      onClick={() => handleOpenProfileModal(lrn.id, false)}
                      className="hover:bg-zinc-50 transition-colors cursor-pointer group"
                    >
                      {/* Learner Name Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-black text-white font-bold flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                            {lrn.first_name.charAt(0)}
                            {lrn.last_name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-zinc-900 block group-hover:underline">
                              {lrn.first_name} {lrn.last_name}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-medium">
                              Click to view profile & contact info
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department Track Column */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-800">{lrn.programme_name}</div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-300 bg-zinc-100 text-zinc-800 inline-block mt-0.5">
                          {lrn.programme_department}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded border inline-block ${
                            lrn.status === 'active'
                              ? 'bg-zinc-900 text-white border-zinc-900'
                              : lrn.status === 'dropped_out'
                              ? 'bg-zinc-100 text-zinc-800 border-zinc-300'
                              : 'bg-zinc-200 text-zinc-800 border-zinc-400'
                          }`}
                        >
                          {lrn.status.toUpperCase()}
                        </span>
                        {lrn.exit_date && (
                          <div className="text-[10px] text-zinc-600 font-medium mt-1">
                            Left: {formatDate(lrn.exit_date)}
                          </div>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="py-3 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleOpenProfileModal(lrn.id, false)}
                            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-2.5 py-1 rounded font-bold transition-colors cursor-pointer"
                          >
                            Profile
                          </button>

                          <button
                            onClick={() => handleOpenProfileModal(lrn.id, true)}
                            className="bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 px-2 py-1 rounded font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            title="Edit Learner Profile"
                          >
                            <Edit className="w-3 h-3 text-zinc-500" />
                            <span>Edit</span>
                          </button>

                          {lrn.status === 'active' && (
                            <button
                              onClick={(e) => handleOpenExitModal(lrn, e)}
                              className="bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 px-2.5 py-1 rounded font-bold transition-colors cursor-pointer"
                              title="Record early exit or dropout"
                            >
                              Exit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll Learner Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Enroll Youth Skills Learner</h3>
                  <p className="text-xs text-zinc-500">
                    Kiosk access PIN and token are automatically issued upon onboarding.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-zinc-400 hover:text-black p-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Assign to Department Programme *</label>
                <select
                  required
                  value={enrollForm.programme_id}
                  onChange={(e) => setEnrollForm({ ...enrollForm, programme_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black focus:bg-white font-semibold"
                >
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Siyabonga"
                    value={enrollForm.first_name}
                    onChange={(e) => setEnrollForm({ ...enrollForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dlamini"
                    value={enrollForm.last_name}
                    onChange={(e) => setEnrollForm({ ...enrollForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black focus:bg-white"
                  />
                </div>
              </div>

              {/* Email & Phone Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Learner Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. siyabonga.dlamini@sparacademy.co.za"
                    value={enrollForm.email}
                    onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 072 884 9201"
                    value={enrollForm.phone}
                    onChange={(e) => setEnrollForm({ ...enrollForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black focus:bg-white"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Emergency Contact (ICE Name)</label>
                  <input
                    type="text"
                    placeholder="e.g. Nomsa Dlamini (Mother)"
                    value={enrollForm.emergency_contact_name}
                    onChange={(e) => setEnrollForm({ ...enrollForm, emergency_contact_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 082 391 0293"
                    value={enrollForm.emergency_contact_phone}
                    onChange={(e) => setEnrollForm({ ...enrollForm, emergency_contact_phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Private Kiosk Token Notice */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-600 flex items-center gap-2">
                <Lock className="w-4 h-4 text-black shrink-0" />
                <span>
                  <strong>Private Access Token:</strong> Code <code className="font-bold text-black font-mono">{enrollForm.learner_code}</code> and PIN <code className="font-bold text-black font-mono">{enrollForm.pin_code}</code> will be generated and issued confidentially to the learner.
                </span>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black hover:bg-zinc-800 text-white font-bold px-5 py-2 rounded-lg text-xs shadow-xs transition-all cursor-pointer"
                >
                  Complete Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Exit / Dropout Modal */}
      {isExitModalOpen && activeLearnerForExit && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 text-black flex items-center justify-center font-bold">
                  <UserX className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Record Early Exit / Dropout</h3>
                  <p className="text-xs text-zinc-500">
                    {activeLearnerForExit.first_name} {activeLearnerForExit.last_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExitModalOpen(false)}
                className="text-zinc-400 hover:text-black p-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-100 border border-zinc-300 rounded-xl p-3 my-4 text-xs text-zinc-800 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              <div>
                <strong>HR Audit Impact:</strong> Logging this exit locks future roll-call attendance and marks the learner's participation as pro-rated to the effective exit date for official W&RSETA / HR compliance records.
              </div>
            </div>

            <form onSubmit={handleExitSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Effective Exit Date *</label>
                <input
                  type="date"
                  required
                  value={exitForm.exit_date}
                  onChange={(e) => setExitForm({ ...exitForm, exit_date: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Exit Category / Reason *</label>
                <select
                  value={exitForm.exit_reason}
                  onChange={(e) => setExitForm({ ...exitForm, exit_reason: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                >
                  <option value="Offered permanent employment in retail store">Secured permanent retail employment (Positive Exit)</option>
                  <option value="Offered employment outside company">Secured employment elsewhere</option>
                  <option value="Relocated with family to another province">Family / Geographic relocation</option>
                  <option value="Pursuing higher tertiary education">Pursuing higher tertiary education</option>
                  <option value="Medical / Health incapacity">Medical / Health incapacity</option>
                  <option value="Persistent unexcused absenteeism / Disciplinary dismissal">Attendance policy breach / Dismissal</option>
                  <option value="Personal / Family hardship">Personal / Family hardship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Supervisor Notes & Exit Checklist</label>
                <textarea
                  rows={3}
                  placeholder="Record details regarding equipment handover, uniform return, performance feedback..."
                  value={exitForm.exit_notes}
                  onChange={(e) => setExitForm({ ...exitForm, exit_notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsExitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black hover:bg-zinc-800 text-white font-bold px-5 py-2 rounded-lg text-xs shadow-xs transition-all cursor-pointer"
                >
                  Confirm Exit & Update Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Clickable & Editable Learner Profile Modal */}
      {isProfileModalOpen && selectedLearnerDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-black text-white font-black flex items-center justify-center text-base shadow-xs">
                  {selectedLearnerDetail.first_name.charAt(0)}
                  {selectedLearnerDetail.last_name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-zinc-900">
                      {selectedLearnerDetail.first_name} {selectedLearnerDetail.last_name}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-300 bg-zinc-100 text-zinc-800">
                      {selectedLearnerDetail.programme_department}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {selectedLearnerDetail.programme_name} • Enrolled {formatDate(selectedLearnerDetail.joined_date)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isEditMode
                      ? 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300'
                      : 'bg-black text-white hover:bg-zinc-800'
                  }`}
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>{isEditMode ? 'Cancel Edit' : 'Edit Profile'}</span>
                </button>

                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="text-zinc-400 hover:text-black p-1.5 rounded-lg hover:bg-zinc-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Success Alert Banner */}
            {saveSuccessNotice && (
              <div className="mt-4 p-3 bg-zinc-100 border border-zinc-400 rounded-xl text-zinc-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                <span>{saveSuccessNotice}</span>
              </div>
            )}

            {/* EDIT MODE VIEW */}
            {isEditMode ? (
              <form onSubmit={handleSaveProfileEdit} className="mt-5 space-y-4">
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-xs text-zinc-700 font-medium">
                  Update learner personal information, contact numbers, department track assignment, or private kiosk PIN.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Learner Email *</label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Contact Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Emergency Contact (ICE Name)</label>
                    <input
                      type="text"
                      placeholder="e.g. Nomsa Dlamini (Mother)"
                      value={editForm.emergency_contact_name}
                      onChange={(e) => setEditForm({ ...editForm, emergency_contact_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Emergency Contact Phone</label>
                    <input
                      type="tel"
                      placeholder="e.g. 082 391 0293"
                      value={editForm.emergency_contact_phone}
                      onChange={(e) => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Department Programme</label>
                    <select
                      value={editForm.programme_id}
                      onChange={(e) => setEditForm({ ...editForm, programme_id: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black font-semibold"
                    >
                      {programmes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as LearnerStatus })}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black font-semibold"
                    >
                      <option value="active">Active</option>
                      <option value="medical_leave">Medical Leave</option>
                      <option value="completed">Completed</option>
                      <option value="dropped_out">Exited / Dropped Out</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Private Kiosk PIN</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={editForm.pin_code}
                      onChange={(e) => setEditForm({ ...editForm, pin_code: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg font-mono font-bold text-black"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="bg-black hover:bg-zinc-800 text-white font-bold px-5 py-2 rounded-lg text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* VIEW MODE DETAILS */
              <div className="mt-5 space-y-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Total Days Recorded</span>
                    <span className="text-lg font-bold text-zinc-900">
                      {selectedLearnerDetail.attendance_stats?.total_days || 0} Days
                    </span>
                  </div>
                  <div className="bg-zinc-900 text-white p-3 rounded-xl">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">Days Present</span>
                    <span className="text-lg font-bold text-white">
                      {selectedLearnerDetail.attendance_stats?.present_days || 0}
                    </span>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Unexcused Absences</span>
                    <span className="text-lg font-bold text-zinc-900">
                      {selectedLearnerDetail.attendance_stats?.unexcused_days || 0}
                    </span>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Total Hours Logged</span>
                    <span className="text-lg font-bold text-zinc-900">
                      {selectedLearnerDetail.attendance_stats?.total_hours || 0} hrs
                    </span>
                  </div>
                </div>

                {/* Contact & Private Credentials Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Contact Details Card */}
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2.5 text-xs">
                    <div className="font-bold text-zinc-900 mb-2 flex items-center justify-between">
                      <span>Learner Contact Profile</span>
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="text-[11px] text-zinc-500 hover:text-black font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="flex justify-between py-1 border-b border-zinc-200">
                      <span className="text-zinc-500">Email Address:</span>
                      <span className="font-semibold text-zinc-900 truncate max-w-44">
                        {selectedLearnerDetail.email || `${selectedLearnerDetail.first_name.toLowerCase()}.${selectedLearnerDetail.last_name.toLowerCase()}@sparacademy.co.za`}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-zinc-200">
                      <span className="text-zinc-500">Contact Phone:</span>
                      <span className="font-semibold text-zinc-900">
                        {selectedLearnerDetail.phone || '072 841 0921'}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-zinc-200">
                      <span className="text-zinc-500">Emergency Contact (ICE):</span>
                      <span className="font-medium text-zinc-800 truncate max-w-44">
                        {selectedLearnerDetail.emergency_contact_name || 'Family Contact'} ({selectedLearnerDetail.emergency_contact_phone || '082 391 0293'})
                      </span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-zinc-500">Enrolment Date:</span>
                      <span>{formatDate(selectedLearnerDetail.joined_date)}</span>
                    </div>
                  </div>

                  {/* Private Kiosk Access Token & Department Card */}
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2.5 text-xs">
                    <div className="font-bold text-zinc-900 mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-black" />
                        <span>Private Access Token & Shift</span>
                      </div>
                      <span className="text-[10px] bg-zinc-200 text-zinc-800 font-bold px-1.5 py-0.5 rounded">
                        CONFIDENTIAL
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-zinc-200">
                      <span className="text-zinc-500">Kiosk Token Code:</span>
                      <span className="font-mono font-bold text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-300">
                        {selectedLearnerDetail.learner_code}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-zinc-200">
                      <span className="text-zinc-500">Private Kiosk PIN:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-black bg-white px-2 py-0.5 rounded border border-zinc-300">
                          {showPrivatePin ? selectedLearnerDetail.pin_code : '••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPrivatePin(!showPrivatePin)}
                          className="text-zinc-400 hover:text-black cursor-pointer"
                        >
                          {showPrivatePin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between py-1 border-b border-zinc-200">
                      <span className="text-zinc-500">Supervisor:</span>
                      <span className="font-semibold text-zinc-900">{selectedLearnerDetail.supervisor_name}</span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-zinc-500">Scheduled Shift:</span>
                      <span>{selectedLearnerDetail.shift_start} - {selectedLearnerDetail.shift_end}</span>
                    </div>
                  </div>
                </div>

                {/* If dropped out, show exit details */}
                {selectedLearnerDetail.exit_date && (
                  <div className="p-4 bg-zinc-100 border border-zinc-300 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                      <UserX className="w-4 h-4 text-black" />
                      <span>Early Exit / Dropout Recorded</span>
                    </div>
                    <div className="text-zinc-800">
                      <strong>Exit Date:</strong> {formatDate(selectedLearnerDetail.exit_date)}
                    </div>
                    <div className="text-zinc-800">
                      <strong>Reason:</strong> {selectedLearnerDetail.exit_reason}
                    </div>
                    {selectedLearnerDetail.exit_notes && (
                      <div className="text-zinc-600 italic mt-1">"{selectedLearnerDetail.exit_notes}"</div>
                    )}
                  </div>
                )}

                {/* Recent Attendance Logs */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">
                    Recent Attendance Logs (Last 15 Days)
                  </h4>
                  <div className="bg-zinc-50 rounded-xl border border-zinc-200 divide-y divide-zinc-200 max-h-44 overflow-y-auto text-xs">
                    {selectedLearnerDetail.recent_attendance?.length === 0 ? (
                      <div className="p-4 text-center text-zinc-400">No attendance logs found.</div>
                    ) : (
                      selectedLearnerDetail.recent_attendance?.map((rec: any) => (
                        <div key={rec.id} className="p-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-zinc-900">{formatDate(rec.date)}</span>
                            <span className="text-zinc-400">•</span>
                            <span className="text-[11px] text-zinc-500">
                              {rec.clock_in_time ? `${rec.clock_in_time} - ${rec.clock_out_time || 'Present'}` : 'No punch recorded'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-zinc-300">
                              {rec.status.toUpperCase()}
                            </span>
                            <span className="font-bold text-zinc-900">{rec.hours_worked}h</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <div>
                    {selectedLearnerDetail.status === 'active' && (
                      <button
                        onClick={(e) => handleOpenExitModal(selectedLearnerDetail, e)}
                        className="bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Record Exit / Dropout
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>
                    <button
                      onClick={() => setIsProfileModalOpen(false)}
                      className="bg-black hover:bg-zinc-800 text-white text-xs font-bold px-5 py-2 rounded-xl cursor-pointer"
                    >
                      Close Profile
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
