import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CalendarCheck,
  FileCheck2,
  Tablet,
  ShieldCheck,
  ChevronDown,
  Clock,
  Sparkles,
} from 'lucide-react';
import sparLogo from '../assets/spar_academy_logo.png';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: string;
  setCurrentRole: (role: string) => void;
  selectedSupervisorDept: string;
  setSelectedSupervisorDept: (dept: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
  selectedSupervisorDept,
  setSelectedSupervisorDept,
}) => {
  const [time, setTime] = useState<string>('');
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'HR Dashboard', icon: LayoutDashboard },
    { id: 'programmes', label: 'Programmes', icon: GraduationCap },
    { id: 'learners', label: 'Learners Directory', icon: Users },
    { id: 'attendance', label: 'Daily Roll-Call', icon: CalendarCheck },
    { id: 'reconciliation', label: 'HR Reconciliation', icon: FileCheck2 },
    { id: 'kiosk', label: 'Learner Kiosk', icon: Tablet, highlight: true },
  ];

  const roles = [
    { id: 'admin', label: 'Store HR Admin (Brenda Khanyile)', dept: 'All' },
    { id: 'supervisor-bakery', label: 'Supervisor: Bakery (Chef Thabo)', dept: 'Baking' },
    { id: 'supervisor-culinary', label: 'Supervisor: Deli & Culinary (Chef Sarah)', dept: 'Culinary' },
    { id: 'supervisor-cashier', label: 'Supervisor: Front-End POS (Nomvula)', dept: 'Cashier' },
    { id: 'kiosk-mode', label: 'Learner Self-Service Kiosk Terminal', dept: 'All' },
  ];

  const currentRoleObj = roles.find((r) => r.id === currentRole) || roles[0];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-white">SPAR Group (Pty) Ltd</span>
          <span className="text-slate-400">|</span>
          <span>SPAR Academy of Learning — Youth Skills & Attendance System</span>
          <span className="hidden md:inline-block bg-slate-800 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-mono">
            SETA & W&RSETA Accredited
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-mono text-emerald-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{time || '08:00:00'}</span>
          </div>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">SUPERSPAR Sandton City</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer py-1"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="bg-white p-1 rounded-lg border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex items-center">
              <img
                src={sparLogo}
                alt="SPAR Academy of Learning"
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </div>
            <div className="hidden sm:block border-l border-slate-200 pl-3">
              <div className="font-bold text-slate-800 text-xs tracking-tight">HR Attendance Portal</div>
              <div className="text-[10px] text-slate-500">Participation Reconciliation</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? item.highlight
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-emerald-50 text-emerald-700 font-semibold'
                      : item.highlight
                      ? 'bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/70'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive && !item.highlight ? 'text-emerald-600' : ''}`} />
                  <span>{item.label}</span>
                  {item.highlight && (
                    <span className="bg-emerald-400/30 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded text-emerald-900">
                      Terminal
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Persona / Role Selector */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px]">
                {currentRoleObj.label.slice(0, 1)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-semibold text-slate-800 text-[11px] leading-tight">
                  {currentRoleObj.label.split('(')[0]}
                </div>
                <div className="text-[10px] text-slate-500">
                  {currentRoleObj.dept === 'All' ? 'HR Admin Access' : `${currentRoleObj.dept} Lead`}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Persona
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
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                      currentRole === r.id ? 'bg-emerald-50/70 text-emerald-800 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <span>{r.label}</span>
                    {currentRole === r.id && <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium cursor-pointer ${
                  isActive ? 'bg-emerald-600 text-white' : 'text-slate-600 bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
