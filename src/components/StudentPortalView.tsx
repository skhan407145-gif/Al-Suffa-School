import React, { useState, useMemo, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Student, FeeRecord, AttendanceRecord, StudentFeedback, LeaveApplication, StudentResult, UserSession } from '../types';
import { 
  User, Award, DollarSign, Calendar, Send, Star, 
  CheckCircle, XCircle, Clock, LogOut, MessageSquare, 
  Sparkles, ListCollapse, ChevronRight, GraduationCap,
  AlertCircle, RefreshCw
} from 'lucide-react';

interface StudentPortalViewProps {
  students: Student[];
  fees: FeeRecord[];
  attendance: AttendanceRecord[];
  results: StudentResult[];
  feedbacks: StudentFeedback[];
  leaveApplications: LeaveApplication[];
  onAddFeedback: (feedback: Omit<StudentFeedback, 'id' | 'date'>) => void;
  onAddLeave: (leave: Omit<LeaveApplication, 'id' | 'status' | 'dateSubmitted'>) => void;
  appearanceMode: 'dark' | 'light';
  // Admin triggers if they want to approve leaves/view feedbacks
  onApproveLeave?: (id: number) => void;
  onRejectLeave?: (id: number) => void;
  userSession?: UserSession | null;
  onLogout?: () => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  students,
  fees,
  attendance,
  results,
  feedbacks,
  leaveApplications,
  onAddFeedback,
  onAddLeave,
  appearanceMode,
  onApproveLeave,
  onRejectLeave,
  userSession,
  onLogout
}) => {
  // Login State
  const [rollNoInput, setRollNoInput] = useState('');
  const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(null);
  const [loginError, setLoginError] = useState('');

  // Active Tab within Student Portal
  const [studentTab, setStudentTab] = useState<'profile' | 'results' | 'leave' | 'feedback' | 'aiAdvisor'>('profile');

  // AI Advisor States
  const [advisorResponse, setAdvisorResponse] = useState<string>('');
  const [loadingAdvisor, setLoadingAdvisor] = useState<boolean>(false);
  const [advisorError, setAdvisorError] = useState<string>('');

  // Leave Form State
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSuccessMsg, setLeaveSuccessMsg] = useState('');

  // Feedback Form State
  const [teachingRating, setTeachingRating] = useState(5);
  const [environmentRating, setEnvironmentRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState('');

  // Mode: Student vs Admin View inside this tab
  const [portalMode, setPortalMode] = useState<'student' | 'admin'>('student');

  // Sync login with active session
  useEffect(() => {
    if (userSession) {
      if (userSession.role === 'student') {
        const student = students.find(s => s.id === userSession.userId) || null;
        setLoggedInStudent(student);
        setPortalMode('student');
      } else {
        setLoggedInStudent(null);
        setPortalMode('admin');
      }
    }
  }, [userSession, students]);

  // Filter feedbacks based on Teacher class
  const filteredFeedbacks = useMemo(() => {
    if (!userSession) return feedbacks;
    if (userSession.role === 'admin') return feedbacks;
    if (userSession.role === 'teacher') {
      const teacherClass = userSession.className;
      if (!teacherClass || teacherClass === 'None') return [];
      const classStudentIds = new Set(students.filter(s => s.className.toLowerCase() === teacherClass.toLowerCase()).map(s => s.id));
      return feedbacks.filter(f => classStudentIds.has(f.studentId));
    }
    return feedbacks;
  }, [feedbacks, userSession, students]);

  // Filter leaves based on Teacher class
  const filteredLeaves = useMemo(() => {
    if (!userSession) return leaveApplications;
    if (userSession.role === 'admin') return leaveApplications;
    if (userSession.role === 'teacher') {
      const teacherClass = userSession.className;
      if (!teacherClass || teacherClass === 'None') return [];
      const classStudentIds = new Set(students.filter(s => s.className.toLowerCase() === teacherClass.toLowerCase()).map(s => s.id));
      return leaveApplications.filter(l => classStudentIds.has(l.studentId));
    }
    return leaveApplications;
  }, [leaveApplications, userSession, students]);

  // Attempt login
  const handleLogin = (rollNo: string) => {
    const trimmed = rollNo.trim();
    if (!trimmed) {
      setLoginError('Please enter a valid Roll Number.');
      return;
    }
    const found = students.find(s => s.rollNo.toLowerCase() === trimmed.toLowerCase());
    if (found) {
      setLoggedInStudent(found);
      setRollNoInput('');
      setLoginError('');
      setStudentTab('profile');
    } else {
      setLoginError('Student not found. Use one of the Demo Roll Numbers below.');
    }
  };

  const handleLogout = () => {
    setLoggedInStudent(null);
    setLeaveSuccessMsg('');
    setFeedbackSuccessMsg('');
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      handleLogout();
    }
  };

  // Calculations for logged-in student
  const studentStats = useMemo(() => {
    if (!loggedInStudent) return null;
    const sId = loggedInStudent.id;

    // Filter attendance
    const studentAtt = attendance.filter(a => a.studentId === sId);
    const totalDays = studentAtt.length;
    const presentDays = studentAtt.filter(a => a.status === 'Present').length;
    const absentDays = totalDays - presentDays;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    // Filter fees
    const studentFees = fees.filter(f => f.studentId === sId);

    // Filter results
    const studentResult = results.find(r => r.studentId === sId);

    // Filter leaves
    const studentLeaves = leaveApplications.filter(l => l.studentId === sId);

    return {
      totalDays,
      presentDays,
      absentDays,
      attendancePercentage,
      studentFees,
      studentResult,
      studentLeaves
    };
  }, [loggedInStudent, attendance, fees, results, leaveApplications]);

  // Leave Submit
  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInStudent) return;
    if (!leaveStartDate || !leaveEndDate || !leaveReason.trim()) {
      alert('Please fill out all leave application fields!');
      return;
    }

    onAddLeave({
      studentId: loggedInStudent.id,
      studentName: loggedInStudent.name,
      rollNo: loggedInStudent.rollNo,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      reason: leaveReason.trim()
    });

    setLeaveStartDate('');
    setLeaveEndDate('');
    setLeaveReason('');
    setLeaveSuccessMsg('Leave application submitted successfully! Pending admin approval.');
    setTimeout(() => setLeaveSuccessMsg(''), 5000);
  };

  // Feedback Submit
  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInStudent) return;
    if (!feedbackComments.trim()) {
      alert('Please enter your suggestions or comments!');
      return;
    }

    onAddFeedback({
      studentId: loggedInStudent.id,
      studentName: loggedInStudent.name,
      rollNo: loggedInStudent.rollNo,
      teachingRating,
      environmentRating,
      comments: feedbackComments.trim()
    });

    setFeedbackComments('');
    setTeachingRating(5);
    setEnvironmentRating(5);
    setFeedbackSuccessMsg('Thank you for your valuable feedback! Submissions are anonymous to public visitors.');
    setTimeout(() => setFeedbackSuccessMsg(''), 5000);
  };

  // School-wide analytics for administrator overview
  const schoolFeedbackSummary = useMemo(() => {
    if (filteredFeedbacks.length === 0) return { avgTeaching: 0, avgEnvironment: 0, total: 0 };
    const totalTeaching = filteredFeedbacks.reduce((acc, curr) => acc + curr.teachingRating, 0);
    const totalEnv = filteredFeedbacks.reduce((acc, curr) => acc + curr.environmentRating, 0);
    return {
      avgTeaching: parseFloat((totalTeaching / filteredFeedbacks.length).toFixed(1)),
      avgEnvironment: parseFloat((totalEnv / filteredFeedbacks.length).toFixed(1)),
      total: filteredFeedbacks.length
    };
  }, [filteredFeedbacks]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>🎓</span> Al-Suffa Student Results & Leave Portal
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Access secure exam progress cards, complete monthly fees history, apply for leave, and review quality of teaching.
          </p>
        </div>

        {/* Portal Mode Toggle for testing */}
        {(!userSession || userSession.role === 'admin') && (
          <div className="flex bg-gray-900 border border-gray-850 p-1 rounded-lg">
            <button
              onClick={() => setPortalMode('student')}
              className={`px-3 py-1 text-xs font-bold rounded transition ${
                portalMode === 'student' ? 'bg-[#1f538d] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              🧑‍🎓 Student View
            </button>
            <button
              onClick={() => setPortalMode('admin')}
              className={`px-3 py-1 text-xs font-bold rounded transition flex items-center gap-1 ${
                portalMode === 'admin' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>🛡️</span> Control Panel
            </button>
          </div>
        )}
      </div>

      {portalMode === 'admin' ? (
        /* ==================== CONTROL PANEL (ADMIN VIEW) ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Feedbacks overview */}
          <div className="lg:col-span-5 bg-gray-800/50 border border-gray-700/30 rounded-xl p-5 flex flex-col h-[520px]">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <MessageSquare size={18} className="text-[#1f538d]" />
              <span>Feedback Ledger ({schoolFeedbackSummary.total})</span>
            </h3>

            {/* Averages Block */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800 text-center">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Avg Teaching Rating</span>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="text-lg font-bold text-amber-400">{schoolFeedbackSummary.avgTeaching || 'N/A'}</span>
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                </div>
              </div>
              <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800 text-center">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Avg Campus Environment</span>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="text-lg font-bold text-sky-400">{schoolFeedbackSummary.avgEnvironment || 'N/A'}</span>
                  <Star size={14} className="fill-sky-400 text-sky-400" />
                </div>
              </div>
            </div>

            {/* Feedback List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {filteredFeedbacks.length > 0 ? (
                filteredFeedbacks.map((f) => (
                  <div key={f.id} className="bg-gray-900/60 border border-gray-800 p-3.5 rounded-lg text-xs space-y-2">
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="font-semibold text-white">{f.studentName} ({f.rollNo})</span>
                      <span>{f.date}</span>
                    </div>
                    <div className="flex gap-4 border-t border-b border-gray-800/50 py-1.5 my-1 text-[11px]">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 font-medium">Teaching:</span>
                        <div className="flex text-amber-400 font-bold items-center">
                          {f.teachingRating} <Star size={10} className="fill-amber-400 ml-0.5" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 font-medium">Environment:</span>
                        <div className="flex text-sky-400 font-bold items-center">
                          {f.environmentRating} <Star size={10} className="fill-sky-400 ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300 italic">"{f.comments}"</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <span className="text-3xl">💬</span>
                  <p className="text-sm text-gray-400 mt-2 font-medium">No student feedback logged yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Leaves approvals overview */}
          <div className="lg:col-span-7 bg-gray-800/50 border border-gray-700/30 rounded-xl p-5 flex flex-col h-[520px]">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Calendar size={18} className="text-amber-500" />
              <span>Leave Approval Desk</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
              {filteredLeaves.length > 0 ? (
                filteredLeaves.map((l) => {
                  const s = students.find(st => st.id === l.studentId);
                  return (
                    <div key={l.id} className="bg-gray-900/60 border border-gray-800 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white">{l.studentName}</h4>
                          <p className="text-xs text-gray-400 font-medium mt-0.5">
                            Roll No: <span className="text-blue-400">{l.rollNo}</span> | Class: {s?.className || 'N/A'}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          l.status === 'Approved' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : l.status === 'Rejected'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {l.status}
                        </span>
                      </div>

                      <div className="bg-gray-950/40 p-3 rounded-lg text-xs space-y-1.5 border border-gray-850">
                        <p className="text-gray-400 font-medium">
                          📅 Requested Dates: <span className="text-white">{l.startDate}</span> to <span className="text-white">{l.endDate}</span>
                        </p>
                        <p className="text-gray-300 italic mt-1 font-mono">
                          "{l.reason}"
                        </p>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-gray-500 border-t border-gray-800/40 pt-2.5">
                        <span>Submitted: {l.dateSubmitted}</span>
                        {l.status === 'Pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => onRejectLeave?.(l.id)}
                              className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-400 font-bold rounded-lg transition text-xs flex items-center gap-1 border border-rose-800/50"
                            >
                              <XCircle size={12} /> Reject
                            </button>
                            <button
                              onClick={() => onApproveLeave?.(l.id)}
                              className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 font-bold rounded-lg transition text-xs flex items-center gap-1 border border-emerald-800/50"
                            >
                              <CheckCircle size={12} /> Approve
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <span className="text-3xl">📬</span>
                  <p className="text-sm text-gray-400 mt-2 font-medium">No leave applications submitted.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : !loggedInStudent ? (
        /* ==================== MOCK LOGIN PORTAL SCREEN ==================== */
        <div className="max-w-md mx-auto bg-gray-850 border border-gray-700/40 rounded-2xl shadow-xl p-6 space-y-6 mt-4">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-[#1f538d]/10 text-[#1f538d] rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              <GraduationCap size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Student Sign-In</h3>
            <p className="text-xs text-gray-400">
              Provide your Class Roll Number to view terminal marks sheets, leave logs, and dues.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(rollNoInput); }} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Roll Number *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={rollNoInput}
                  onChange={(e) => setRollNoInput(e.target.value)}
                  placeholder="e.g. 101, 102, 201"
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition placeholder:text-gray-600"
                />
                <button
                  type="submit"
                  className="bg-[#1f538d] hover:bg-blue-600 text-white px-4 py-2 text-sm font-bold rounded-lg transition"
                >
                  Verify
                </button>
              </div>
              {loginError && <p className="text-xs text-rose-400 mt-1.5 font-medium">⚠️ {loginError}</p>}
            </div>
          </form>

          {/* DEMO ROLL NUMBERS QUICK SELECT */}
          <div className="border-t border-gray-800 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Quick Select Demo Students (Instant Verification):
            </h4>
            <div className="space-y-1.5">
              {students.map((student) => {
                const termResult = results.find(r => r.studentId === student.id);
                return (
                  <button
                    key={student.id}
                    onClick={() => handleLogin(student.rollNo)}
                    className="w-full text-left bg-gray-900/60 hover:bg-gray-900 border border-gray-850 p-2 rounded-lg flex justify-between items-center text-xs group transition"
                  >
                    <div>
                      <span className="font-semibold text-white block">{student.name}</span>
                      <span className="text-gray-400 font-medium text-[10px]">{student.className} (Roll: {student.rollNo})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 group-hover:text-blue-400">
                      {termResult ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          GPA {termResult.gpa}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-500">No Result</span>
                      )}
                      <ChevronRight size={12} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ==================== PORTAL LOGGED IN DASHBOARD ==================== */
        <div className="space-y-6">
          
          {/* Student Welcome Summary Card */}
          <div className="bg-gradient-to-r from-[#1f538d]/40 to-slate-900/80 border border-gray-700/50 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center font-bold text-lg shadow">
                {loggedInStudent.name.charAt(0)}
              </div>
              <div>
                <span className="text-[10px] bg-blue-500/15 text-blue-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Class Room Portal
                </span>
                <h3 className="text-lg font-extrabold text-white mt-1">
                  {loggedInStudent.name}
                </h3>
                <p className="text-xs text-gray-300 mt-0.5 font-medium">
                  Class: <span className="font-semibold text-white">{loggedInStudent.className}</span> | Roll Number: <span className="font-semibold text-white">{loggedInStudent.rollNo}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Contact Record</span>
                <span className="text-xs text-white font-semibold font-mono">{loggedInStudent.contact}</span>
              </div>
              <button
                onClick={handleLogoutClick}
                className="px-3.5 py-2 bg-gray-900 hover:bg-rose-950 text-gray-400 hover:text-rose-400 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 border border-gray-800"
              >
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          </div>

          {/* Inside-Portal Tabs */}
          <div className="flex border-b border-gray-800 overflow-x-auto gap-2">
            {[
              { id: 'profile', label: '👤 Admission & Fees', icon: User },
              { id: 'results', label: '🏆 Mid-Term Results', icon: Award },
              { id: 'leave', label: '📅 Online Leave Application', icon: Calendar },
              { id: 'feedback', label: '💬 Teacher Feedback Corner', icon: MessageSquare },
              { id: 'aiAdvisor', label: '✨ AI Academic Advisor', icon: Sparkles },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = studentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStudentTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition ${
                    isActive 
                      ? 'border-[#297edb] text-[#297edb] bg-[#297edb]/5' 
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-900/30'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Viewports */}
          <div className="space-y-4">
            
            {/* 1. Profile, Attendance & Fees tab */}
            {studentTab === 'profile' && studentStats && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Profile detail card */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Attendance Stats Card */}
                  <div className="bg-gray-800/40 border border-gray-700/20 rounded-xl p-5 text-center space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider text-left border-b border-gray-800 pb-2 flex justify-between">
                      <span>📊 Attendance Tracker</span>
                      <span className="text-[10px] text-gray-500">Yearly Ledger</span>
                    </h4>

                    <div className="relative inline-flex items-center justify-center p-3">
                      {/* Attendance Pie representation text */}
                      <div className="text-center">
                        <span className="text-3xl font-extrabold text-white tracking-tighter">
                          {studentStats.attendancePercentage}%
                        </span>
                        <span className="text-[9px] text-gray-500 block uppercase font-bold mt-0.5">Average Present</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-800/50 pt-3">
                      <div className="text-center p-1">
                        <span className="text-emerald-400 font-bold block">{studentStats.presentDays} Days</span>
                        <span className="text-[10px] text-gray-500">Present</span>
                      </div>
                      <div className="text-center p-1">
                        <span className="text-rose-400 font-bold block">{studentStats.absentDays} Days</span>
                        <span className="text-[10px] text-gray-500">Absent</span>
                      </div>
                    </div>
                  </div>

                  {/* Campus details list */}
                  <div className="bg-gray-800/40 border border-gray-700/20 rounded-xl p-4 text-xs space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-850">
                      School Registry Info
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Principal Campus:</span>
                        <span className="text-gray-300">Lahore Central Branch</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Admission Date:</span>
                        <span className="text-gray-300">April 12, 2025</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className="text-emerald-400 font-semibold">Active & Enrolled</span>
                      </div>
                    </div>
                  </div>

                  {/* Parents & Guardian Info Card */}
                  <div className="bg-gray-800/40 border border-gray-700/20 rounded-xl p-4 text-xs space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-850 flex items-center gap-1">
                      <span>👨‍👩‍👧 Parents & Guardian Info</span>
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Father's Name:</span>
                        <span className="text-gray-200 font-semibold">{loggedInStudent.fatherName || 'Not Registered'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Mother's Name:</span>
                        <span className="text-gray-200 font-semibold">{loggedInStudent.motherName || 'Not Registered'}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-850 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Guardian Name:</span>
                          <span className="text-white font-bold">{loggedInStudent.guardianName || 'Parent'}</span>
                        </div>
                        {loggedInStudent.guardianRelation && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Relation:</span>
                            <span className="text-gray-300 font-mono text-[11px]">{loggedInStudent.guardianRelation}</span>
                          </div>
                        )}
                        {loggedInStudent.guardianContact && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Contact Number:</span>
                            <span className="text-blue-400 font-semibold font-mono">{loggedInStudent.guardianContact}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fees payment log */}
                <div className="lg:col-span-8 bg-gray-800/40 border border-gray-700/20 rounded-xl p-5 flex flex-col h-fit">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center justify-between border-b border-gray-850 pb-2.5">
                    <span className="flex items-center gap-1.5">
                      <DollarSign size={16} className="text-emerald-500" />
                      Monthly Fee Invoices
                    </span>
                    <span className="text-xs text-gray-400">Total Invoiced: {studentStats.studentFees.length}</span>
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-500 font-semibold">
                          <th className="py-2.5">Billing Month</th>
                          <th className="py-2.5">Amount Due</th>
                          <th className="py-2.5">Status</th>
                          <th className="py-2.5 text-right">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/40">
                        {studentStats.studentFees.length > 0 ? (
                          studentStats.studentFees.map((fee, idx) => (
                            <tr key={idx} className="hover:bg-gray-900/10 transition">
                              <td className="py-3 font-semibold text-gray-200">{fee.month}</td>
                              <td className="py-3 font-mono text-white">Rs. {fee.amount.toLocaleString()}</td>
                              <td className="py-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                                  fee.status === 'Paid'
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                                    : 'bg-amber-500/15 text-amber-400 border-amber-500/20 animate-pulse'
                                }`}>
                                  {fee.status}
                                </span>
                              </td>
                              <td className="py-3 text-right text-gray-500">
                                {fee.status === 'Paid' ? 'Paid via Bank Challan' : 'Dues outstanding'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-gray-500 font-medium">
                              No billing invoice history generated for this enrollment.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Mid-Term Results Tab */}
            {studentTab === 'results' && studentStats && (
              <div className="max-w-2xl mx-auto bg-gray-800/40 border border-gray-700/20 rounded-2xl p-6 space-y-6">
                {studentStats.studentResult ? (
                  <div className="space-y-6">
                    {/* Report Card Header */}
                    <div className="text-center border-b border-gray-800 pb-5 space-y-1">
                      <div className="inline-flex p-2 rounded-lg bg-yellow-500/10 text-yellow-500 text-xs font-bold uppercase tracking-widest mb-1.5">
                        🏆 Official Report Card
                      </div>
                      <h3 className="text-lg font-extrabold text-white">
                        {studentStats.studentResult.examName}
                      </h3>
                      <p className="text-xs text-gray-400">
                        Al-Suffa Science & Grammar High Schools Academic Board
                      </p>
                    </div>

                    {/* Result Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-gray-800 text-gray-500 uppercase tracking-wider font-bold">
                            <th className="py-2.5">Subject Paper</th>
                            <th className="py-2.5 text-center">Marks Obtained</th>
                            <th className="py-2.5 text-center">Total Marks</th>
                            <th className="py-2.5 text-right">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/40 font-mono">
                          {studentStats.studentResult.subjectScores.map((score, sIdx) => (
                            <tr key={sIdx} className="hover:bg-gray-900/15">
                              <td className="py-3 font-sans text-xs font-semibold text-gray-200">
                                {score.subject}
                              </td>
                              <td className="py-3 text-center text-white font-bold">{score.marks}</td>
                              <td className="py-3 text-center text-gray-400">{score.totalMarks}</td>
                              <td className="py-3 text-right">
                                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded font-mono ${
                                  ['A+', 'A'].includes(score.grade) 
                                    ? 'bg-emerald-500/15 text-emerald-400' 
                                    : ['B+', 'B'].includes(score.grade)
                                    ? 'bg-[#1f538d]/15 text-[#1f538d]'
                                    : 'bg-amber-500/15 text-amber-400'
                                }`}>
                                  {score.grade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Overall Summary block */}
                    <div className="bg-gray-900/60 rounded-xl p-4.5 border border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mt-4">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block">Aggregate Marks</span>
                        <span className="text-base font-extrabold text-white">
                          {studentStats.studentResult.totalObtained} / {studentStats.studentResult.totalPossible}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block">Percentage</span>
                        <span className="text-base font-extrabold text-emerald-400">
                          {studentStats.studentResult.percentage}%
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block">Final Grade GPA</span>
                        <span className="text-base font-extrabold text-blue-400">
                          {studentStats.studentResult.gpa} GPA
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block">Board Result</span>
                        <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full inline-block">
                          PASSED
                        </span>
                      </div>
                    </div>

                    {/* Teacher Remarks */}
                    <div className="bg-[#1f538d]/10 border border-[#1f538d]/20 rounded-xl p-4 text-xs">
                      <span className="font-bold text-white block mb-1">✍️ Board of Studies Remarks:</span>
                      <p className="text-gray-300 italic">"{studentStats.studentResult.remarks}"</p>
                    </div>

                    {/* Printable warning helper */}
                    <p className="text-[10px] text-gray-500 text-center font-medium font-mono">
                      Generated from Cloud Firebase Firestore on {new Date().toLocaleDateString()}. For certified copies, visit the admin block.
                    </p>
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-3">
                    <span className="text-4xl">🗒️</span>
                    <h3 className="text-md font-bold text-white">Results Awaiting Publication</h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      Mid-Term examinations results for your class have not been officially declared yet. Check back soon!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 3. Leave Application Tab */}
            {studentTab === 'leave' && studentStats && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Application Form */}
                <div className="lg:col-span-5 bg-gray-800/40 border border-gray-700/20 rounded-xl p-5 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-gray-850 pb-2.5">
                    <span>📝</span> Submit Leave Application
                  </h4>

                  {leaveSuccessMsg && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold">
                      ✅ {leaveSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleLeaveSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          value={leaveStartDate}
                          onChange={e => setLeaveStartDate(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                          End Date *
                        </label>
                        <input
                          type="date"
                          value={leaveEndDate}
                          onChange={e => setLeaveEndDate(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        Reason for Leave *
                      </label>
                      <textarea
                        value={leaveReason}
                        onChange={e => setLeaveReason(e.target.value)}
                        placeholder="Explain why you are requesting leave..."
                        rows={4}
                        className="w-full bg-gray-900 border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-650 resize-none"
                        required
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#1f538d] hover:bg-blue-600 text-white py-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5"
                    >
                      <Send size={12} /> Submit Application
                    </button>
                  </form>
                </div>

                {/* Applications History list */}
                <div className="lg:col-span-7 bg-gray-800/40 border border-gray-700/20 rounded-xl p-5 flex flex-col h-[400px]">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center justify-between border-b border-gray-850 pb-2.5">
                    <span>My Leave Requests Log</span>
                    <span className="text-xs text-gray-400 font-mono">Count: {studentStats.studentLeaves.length}</span>
                  </h4>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {studentStats.studentLeaves.length > 0 ? (
                      [...studentStats.studentLeaves].reverse().map((leave) => (
                        <div key={leave.id} className="bg-gray-900/40 border border-gray-800 p-3.5 rounded-lg space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-300">
                              📅 {leave.startDate} to {leave.endDate}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide border ${
                              leave.status === 'Approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : leave.status === 'Rejected'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                            }`}>
                              {leave.status}
                            </span>
                          </div>
                          <p className="text-gray-400 bg-gray-950/20 p-2 rounded text-[11px] font-mono italic">
                            "{leave.reason}"
                          </p>
                          <div className="text-[10px] text-gray-500 text-right">
                            Submitted on: {leave.dateSubmitted}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-12">
                        <span className="text-2xl text-gray-600">📥</span>
                        <p className="text-xs text-gray-400 mt-2 font-medium">No leave applications submitted yet.</p>
                        <p className="text-[10px] text-gray-500">Fill out the left form to apply for leave online.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Feedback Corner */}
            {studentTab === 'feedback' && studentStats && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Submission Form */}
                <div className="lg:col-span-5 bg-gray-800/40 border border-gray-700/20 rounded-xl p-5 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-gray-850 pb-2.5">
                    <span>💬</span> Give Campus Feedback
                  </h4>

                  {feedbackSuccessMsg && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold">
                      ❇️ {feedbackSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    {/* Star ratings: Teaching */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Teaching Quality rating
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setTeachingRating(star)}
                            className="p-1 hover:scale-110 transition"
                          >
                            <Star 
                              size={18} 
                              className={`transition ${
                                star <= teachingRating 
                                  ? 'fill-amber-400 text-amber-400' 
                                  : 'text-gray-600 hover:text-amber-300'
                              }`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Star ratings: Environment */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        School Environment rating
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEnvironmentRating(star)}
                            className="p-1 hover:scale-110 transition"
                          >
                            <Star 
                              size={18} 
                              className={`transition ${
                                star <= environmentRating 
                                  ? 'fill-sky-400 text-sky-400' 
                                  : 'text-gray-600 hover:text-sky-300'
                              }`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Detailed feedback text */}
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        Detailed Comments & Suggestions *
                      </label>
                      <textarea
                        value={feedbackComments}
                        onChange={e => setFeedbackComments(e.target.value)}
                        placeholder="Share your thoughts on teacher support, computer labs, library, or sports playgrounds..."
                        rows={4}
                        className="w-full bg-gray-900 border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-650 resize-none"
                        required
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <Send size={12} /> Submit Anonymous Feedback
                    </button>
                  </form>
                </div>

                {/* My Feedbacks or transparent School Summary info */}
                <div className="lg:col-span-7 bg-gray-800/40 border border-gray-700/20 rounded-xl p-5 flex flex-col space-y-4">
                  <h4 className="text-sm font-bold text-white border-b border-gray-850 pb-2.5">
                    🌟 transparent Campus Ratings Summary
                  </h4>

                  <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800/60 space-y-3.5">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      At Al-Suffa Science & Grammar High Schools, student suggestions are evaluated directly by the Administrative Board to implement syllabus enhancements and facilities upgrades.
                    </p>

                    <div className="space-y-2 border-t border-gray-800/80 pt-3.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Quality of Instruction:</span>
                        <div className="flex gap-0.5 text-amber-400">
                          <Star size={12} className="fill-amber-400" />
                          <Star size={12} className="fill-amber-400" />
                          <Star size={12} className="fill-amber-400" />
                          <Star size={12} className="fill-amber-400" />
                          <Star size={12} className="fill-amber-400" />
                          <span className="text-white font-bold font-mono ml-1.5">5.0 / 5</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Library & Laboratory:</span>
                        <div className="flex gap-0.5 text-sky-400">
                          <Star size={12} className="fill-sky-400" />
                          <Star size={12} className="fill-sky-400" />
                          <Star size={12} className="fill-sky-400" />
                          <Star size={12} className="fill-sky-400" />
                          <Star size={12} className="text-sky-500/20" />
                          <span className="text-white font-bold font-mono ml-1.5">4.0 / 5</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">General Hygiene:</span>
                        <div className="flex gap-0.5 text-emerald-400">
                          <Star size={12} className="fill-emerald-400" />
                          <Star size={12} className="fill-emerald-400" />
                          <Star size={12} className="fill-emerald-400" />
                          <Star size={12} className="fill-emerald-400" />
                          <Star size={12} className="fill-emerald-400" />
                          <span className="text-white font-bold font-mono ml-1.5">4.8 / 5</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1f538d]/5 border border-[#1f538d]/15 p-4 rounded-xl text-xs space-y-1.5">
                    <span className="font-bold text-[#297edb] block">📢 Recent School Enhancements from Feedback:</span>
                    <ul className="list-disc list-inside text-gray-400 space-y-1">
                      <li>Upgraded Science Lab Kits for Class 9 and 10 classrooms.</li>
                      <li>Introduced interactive digital whiteboards in Science Lecture Rooms.</li>
                      <li>Extended library study hours to 4:00 PM for self-study.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 5. AI Advisor Tab */}
            {studentTab === 'aiAdvisor' && studentStats && loggedInStudent && (
              <div className="bg-gray-800/40 border border-gray-700/20 rounded-2xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="text-blue-400 animate-pulse" size={18} />
                      Al-Suffa Smart Study Guide
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Retrieve a personalized 4-week study routine, recommended electives, and GPA optimizer tips.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      setLoadingAdvisor(true);
                      setAdvisorError('');
                      try {
                        const prompt = `Student Name: ${loggedInStudent.name}
Class: ${loggedInStudent.className}
Roll Number: ${loggedInStudent.rollNo}
Current Attendance: ${studentStats.attendancePercentage}% (Present: ${studentStats.presentDays}, Absent: ${studentStats.absentDays})
GPA: ${studentStats.studentResult?.gpa || 'N/A'}
Grade Breakdown:
${studentStats.studentResult?.subjectScores?.map(s => `- ${s.subject}: ${s.marks}/${s.totalMarks} (${s.grade})`).join('\n') || 'No exams posted yet.'}

Provide:
1. A realistic academic analysis.
2. Custom tips to improve in subjects where marks are lower.
3. A realistic study timetable/routine for school homework and self-study.
4. Motivational advice to excel.`;

                        const res = await fetch('/api/ai/insights', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            prompt,
                            systemInstruction: "You are the head educational advisor and study coach at Al-Suffa Schools. Provide highly encouraging, realistic, and structural tips to study better in elegant markdown format."
                          })
                        });
                        const data = await res.json();
                        if (data.error) throw new Error(data.error);
                        setAdvisorResponse(data.text || 'No guidelines drafted.');
                      } catch (err: any) {
                        setAdvisorError(err.message || 'Error communicating with Gemini');
                      } finally {
                        setLoadingAdvisor(false);
                      }
                    }}
                    disabled={loadingAdvisor}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-lg disabled:opacity-50"
                  >
                    {loadingAdvisor ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {loadingAdvisor ? 'Consulting Gemini...' : 'Request AI Study Guide'}
                  </button>
                </div>

                {advisorError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span>{advisorError}</span>
                  </div>
                )}

                {advisorResponse ? (
                  <div className="bg-gray-900/60 p-6 rounded-2xl border border-gray-850 text-xs leading-relaxed text-gray-300">
                    <div className="prose prose-invert prose-xs max-w-none">
                      <Markdown>{advisorResponse}</Markdown>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-800 p-12 text-center rounded-2xl text-gray-500 text-xs">
                    Press "Request AI Study Guide" to generate customized learning plans.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
