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

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentRole, setCurrentRole] = useState<string>('admin');
  const [selectedSupervisorDept, setSelectedSupervisorDept] = useState<string>('All');
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string | undefined>(undefined);
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | undefined>(undefined);

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
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
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

        {/* Minimal Footer */}
        <footer className="bg-white border-t border-zinc-200 py-4 px-6 text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900">SPAR Academy of Learning</span>
            <span>•</span>
            <span>W&RSETA & SETA Youth Compliance Management System</span>
          </div>
          <div className="text-zinc-400 text-[11px]">
            Official HR Attendance & Participation Audit Portal • Confidential IP Protected
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
