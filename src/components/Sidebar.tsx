import React, { useState } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CalendarCheck,
  FileCheck2,
  Tablet,
  ShieldCheck,
  ChevronDown,
  User as UserIcon,
  Store,
  LogOut,
  Lock,
} from 'lucide-react';
import sparLogo from '../assets/spar_academy_logo.png';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: string;
  setCurrentRole: (role: string) => void;
  selectedSupervisorDept: string;
  setSelectedSupervisorDept: (dept: string) => void;
  currentUser?: User | null;
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
  selectedSupervisorDept,
  setSelectedSupervisorDept,
  currentUser,
  onSignOut,
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'HR Dashboard', icon: LayoutDashboard },
    { id: 'programmes', label: 'Programmes', icon: GraduationCap },
    { id: 'learners', label: 'Learners Directory', icon: Users },
    { id: 'attendance', label: 'Daily Roll-Call', icon: CalendarCheck },
    { id: 'reconciliation', label: 'HR Reconciliation', icon: FileCheck2 },
    { id: 'kiosk', label: 'Learner Kiosk', icon: Tablet, highlight: true },
  ];

  const roles = [
    { id: 'admin', label: 'Store HR Admin - Brenda Khanyile', dept: 'All' },
    { id: 'supervisor-floor', label: 'Supervisor Floor', dept: 'Floor' },
    { id: 'supervisor-frontend', label: 'Supervisor Front End', dept: 'Front End' },
    { id: 'supervisor-hmr', label: 'Supervisor HMR', dept: 'HMR' },
    { id: 'supervisor-bakery', label: 'Supervisor Bakery', dept: 'Bakery' },
    { id: 'supervisor-butchery', label: 'Supervisor Butchery', dept: 'Butchery' },
    { id: 'supervisor-deli', label: 'Supervisor Deli', dept: 'Deli' },
    { id: 'kiosk-mode', label: 'Learner Self-Service Kiosk Terminal', dept: 'All' },
  ];

  const currentRoleObj = roles.find((r) => r.id === currentRole) || roles[0];

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col justify-between shrink-0 min-h-screen sticky top-0 z-30">
      {/* Brand & Logo Section */}
      <div>
        <div className="p-5 border-b border-zinc-200">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer bg-white p-2.5 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-center hover:border-zinc-400 transition-all"
          >
            <img
              src={sparLogo}
              alt="SPAR Academy of Learning"
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="mt-3 text-center">
            <div className="text-[11px] font-bold text-zinc-900 tracking-tight uppercase">
              HR Attendance & Audit
            </div>
            <div className="text-[10px] text-zinc-500">SUPERSPAR Sandton City Flagship</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Main Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-black text-white shadow-xs'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                      isActive ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-800'
                    }`}
                  >
                    Terminal
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Card, Persona Selector & Sign Out */}
      <div className="p-3 border-t border-zinc-200 space-y-2">
        {/* Department Persona Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-left transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-zinc-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                {currentRoleObj.label.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-zinc-900 truncate">
                  {currentRoleObj.label}
                </div>
                <div className="text-[9px] text-zinc-500 truncate">
                  {currentRoleObj.dept === 'All' ? 'Full Store Access' : `${currentRoleObj.dept} Track`}
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </button>

          {roleMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-zinc-200 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 max-h-56 overflow-y-auto">
              <div className="px-3 py-1.5 border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Switch Department Persona
              </div>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setCurrentRole(r.id);
                    setSelectedSupervisorDept(r.dept);
                    setRoleMenuOpen(false);
                    if (r.id === 'kiosk-mode') {
                      setActiveTab('kiosk');
                    }
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-zinc-100 transition-colors cursor-pointer ${
                    currentRole === r.id ? 'bg-zinc-100 text-black font-bold' : 'text-zinc-700'
                  }`}
                >
                  <span className="truncate">{r.label}</span>
                  {currentRole === r.id && <ShieldCheck className="w-3.5 h-3.5 text-black shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Authenticated User Session & Sign Out Button */}
        {currentUser && (
          <div className="p-2.5 rounded-xl bg-zinc-900 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white text-black font-extrabold flex items-center justify-center text-xs shrink-0">
                {currentUser.avatar_initials || currentUser.full_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {currentUser.full_name}
                </div>
                <div className="text-[9px] text-zinc-400 truncate">
                  {currentUser.email}
                </div>
              </div>
            </div>

            {onSignOut && (
              <button
                onClick={onSignOut}
                title="Sign Out & Lock Portal"
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="text-center text-[9px] text-zinc-400 pt-1 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3 text-zinc-400 inline" />
          <span>IP Protected • SPAR Academy</span>
        </div>
      </div>
    </aside>
  );
};
