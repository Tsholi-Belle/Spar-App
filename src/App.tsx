import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardOverview } from './components/Dashboard/DashboardOverview';
import { ProgrammeManager } from './components/Programmes/ProgrammeManager';
import { LearnerDirectory } from './components/Learners/LearnerDirectory';
import { AttendanceManager } from './components/Attendance/AttendanceManager';
import { ReconciliationManager } from './components/Reconciliation/ReconciliationManager';
import { LearnerKiosk } from './components/Kiosk/LearnerKiosk';
import { LoginPage } from './components/Auth/LoginPage';
import { api, getStoredUser } from './api/client';
import { User } from './types';
import { ShieldAlert, LogIn, Lock } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentRole, setCurrentRole] = useState<string>('admin');
  const [selectedSupervisorDept, setSelectedSupervisorDept] = useState<string>('All');
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string | undefined>(undefined);
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | undefined>(undefined);
  const [sessionTerminatedNotice, setSessionTerminatedNotice] = useState<string | null>(null);

  // Periodic heartbeat & Single-Admin Concurrency check
  useEffect(() => {
    if (!currentUser) return;

    // Heartbeat check every 8 seconds
    const interval = setInterval(async () => {
      try {
        await api.sendHeartbeat();
      } catch (err: any) {
        // Handled by event listener or error catch
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Listen for single-admin session concurrency termination
  useEffect(() => {
    const handleTerminated = (e: any) => {
      const msg =
        e.detail?.message ||
        'Single-Admin Security Lock: Another administrator has signed in. Simultaneous administrator sessions are strictly prohibited.';
      setSessionTerminatedNotice(msg);
      setCurrentUser(null);
    };

    window.addEventListener('spar_session_terminated', handleTerminated);
    return () => window.removeEventListener('spar_session_terminated', handleTerminated);
  }, []);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'supervisor') {
        setSelectedSupervisorDept(currentUser.department);
      } else {
        setSelectedSupervisorDept('All');
      }
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: User) => {
    setSessionTerminatedNotice(null);
    setCurrentUser(user);
    if (user.role === 'supervisor') {
      setSelectedSupervisorDept(user.department);
    } else {
      setSelectedSupervisorDept('All');
    }
    setActiveTab('dashboard');
  };

  const handleSignOut = () => {
    api.logout();
    setCurrentUser(null);
  };

  const handleSelectProgramme = (id: string) => {
    setSelectedProgrammeId(id);
    setActiveTab('programmes');
  };

  const handleSelectLearner = (id: string) => {
    setSelectedLearnerId(id);
    setActiveTab('learners');
  };

  // If user is not authenticated, show secure IP protection Login Portal
  if (!currentUser) {
    return (
      <div className="relative">
        {/* Session Terminated Security Modal Alert */}
        {sessionTerminatedNotice && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-300 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-black flex items-center justify-center mx-auto border border-zinc-200">
                <ShieldAlert className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900 tracking-tight">
                  Single-Admin Lock Triggered
                </h3>
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                  Another administrator has signed into the system. In accordance with strict security compliance, simultaneous administrator sessions are not permitted.
                </p>
                <div className="mt-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[11px] font-mono text-zinc-800 text-left flex items-start gap-2">
                  <Lock className="w-4 h-4 text-black shrink-0 mt-0.5" />
                  <span>Your active session was safely closed to prevent concurrent edits.</span>
                </div>
              </div>
              <button
                onClick={() => setSessionTerminatedNotice(null)}
                className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Return to Sign-In</span>
              </button>
            </div>
          </div>
        )}

        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-row font-sans text-zinc-900 selection:bg-black selection:text-white">
      {/* Left Side Navigation Bar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        selectedSupervisorDept={selectedSupervisorDept}
        setSelectedSupervisorDept={setSelectedSupervisorDept}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Clean Top Header (Minimal, No clutter) */}
        <TopHeader activeTab={activeTab} />

        {/* Tab Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              setActiveTab={setActiveTab}
              onSelectProgramme={handleSelectProgramme}
              onSelectLearner={handleSelectLearner}
            />
          )}

          {activeTab === 'programmes' && (
            <ProgrammeManager
              onSelectProgramme={handleSelectProgramme}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'learners' && (
            <LearnerDirectory onSelectLearner={handleSelectLearner} />
          )}

          {activeTab === 'attendance' && (
            <AttendanceManager
              selectedDeptFilter={selectedSupervisorDept}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'reconciliation' && <ReconciliationManager />}

          {activeTab === 'kiosk' && <LearnerKiosk />}
        </main>
      </div>
    </div>
  );
}

export default App;
