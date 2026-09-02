import React, { useState, useEffect } from 'react';
import {
  Tablet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Delete,
  Sparkles,
  ArrowRight,
  LogOut,
  LogIn,
  Coffee,
  RotateCcw,
  Timer,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../api/client';
import { Learner } from '../../types';
import sparLogo from '../../assets/spar_academy_logo.png';

export const LearnerKiosk: React.FC = () => {
  const [pin, setPin] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<{
    learner: any;
    today: {
      date: string;
      record: any;
      is_clocked_in: boolean;
      is_completed: boolean;
      tea_break_status: 'none' | 'on_break' | 'completed';
      tea_break_start: string | null;
      tea_break_end: string | null;
    };
    tip: string;
  } | null>(null);

  const [demoLearners, setDemoLearners] = useState<Learner[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    }, 1000);

    loadDemoLearners();

    return () => clearInterval(timer);
  }, []);

  const loadDemoLearners = async () => {
    try {
      const data = await api.getLearners({ status: 'active' });
      setDemoLearners(data.slice(0, 6));
    } catch (err) {
      console.error('Failed to load demo learners', err);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setActiveSession(null);
  };

  const verifyPin = async (inputPin: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.kioskLookup({ pin: inputPin });
      setActiveSession(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid PIN code. Please check with your supervisor.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handlePunch = async (
    action: 'clock_in' | 'clock_out' | 'tea_break_start' | 'tea_break_end'
  ) => {
    if (!activeSession) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 5);

      const res = await api.kioskPunch({
        learner_id: activeSession.learner.id,
        action,
        current_time: timeStr,
      });

      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#000000', '#52525b', '#a1a1aa'],
      });

      setSuccessMsg(res.message);

      const updated = await api.kioskLookup({ pin: activeSession.learner.pin_code || pin });
      setActiveSession(updated);

      setTimeout(() => {
        handleClear();
      }, 7000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record punch.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoSelect = (demo: Learner) => {
    setPin(demo.pin_code);
    verifyPin(demo.pin_code);
  };

  const isShiftClockedIn = activeSession?.today?.is_clocked_in || false;
  const isShiftCompleted = activeSession?.today?.is_completed || false;
  const teaBreakStatus = activeSession?.today?.tea_break_status || 'none';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-black rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-zinc-800 text-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          {/* Official SPAR Logo */}
          <div className="bg-white p-2.5 rounded-xl shadow-md mb-4 border border-zinc-300 inline-flex items-center">
            <img
              src={sparLogo}
              alt="SPAR Academy of Learning"
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </div>

          <div className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-white">
            {currentTime || '08:00:00'}
          </div>
          <div className="text-zinc-400 text-xs sm:text-sm font-medium mt-1">
            {currentDate || 'Tuesday, 25 August 2026'} • SUPERSPAR Sandton City
          </div>
        </div>
      </div>

      {/* Main Terminal Area */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden p-6 sm:p-8">
        {!activeSession ? (
          /* STEP 1: PIN ENTRY KEYPAD */
          <div className="max-w-sm mx-auto flex flex-col items-center space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-black flex items-center justify-center mx-auto mb-3 border border-zinc-200">
                <Tablet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Learner Clock-In Terminal</h3>
              <p className="text-xs text-zinc-500 mt-1">Enter your 4-digit PIN code to record your shift or tea break.</p>
            </div>

            {/* PIN Dots Display */}
            <div className="flex items-center justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((index) => {
                const filled = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all ${
                      filled
                        ? 'bg-black scale-110 shadow-xs'
                        : 'bg-zinc-200 border border-zinc-300'
                    }`}
                  ></div>
                );
              })}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-zinc-100 border border-zinc-400 text-zinc-900 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 w-full animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-3 w-full">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="h-14 rounded-2xl bg-zinc-50 hover:bg-black hover:text-white active:scale-95 text-xl font-bold text-zinc-900 border border-zinc-200 shadow-xs transition-all flex items-center justify-center cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-14 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700 border border-zinc-200 transition-all flex items-center justify-center cursor-pointer"
              >
                CLEAR
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="h-14 rounded-2xl bg-zinc-50 hover:bg-black hover:text-white text-xl font-bold text-zinc-900 border border-zinc-200 shadow-xs transition-all flex items-center justify-center cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="h-14 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-all flex items-center justify-center cursor-pointer"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Demo Shortcuts */}
            <div className="w-full pt-6 border-t border-zinc-100">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 text-center">
                Demo Quick Click (Select a Learner PIN):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {demoLearners.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleQuickDemoSelect(d)}
                    className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-left transition-all group cursor-pointer"
                  >
                    <div className="font-bold text-zinc-900 text-xs truncate">
                      {d.first_name} {d.last_name}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono flex justify-between">
                      <span>{d.programme_department}</span>
                      <span className="font-bold text-black">PIN: {d.pin_code}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: VERIFIED LEARNER PUNCH & TEA BREAK SCREEN */
          <div className="max-w-lg mx-auto space-y-6">
            {/* Learner Welcome Card */}
            <div className="bg-black text-white p-6 rounded-2xl shadow-xl flex items-center justify-between gap-4 border border-zinc-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white text-black font-extrabold flex items-center justify-center text-base shrink-0">
                  {activeSession.learner.first_name.charAt(0)}
                  {activeSession.learner.last_name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                    Welcome to Shift
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-white">
                    {activeSession.learner.first_name} {activeSession.learner.last_name}
                  </h3>
                  <div className="text-xs text-zinc-300 font-medium mt-0.5">
                    {activeSession.learner.programme_name} ({activeSession.learner.department})
                  </div>
                </div>
              </div>

              <button
                onClick={handleClear}
                className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 text-xs flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Switch</span>
              </button>
            </div>

            {/* Shift & Tea Break Status Grid */}
            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-600 uppercase">Today's Timesheet & Break Log</span>
                <span className="text-xs font-bold text-zinc-900">
                  Shift: {activeSession.learner.shift_start} - {activeSession.learner.shift_end}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-zinc-200">
                  <span className="text-[9px] text-zinc-500 block font-bold uppercase">Shift Clock In</span>
                  <span className="text-sm font-bold text-zinc-900 font-mono">
                    {activeSession.today.record?.clock_in_time || 'Not yet'}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-zinc-200">
                  <span className="text-[9px] text-zinc-500 block font-bold uppercase">Tea Break Start</span>
                  <span className="text-sm font-bold text-zinc-900 font-mono">
                    {activeSession.today.record?.tea_break_start || 'Not taken'}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-zinc-200">
                  <span className="text-[9px] text-zinc-500 block font-bold uppercase">Tea Break End</span>
                  <span className="text-sm font-bold text-zinc-900 font-mono">
                    {activeSession.today.record?.tea_break_end || (teaBreakStatus === 'on_break' ? 'Active...' : '-')}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-zinc-200">
                  <span className="text-[9px] text-zinc-500 block font-bold uppercase">Shift Clock Out</span>
                  <span className="text-sm font-bold text-zinc-900 font-mono">
                    {activeSession.today.record?.clock_out_time || (isShiftClockedIn ? 'In Progress' : '-')}
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              {teaBreakStatus === 'on_break' && (
                <div className="p-3 bg-zinc-900 text-white rounded-xl border border-black flex items-center justify-between text-xs animate-pulse">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-zinc-300" />
                    <span className="font-bold">CURRENTLY ON TEA BREAK</span>
                  </div>
                  <span className="text-zinc-400 text-[11px]">
                    Started at {activeSession.today.record?.tea_break_start}
                  </span>
                </div>
              )}

              {teaBreakStatus === 'completed' && (
                <div className="p-2.5 bg-zinc-100 border border-zinc-300 rounded-xl flex items-center justify-between text-xs text-zinc-800">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-black" />
                    <span className="font-bold">Tea Break Logged:</span>
                    <span>
                      {activeSession.today.record?.tea_break_start} - {activeSession.today.record?.tea_break_end}
                    </span>
                  </div>
                  <span className="text-[10px] bg-white border border-zinc-300 px-2 py-0.5 rounded font-bold">
                    15 Min Rest Period
                  </span>
                </div>
              )}
            </div>

            {/* Success Message Banner */}
            {successMsg && (
              <div className="bg-zinc-900 text-white text-xs font-semibold p-4 rounded-xl flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                <div>
                  <div className="font-bold text-white">Action Confirmed!</div>
                  <div className="mt-0.5 text-zinc-300">{successMsg}</div>
                </div>
              </div>
            )}

            {/* Action Buttons Section */}
            <div className="space-y-3">
              {/* PRIMARY SHIFT CLOCK IN / OUT BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handlePunch('clock_in')}
                  disabled={loading || isShiftClockedIn}
                  className={`py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                    isShiftClockedIn
                      ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed shadow-none'
                      : 'bg-black hover:bg-zinc-800 text-white cursor-pointer active:scale-98'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>CLOCK IN SHIFT</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePunch('clock_out')}
                  disabled={loading || !isShiftClockedIn || isShiftCompleted || teaBreakStatus === 'on_break'}
                  className={`py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                    !isShiftClockedIn || isShiftCompleted || teaBreakStatus === 'on_break'
                      ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed shadow-none'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer active:scale-98 border border-zinc-700'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  <span>CLOCK OUT SHIFT</span>
                </button>
              </div>

              {/* TEA BREAK BUTTONS */}
              {isShiftClockedIn && !isShiftCompleted && (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2">
                  <div className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-black" />
                    <span>Tea Break Logging (15-Minute Scheduled Rest Break)</span>
                  </div>

                  {teaBreakStatus === 'none' && (
                    <button
                      type="button"
                      onClick={() => handlePunch('tea_break_start')}
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs border border-zinc-300 shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Coffee className="w-4 h-4" />
                      <span>START TEA BREAK (CLOCK IN BREAK)</span>
                    </button>
                  )}

                  {teaBreakStatus === 'on_break' && (
                    <button
                      type="button"
                      onClick={() => handlePunch('tea_break_end')}
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                    >
                      <Timer className="w-4 h-4" />
                      <span>END TEA BREAK (RETURN TO SHIFT)</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Motivational Retail Quote */}
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-center">
              <div className="text-[11px] text-zinc-800 font-medium flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span>"{activeSession.tip}"</span>
              </div>
            </div>

            {/* Finished / Done Button */}
            <div className="text-center pt-2">
              <button
                onClick={handleClear}
                className="text-xs font-bold text-zinc-600 hover:text-black px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Done / Return to PIN Screen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
