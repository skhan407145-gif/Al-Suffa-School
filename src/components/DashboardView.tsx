import React, { useMemo } from 'react';
import { Student, FeeRecord, AttendanceRecord, InventoryItem, UserSession } from '../types';
import { Users, DollarSign, Calendar, ArrowRight, BookOpen, GraduationCap, Award } from 'lucide-react';

const schoolLogo = "/src/assets/images/alsuffa_logo_1783059479131.jpg";

interface DashboardViewProps {
  students: Student[];
  fees: FeeRecord[];
  attendance: AttendanceRecord[];
  inventory: InventoryItem[];
  currentMonth: string;
  onNavigate: (tab: string) => void;
  userSession?: UserSession | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  fees,
  attendance,
  inventory,
  currentMonth,
  onNavigate,
  userSession
}) => {
  const isTeacher = userSession?.role === 'teacher';
  const teacherClass = userSession?.className || 'None';

  // 1. Total Students (filtered if teacher)
  const totalStudents = useMemo(() => {
    if (isTeacher) {
      return students.filter(s => s.className.toLowerCase() === teacherClass.toLowerCase()).length;
    }
    return students.length;
  }, [students, isTeacher, teacherClass]);

  // 2. Fees Collected this Month (Admin only)
  const totalFeesPaid = useMemo(() => {
    return fees
      .filter(f => f.month === currentMonth && f.status === 'Paid')
      .reduce((sum, f) => sum + f.amount, 0);
  }, [fees, currentMonth]);

  // 3. Attendance Today % (Class-specific if teacher)
  const attendanceTodayPercent = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendance.filter(r => r.date === today);
    if (todayRecords.length === 0) return null;

    let relevantRecords = todayRecords;
    if (isTeacher && teacherClass !== 'None') {
      const classStudentIds = new Set(
        students.filter(s => s.className.toLowerCase() === teacherClass.toLowerCase()).map(s => s.id)
      );
      relevantRecords = todayRecords.filter(r => classStudentIds.has(r.studentId));
    }

    if (relevantRecords.length === 0) return null;
    const presentCount = relevantRecords.filter(r => r.status === 'Present').length;
    return Math.round((presentCount / relevantRecords.length) * 100);
  }, [attendance, isTeacher, teacherClass, students]);

  // 4. Pending fees list for the dashboard feed (Admin only)
  const pendingFees = useMemo(() => {
    return fees
      .filter(f => f.status === 'Pending')
      .map(f => {
        const student = students.find(s => s.id === f.studentId);
        return {
          ...f,
          studentName: student?.name || 'Unknown Student',
          className: student?.className || 'N/A'
        };
      });
  }, [fees, students]);

  // 5. Classroom students list (Teacher only)
  const classStudents = useMemo(() => {
    if (isTeacher && teacherClass !== 'None') {
      return students.filter(s => s.className.toLowerCase() === teacherClass.toLowerCase());
    }
    return [];
  }, [students, isTeacher, teacherClass]);

  return (
    <div className="space-y-6">
      {/* School Custom Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/10 to-transparent border border-blue-500/20 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-1 bg-gradient-to-tr from-amber-500 to-blue-600 rounded-full shadow-lg shrink-0">
            <img 
              src={schoolLogo} 
              alt="Al-Suffa Logo" 
              className="w-16 h-16 rounded-full border border-zinc-950 object-cover bg-white"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
              Al-Suffa Science & Grammar Schools
            </h1>
            <p className="text-xs text-blue-400 font-semibold mt-1 flex flex-wrap items-center gap-2">
              <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">📍 Lahore Campus</span>
              <span className="text-gray-600 hidden sm:inline">•</span>
              {isTeacher ? (
                <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase text-[10px]">👩‍🏫 Classroom Portal: {teacherClass}</span>
              ) : (
                <span className="text-gray-300 font-normal">Principal Control Console (Admin)</span>
              )}
            </p>
          </div>
        </div>
        <div className="bg-gray-800/80 backdrop-blur border border-gray-700/50 px-3 py-2 rounded-xl text-xs font-mono text-gray-300 flex items-center gap-2 self-stretch md:self-auto justify-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Security Role: {userSession?.role === 'admin' ? 'SYSTEM ADMINISTRATOR' : 'CLASSROOM TEACHER'}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Students */}
        <div 
          onClick={() => onNavigate(isTeacher ? 'grades' : 'admission')}
          className="bg-gray-800/70 border border-gray-700/40 rounded-xl p-5 hover:border-blue-500/50 hover:bg-gray-800/90 transition duration-200 cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
              <Users size={20} />
            </div>
            <span className="text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              {isTeacher ? 'View Grades' : 'Manage'} <ArrowRight size={12} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white tracking-tight">{totalStudents}</h3>
            <p className="text-xs text-gray-400 mt-1 font-medium">
              {isTeacher ? `Active Class Students (${teacherClass})` : 'Total Students Registered'}
            </p>
          </div>
        </div>

        {/* Middle Card: Fees (Admin) or Designation (Teacher) */}
        {!isTeacher ? (
          <div 
            onClick={() => onNavigate('fees')}
            className="bg-gray-800/70 border border-gray-700/40 rounded-xl p-5 hover:border-emerald-500/50 hover:bg-gray-800/90 transition duration-200 cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <DollarSign size={20} />
              </div>
              <span className="text-xs text-emerald-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                Manage <ArrowRight size={12} />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-white tracking-tight">Rs. {totalFeesPaid.toLocaleString()}</h3>
              <p className="text-xs text-gray-400 mt-1 font-medium">Fees Collected ({currentMonth})</p>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => onNavigate('grades')}
            className="bg-gray-800/70 border border-gray-700/40 rounded-xl p-5 hover:border-amber-500/50 hover:bg-gray-800/90 transition duration-200 cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
                <BookOpen size={20} />
              </div>
              <span className="text-xs text-amber-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                Classroom <ArrowRight size={12} />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-bold text-white tracking-tight truncate">{teacherClass}</h3>
              <p className="text-xs text-gray-400 mt-1 font-medium">Designated Class Teacher</p>
            </div>
          </div>
        )}

        {/* Attendance */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="bg-gray-800/70 border border-gray-700/40 rounded-xl p-5 hover:border-purple-500/50 hover:bg-gray-800/90 transition duration-200 cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg">
              <Calendar size={20} />
            </div>
            <span className="text-xs text-purple-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              Logger <ArrowRight size={12} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {attendanceTodayPercent !== null ? `${attendanceTodayPercent}%` : 'N/A'}
            </h3>
            <p className="text-xs text-gray-400 mt-1 font-medium">
              {isTeacher ? 'My Class Today' : "Today's Attendance Status"}
            </p>
          </div>
        </div>
      </div>

      {/* Feed Section */}
      <div className="w-full">
        {!isTeacher ? (
          /* Admin Feed: Outstanding Fees */
          <div className="bg-gray-800/50 border border-gray-700/30 rounded-xl p-5 flex flex-col h-[380px]">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span>⚠️</span> Outstanding Fees List
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
              {pendingFees.length > 0 ? (
                pendingFees.map((fee, idx) => (
                  <div key={idx} className="bg-gray-900/60 border border-gray-800 rounded-lg p-3 flex justify-between items-center hover:bg-gray-900/80 transition duration-150">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{fee.studentName}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{fee.className}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-rose-400 font-mono font-bold">Rs. {fee.amount.toLocaleString()}</span>
                      <p className="text-[10px] text-gray-500 mt-0.5">{fee.month}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                  <p className="text-sm text-gray-400">🎉 All billing fully cleared!</p>
                  <p className="text-xs text-gray-500 mt-1">Outstanding fees list is empty.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Teacher Feed: Class Students Directory */
          <div className="bg-gray-800/50 border border-gray-700/30 rounded-xl p-5 flex flex-col h-[380px]">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span>📋</span> Classroom Students Roster ({teacherClass})
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
              {classStudents.length > 0 ? (
                classStudents.map((student) => (
                  <div key={student.id} className="bg-gray-900/60 border border-gray-800 rounded-lg p-3 flex justify-between items-center hover:bg-gray-900/80 transition duration-150">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{student.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Guardian: {student.guardianName || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-[#1f538d]/20 text-blue-400 border border-[#1f538d]/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">Roll: {student.rollNo}</span>
                      <p className="text-[10px] text-gray-500 mt-0.5">Contact: {student.contact}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                  <p className="text-sm text-gray-400">📋 No students in your assigned class yet.</p>
                  <p className="text-xs text-gray-500 mt-1">Contact administration to register students for {teacherClass}.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
