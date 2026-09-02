import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Users,
  Calendar,
  Clock,
  MapPin,
  Mail,
  ChevronRight,
  Edit2,
  X,
  GraduationCap,
  Award,
} from 'lucide-react';
import { api } from '../../api/client';
import { Programme, DepartmentType } from '../../types';
import { formatDate, departmentConfig } from '../../utils/formatters';

interface ProgrammeManagerProps {
  onSelectProgramme?: (id: string) => void;
  setActiveTab: (tab: string) => void;
}

export const ProgrammeManager: React.FC<ProgrammeManagerProps> = ({ onSelectProgramme, setActiveTab }) => {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProg, setEditingProg] = useState<Programme | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    department: 'Bakery' as DepartmentType,
    cohort_code: '',
    branch_location: 'SUPERSPAR Sandton City Flagship',
    start_date: '2026-09-01',
    end_date: '2027-02-28',
    target_headcount: 8,
    total_required_days: 120,
    min_attendance_rate: 85,
    shift_start: '07:30',
    shift_end: '16:00',
    supervisor_name: '',
    supervisor_email: '',
  });

  useEffect(() => {
    loadProgrammes();
  }, []);

  const loadProgrammes = async () => {
    try {
      setLoading(true);
      const data = await api.getProgrammes();
      setProgrammes(data);
    } catch (err) {
      console.error('Failed to load programmes', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProg(null);
    setFormData({
      name: '',
      department: 'Bakery',
      cohort_code: `SPAR-2026-Q${Math.floor(Math.random() * 4) + 1}`,
      branch_location: 'SUPERSPAR Sandton City Flagship',
      start_date: '2026-09-01',
      end_date: '2027-02-28',
      target_headcount: 8,
      total_required_days: 120,
      min_attendance_rate: 85,
      shift_start: '07:30',
      shift_end: '16:00',
      supervisor_name: '',
      supervisor_email: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (prog: Programme) => {
    setEditingProg(prog);
    setFormData({
      name: prog.name,
      department: prog.department,
      cohort_code: prog.cohort_code,
      branch_location: prog.branch_location,
      start_date: prog.start_date,
      end_date: prog.end_date,
      target_headcount: prog.target_headcount,
      total_required_days: prog.total_required_days || 120,
      min_attendance_rate: prog.min_attendance_rate || 85,
      shift_start: prog.shift_start,
      shift_end: prog.shift_end,
      supervisor_name: prog.supervisor_name,
      supervisor_email: prog.supervisor_email || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProg) {
        await api.updateProgramme(editingProg.id, formData);
      } else {
        await api.createProgramme(formData);
      }
      setIsCreateModalOpen(false);
      loadProgrammes();
    } catch (err: any) {
      alert(`Error saving programme: ${err.message}`);
    }
  };

  const filteredProgrammes = programmes.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.cohort_code.toLowerCase().includes(search.toLowerCase()) ||
      p.supervisor_name.toLowerCase().includes(search.toLowerCase());
    const matchDept = selectedDept === 'All' || p.department === selectedDept;
    return matchSearch && matchDept;
  });

  const departmentList: DepartmentType[] = ['Floor', 'HMR', 'Bakery', 'Butchery', 'Deli', 'Front End'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">SPAR Skills Programmes</h2>
            <span className="bg-zinc-100 text-zinc-800 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-zinc-300">
              {programmes.length} Active Tracks
            </span>
          </div>
          <p className="text-zinc-500 text-xs mt-0.5">
            Configure learnership tracks across HMR, Floor, Bakery, Butchery, Deli, and Front End.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 bg-black hover:bg-zinc-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Programme</span>
        </button>
      </div>

      {/* Search & Department Filters */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search programme, cohort code or supervisor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedDept('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedDept === 'All'
                ? 'bg-black text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            All Programmes
          </button>
          {departmentList.map((dept) => {
            const isSel = selectedDept === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isSel ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {dept}
              </button>
            );
          })}
        </div>
      </div>

      {/* Programmes Grid */}
      {loading ? (
        <div className="py-16 text-center text-zinc-400 text-sm">Loading programmes...</div>
      ) : filteredProgrammes.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
          <GraduationCap className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-700">No programmes found</p>
          <p className="text-xs text-zinc-400 mt-1">Try adjusting your search query or department filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProgrammes.map((prog) => {
            const enrolled = prog.total_enrolled || 0;
            const capacityPercent = Math.min(100, Math.round((enrolled / prog.target_headcount) * 100));

            return (
              <div
                key={prog.id}
                className="bg-white rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-400 transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Top Section */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-300">
                      {prog.department}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                      {prog.cohort_code}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-zinc-900">
                    {prog.name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{prog.branch_location}</span>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-4 pt-3 border-t border-zinc-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-zinc-500 font-medium">Headcount Enrolled</span>
                      <span className="font-bold text-zinc-900">
                        {enrolled} <span className="text-zinc-400 font-normal">/ {prog.target_headcount} Target</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-zinc-900"
                        style={{ width: `${capacityPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                    <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Attendance Target</span>
                      <span className="font-extrabold text-zinc-900 text-sm">
                        &gt; 85%
                      </span>
                      <span className="text-[10px] text-zinc-600 block font-medium">SETA Standard</span>
                    </div>

                    <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Shift Times</span>
                      <span className="font-bold text-zinc-800 text-xs">
                        {prog.shift_start} - {prog.shift_end}
                      </span>
                      <span className="text-[10px] text-zinc-500 block">Mon - Fri</span>
                    </div>
                  </div>

                  {/* Dates & Duration */}
                  <div className="mt-3 text-xs text-zinc-500 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{formatDate(prog.start_date)} - {formatDate(prog.end_date)}</span>
                    </div>
                  </div>

                  {/* Supervisor */}
                  <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-black text-white font-bold flex items-center justify-center text-[10px]">
                        {prog.supervisor_name.charAt(0)}
                      </div>
                      <span className="font-semibold text-zinc-800">{prog.supervisor_name}</span>
                    </div>
                    <button
                      onClick={() => handleOpenEditModal(prog)}
                      className="text-zinc-400 hover:text-black p-1 rounded hover:bg-zinc-100 cursor-pointer"
                      title="Edit Programme Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="bg-zinc-50 px-5 py-2.5 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-medium">
                    {prog.active_learners || 0} Active • {prog.dropped_out_learners || 0} Exited
                  </span>
                  <button
                    onClick={() => setActiveTab('learners')}
                    className="font-bold text-black hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Learners</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Programme Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">
                  {editingProg ? 'Edit Skills Programme' : 'Create New Skills Programme'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-black p-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Programme Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bakery"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Retail Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => {
                      const dept = e.target.value as DepartmentType;
                      setFormData({
                        ...formData,
                        department: dept,
                        name: formData.name ? formData.name : dept,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:bg-white font-semibold"
                  >
                    <option value="HMR">HMR</option>
                    <option value="Floor">Floor</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Butchery">Butchery</option>
                    <option value="Deli">Deli</option>
                    <option value="Front End">Front End</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Cohort Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SPAR-2026-Q3"
                    value={formData.cohort_code}
                    onChange={(e) => setFormData({ ...formData, cohort_code: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Store Branch Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUPERSPAR Sandton City Flagship"
                  value={formData.branch_location}
                  onChange={(e) => setFormData({ ...formData, branch_location: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Target Headcount *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={formData.target_headcount}
                    onChange={(e) => setFormData({ ...formData, target_headcount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Training Requirements */}
              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
                <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-black" />
                  <span>SETA Training & Attendance Requirements</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Total Required Training Days</label>
                    <input
                      type="number"
                      value={formData.total_required_days}
                      onChange={(e) => setFormData({ ...formData, total_required_days: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Minimum Qualification Percentage</label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={formData.min_attendance_rate}
                      onChange={(e) => setFormData({ ...formData, min_attendance_rate: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black font-bold text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Shift Hours & Supervisor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Shift Start Time</label>
                  <input
                    type="time"
                    value={formData.shift_start}
                    onChange={(e) => setFormData({ ...formData, shift_start: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Shift End Time</label>
                  <input
                    type="time"
                    value={formData.shift_end}
                    onChange={(e) => setFormData({ ...formData, shift_end: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Assigned Supervisor *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chef Thabo Mokoena"
                    value={formData.supervisor_name}
                    onChange={(e) => setFormData({ ...formData, supervisor_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Supervisor Email</label>
                  <input
                    type="email"
                    placeholder="e.g. thabo@spar.co.za"
                    value={formData.supervisor_email}
                    onChange={(e) => setFormData({ ...formData, supervisor_email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black hover:bg-zinc-800 text-white font-bold px-5 py-2 rounded-lg text-xs shadow-xs transition-all cursor-pointer"
                >
                  {editingProg ? 'Update Programme' : 'Create Programme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
