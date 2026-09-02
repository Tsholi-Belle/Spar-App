import React, { useState, useEffect } from 'react';
import { Clock, Store, ShieldCheck } from 'lucide-react';

interface TopHeaderProps {
  activeTab: string;
}

const tabTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'HR Executive Dashboard',
    subtitle: 'Learnership attendance, retention rates, and participation metrics',
  },
  programmes: {
    title: 'Retail Skills Programmes',
    subtitle: 'Track durations, qualification standards, and supervisor assignments',
  },
  learners: {
    title: 'Learners Directory & Profiles',
    subtitle: 'Active enrollments, PIN credentials, emergency contacts, and exit records',
  },
  attendance: {
    title: 'Daily Roll-Call & Matrix',
    subtitle: 'Daily attendance roster, doctor note verification, and monthly audit grid',
  },
  reconciliation: {
    title: 'HR Attendance Reconciliation',
    subtitle: 'Participation audits, qualification outcomes, and official W&RSETA certificates',
  },
  kiosk: {
    title: 'Learner Touch Clock-In Terminal',
    subtitle: 'Floor kiosk punch system for shift clock-in and clock-out',
  },
};

export const TopHeader: React.FC<TopHeaderProps> = ({ activeTab }) => {
  const [time, setTime] = useState<string>('');

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

  const current = tabTitles[activeTab] || tabTitles.dashboard;

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-20 px-6 py-3.5 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold text-zinc-900 tracking-tight">{current.title}</h1>
        <p className="text-xs text-zinc-500">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-zinc-800 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-md">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-semibold">{time || '08:00:00'}</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-zinc-600 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-md">
          <Store className="w-3.5 h-3.5 text-zinc-500" />
          <span>SUPERSPAR Sandton City</span>
        </div>
      </div>
    </header>
  );
};
