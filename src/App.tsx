import { useState, useEffect } from 'react';
import { Student, FeeRecord, AttendanceRecord, InventoryItem, StudentResult, StudentFeedback, LeaveApplication, Teacher, Admin, UserSession } from './types';
import { getCurrentMonthString } from './initialData';

import { DashboardView } from './components/DashboardView';
import { AdmissionView } from './components/AdmissionView';
import { FeesView } from './components/FeesView';
import { AttendanceView } from './components/AttendanceView';
import { InventoryView } from './components/InventoryView';
import { StudentPortalView } from './components/StudentPortalView';
import { TeachersView } from './components/TeachersView';
import { AdminsView } from './components/AdminsView';
import { LoginView } from './components/LoginView';
import { GradesView } from './components/GradesView';
import { AIInsightsView } from './components/AIInsightsView';

import { Terminal, Code, Sun, Moon, Laptop, LogOut } from 'lucide-react';
import { saveDocument, deleteDocument, seedInitialDataIfEmpty, subscribeToCollection, isFirebaseConnected } from './firebase';

const schoolLogo = "/src/assets/images/alsuffa_logo_1783059479131.jpg";

export default function App() {
  // Appearance Mode ('dark' | 'light')
  const [appearanceMode, setAppearanceMode] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('app-appearance-mode');
    return (saved as 'dark' | 'light') || 'dark';
  });

  // User Authentication State
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('school-user-session');
    return saved ? JSON.parse(saved) : null;
  });

  // State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [feedbacks, setFeedbacks] = useState<StudentFeedback[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentMonth = getCurrentMonthString();

  // Load state from Firestore with real-time subscriptions
  useEffect(() => {
    let unsubscribes: (() => void)[] = [];

    async function initAndSubscribe() {
      setIsLoading(true);
      try {
        await seedInitialDataIfEmpty();
      } catch (err) {
        console.error('Error seeding initial data:', err);
      } finally {
        setIsLoading(false);
      }

      // 1. Student subscription (singular)
      const unsubStudents = subscribeToCollection<Student>('student', (fetched) => {
        setStudents(fetched.sort((a, b) => a.name.localeCompare(b.name)));
      });
      unsubscribes.push(unsubStudents);

      // 2. Teacher subscription (singular)
      const unsubTeachers = subscribeToCollection<Teacher>('teacher', (fetched) => {
        setTeachers(fetched);
      });
      unsubscribes.push(unsubTeachers);

      // 3. Admin subscription (singular)
      const unsubAdmins = subscribeToCollection<Admin>('admin', (fetched) => {
        setAdmins(fetched);
      });
      unsubscribes.push(unsubAdmins);

      // 4. Fees subscription
      const unsubFees = subscribeToCollection<FeeRecord>('fees', (fetched) => {
        setFees(fetched);
      });
      unsubscribes.push(unsubFees);

      // 5. Attendance subscription
      const unsubAttendance = subscribeToCollection<AttendanceRecord>('attendance', (fetched) => {
        setAttendance(fetched);
      });
      unsubscribes.push(unsubAttendance);

      // 6. Inventory subscription
      const unsubInventory = subscribeToCollection<InventoryItem>('inventory', (fetched) => {
        setInventory(fetched);
      });
      unsubscribes.push(unsubInventory);

      // 7. Results subscription
      const unsubResults = subscribeToCollection<StudentResult>('results', (fetched) => {
        setResults(fetched);
      });
      unsubscribes.push(unsubResults);

      // 8. Feedbacks subscription
      const unsubFeedbacks = subscribeToCollection<StudentFeedback>('feedbacks', (fetched) => {
        setFeedbacks(fetched);
      });
      unsubscribes.push(unsubFeedbacks);

      // 9. Leaves subscription
      const unsubLeaves = subscribeToCollection<LeaveApplication>('leaves', (fetched) => {
        setLeaveApplications(fetched);
      });
      unsubscribes.push(unsubLeaves);
    }

    initAndSubscribe();

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, []);

  // Redirect or sync tabs on login role
  useEffect(() => {
    if (userSession) {
      if (userSession.role === 'student') {
        setActiveTab('studentPortal');
      } else if (activeTab === 'studentPortal') {
        // Keep it for teachers/admins
      }
    } else {
      setActiveTab('dashboard');
    }
  }, [userSession]);

  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    localStorage.setItem('school-user-session', JSON.stringify(session));
    if (session.role === 'student') {
      setActiveTab('studentPortal');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setUserSession(null);
    localStorage.removeItem('school-user-session');
    setActiveTab('dashboard');
  };

  const handleSaveResult = async (updatedResult: StudentResult) => {
    setResults(prev => {
      const exists = prev.some(r => r.studentId === updatedResult.studentId);
      if (exists) {
        return prev.map(r => r.studentId === updatedResult.studentId ? updatedResult : r);
      } else {
        return [...prev, updatedResult];
      }
    });
    try {
      await saveDocument('results', updatedResult.studentId.toString(), updatedResult);
    } catch (err) {
      console.error('Error saving result in Firestore:', err);
    }
  };

  // 1. Save or Update Student
  const handleSaveStudent = async (newStudent: Omit<Student, 'id'> & { id?: number }) => {
    let studentId = newStudent.id;
    let updated: Student[];
    let created: Student;
    if (studentId) {
      // Update
      created = newStudent as Student;
      updated = students.map(s => s.id === studentId ? created : s);
    } else {
      // Create new ID
      studentId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
      created = {
        ...(newStudent as Omit<Student, 'id'>),
        id: studentId
      };
      updated = [...students, created];
    }
    setStudents(updated);
    try {
      await saveDocument('student', studentId, created);
    } catch (err) {
      console.error('Error saving student to Firestore:', err);
    }
  };

  // 2. Delete Student and associated records (Cascade Delete)
  const handleDeleteStudent = async (id: number) => {
    // Filter out student
    const updatedStudents = students.filter(s => s.id !== id);
    setStudents(updatedStudents);

    // Cascade delete fees
    const updatedFees = fees.filter(f => f.studentId !== id);
    setFees(updatedFees);

    // Cascade delete attendance
    const updatedAttendance = attendance.filter(a => a.studentId !== id);
    setAttendance(updatedAttendance);

    try {
      await deleteDocument('student', id);
      
      const feesToDelete = fees.filter(f => f.studentId === id);
      for (const f of feesToDelete) {
        const feeId = `fee_${f.studentId}_${f.month}`;
        await deleteDocument('fees', feeId);
      }

      const attToDelete = attendance.filter(a => a.studentId === id);
      for (const a of attToDelete) {
        const attId = `att_${a.studentId}_${a.date}`;
        await deleteDocument('attendance', attId);
      }
    } catch (err) {
      console.error('Error cascade deleting student from Firestore:', err);
    }
  };

  // 3. Toggle Fee Status
  const handleToggleFee = async (studentId: number, month: string, amount: number) => {
    const existingIdx = fees.findIndex(f => f.studentId === studentId && f.month === month);
    let updated: FeeRecord[];
    let feeRecord: FeeRecord;

    if (existingIdx > -1) {
      // Update status
      updated = [...fees];
      feeRecord = {
        ...updated[existingIdx],
        status: updated[existingIdx].status === 'Paid' ? 'Pending' : 'Paid',
        amount // Update amount in case billing value was changed in the input field
      };
      updated[existingIdx] = feeRecord;
    } else {
      // Create billing record
      feeRecord = {
        studentId,
        month,
        amount,
        status: 'Paid' // Toggle starting state goes straight to Paid
      };
      updated = [...fees, feeRecord];
    }

    setFees(updated);
    try {
      const feeId = `fee_${studentId}_${month}`;
      await saveDocument('fees', feeId, feeRecord);
    } catch (err) {
      console.error('Error saving fee to Firestore:', err);
    }
  };

  // 4. Save Class Attendance sheet
  const handleSaveAttendance = async (date: string, records: Array<{ studentId: number; status: 'Present' | 'Absent' }>) => {
    // Filter out all existing records for these students on this specific date to avoid duplicate entries
    const studentIdsToReplace = new Set(records.map(r => r.studentId));
    const filtered = attendance.filter(a => !(a.date === date && studentIdsToReplace.has(a.studentId)));

    // Append new records
    const newRecords: AttendanceRecord[] = records.map(r => ({
      studentId: r.studentId,
      date,
      status: r.status
    }));

    const updated = [...filtered, ...newRecords];
    setAttendance(updated);

    try {
      for (const r of newRecords) {
        const attId = `att_${r.studentId}_${r.date}`;
        await saveDocument('attendance', attId, r);
      }
    } catch (err) {
      console.error('Error saving attendance to Firestore:', err);
    }
  };

  // 5. Save or Update Inventory Item
  const handleSaveInventoryItem = async (newItem: Omit<InventoryItem, 'id'> & { id?: number }) => {
    let itemId = newItem.id;
    let updated: InventoryItem[];
    let created: InventoryItem;
    if (itemId) {
      created = newItem as InventoryItem;
      updated = inventory.map(item => item.id === itemId ? created : item);
    } else {
      itemId = inventory.length > 0 ? Math.max(...inventory.map(item => item.id)) + 1 : 1;
      created = {
        id: itemId,
        itemName: newItem.itemName,
        quantity: newItem.quantity,
        lowStockThreshold: newItem.lowStockThreshold,
        expiryDate: newItem.expiryDate
      };
      updated = [...inventory, created];
    }
    setInventory(updated);
    try {
      await saveDocument('inventory', itemId, created);
    } catch (err) {
      console.error('Error saving inventory item to Firestore:', err);
    }
  };

  // 6. Delete Inventory Item
  const handleDeleteInventoryItem = async (id: number) => {
    const updated = inventory.filter(item => item.id !== id);
    setInventory(updated);
    try {
      await deleteDocument('inventory', id);
    } catch (err) {
      console.error('Error deleting inventory item from Firestore:', err);
    }
  };

  // 7. Add Student Feedback
  const handleAddFeedback = async (newFb: Omit<StudentFeedback, 'id' | 'date'>) => {
    const nextId = feedbacks.length > 0 ? Math.max(...feedbacks.map(f => f.id)) + 1 : 1;
    const created: StudentFeedback = {
      id: nextId,
      ...newFb,
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [created, ...feedbacks];
    setFeedbacks(updated);
    try {
      await saveDocument('feedbacks', nextId, created);
    } catch (err) {
      console.error('Error saving feedback to Firestore:', err);
    }
  };

  // 8. Add Leave Application
  const handleAddLeave = async (newLeave: Omit<LeaveApplication, 'id' | 'status' | 'dateSubmitted'>) => {
    const nextId = leaveApplications.length > 0 ? Math.max(...leaveApplications.map(l => l.id)) + 1 : 1;
    const created: LeaveApplication = {
      id: nextId,
      ...newLeave,
      status: 'Pending',
      dateSubmitted: new Date().toISOString().split('T')[0]
    };
    const updated = [created, ...leaveApplications];
    setLeaveApplications(updated);
    try {
      await saveDocument('leaves', nextId, created);
    } catch (err) {
      console.error('Error saving leave application to Firestore:', err);
    }
  };

  // 9. Approve Leave Application
  const handleApproveLeave = async (id: number) => {
    const updated = leaveApplications.map(l => l.id === id ? { ...l, status: 'Approved' as const } : l);
    setLeaveApplications(updated);
    const item = updated.find(l => l.id === id);
    if (item) {
      try {
        await saveDocument('leaves', id, item);
      } catch (err) {
        console.error('Error updating leave application status in Firestore:', err);
      }
    }
  };

  // 10. Reject Leave Application
  const handleRejectLeave = async (id: number) => {
    const updated = leaveApplications.map(l => l.id === id ? { ...l, status: 'Rejected' as const } : l);
    setLeaveApplications(updated);
    const item = updated.find(l => l.id === id);
    if (item) {
      try {
        await saveDocument('leaves', id, item);
      } catch (err) {
        console.error('Error updating leave application status in Firestore:', err);
      }
    }
  };

  // 11. Add Teacher
  const handleAddTeacher = async (newTeacher: Omit<Teacher, 'id'>) => {
    const nextId = teachers.length > 0 ? Math.max(...teachers.map(t => t.id)) + 1 : 1;
    const created: Teacher = {
      id: nextId,
      ...newTeacher
    };
    const updated = [...teachers, created];
    setTeachers(updated);
    try {
      await saveDocument('teacher', nextId, created);
    } catch (err) {
      console.error('Error saving teacher to Firestore:', err);
    }
  };

  // 12. Edit Teacher
  const handleEditTeacher = async (id: number, updatedFields: Partial<Teacher>) => {
    const updated = teachers.map(t => t.id === id ? { ...t, ...updatedFields } : t);
    setTeachers(updated);
    const item = updated.find(t => t.id === id);
    if (item) {
      try {
        await saveDocument('teacher', id, item);
      } catch (err) {
        console.error('Error updating teacher in Firestore:', err);
      }
    }
  };

  // 13. Delete Teacher
  const handleDeleteTeacher = async (id: number) => {
    const updated = teachers.filter(t => t.id !== id);
    setTeachers(updated);
    try {
      await deleteDocument('teacher', id);
    } catch (err) {
      console.error('Error deleting teacher from Firestore:', err);
    }
  };

  // 14. Add Admin
  const handleAddAdmin = async (newAdmin: Omit<Admin, 'id'>) => {
    const nextId = admins.length > 0 ? Math.max(...admins.map(a => a.id)) + 1 : 1;
    const created: Admin = {
      id: nextId,
      ...newAdmin
    };
    try {
      await saveDocument('admin', nextId, created);
    } catch (err) {
      console.error('Error saving admin to Firestore:', err);
    }
  };

  // 15. Edit Admin
  const handleEditAdmin = async (id: number, updatedFields: Partial<Admin>) => {
    const updated = admins.map(a => a.id === id ? { ...a, ...updatedFields } : a);
    const item = updated.find(a => a.id === id);
    if (item) {
      try {
        await saveDocument('admin', id, item);
      } catch (err) {
        console.error('Error updating admin in Firestore:', err);
      }
    }
  };

  // 16. Delete Admin
  const handleDeleteAdmin = async (id: number) => {
    try {
      await deleteDocument('admin', id);
    } catch (err) {
      console.error('Error deleting admin from Firestore:', err);
    }
  };

  // Set Appearance Mode
  const handleAppearanceChange = (mode: 'dark' | 'light') => {
    setAppearanceMode(mode);
    localStorage.setItem('app-appearance-mode', mode);
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 flex items-center justify-center transition-colors duration-300 ${
      appearanceMode === 'dark' ? 'bg-zinc-950 text-gray-100' : 'bg-zinc-100 text-gray-900'
    }`}>
      {/* Sleek simulated Desktop App Frame Wrapper */}
      <div className={`w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl border flex flex-col h-[750px] transition-all duration-300 ${
        appearanceMode === 'dark' 
          ? 'bg-[#18181b] border-zinc-800 shadow-black/80' 
          : 'bg-[#fafafa] border-zinc-200 shadow-zinc-300/50'
      }`}>
        
        {/* Windows OS Chrome Titlebar decoration */}
        <div className={`px-4 py-3 border-b flex justify-between items-center text-xs font-mono select-none ${
          appearanceMode === 'dark' ? 'bg-[#0f0f11] border-zinc-900 text-zinc-500' : 'bg-[#f4f4f5] border-zinc-200 text-zinc-400'
        }`}>
          <div className="flex items-center gap-2">
            <span className="p-1 bg-[#1f538d]/15 text-[#1f538d] rounded font-bold text-[10px]">CTk</span>
            <span className="font-semibold tracking-wide">school_app.py - Al-Suffa Science & Grammar Schools, Lahore (CustomTkinter GUI)</span>
          </div>
          {/* Mock Window Controls */}
          <div className="flex gap-1.5">
            <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] ${
              appearanceMode === 'dark' ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-200 text-zinc-400'
            }`}>_</span>
            <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] ${
              appearanceMode === 'dark' ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-200 text-zinc-400'
            }`}>□</span>
            <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] hover:bg-rose-500 hover:text-white transition cursor-pointer ${
              appearanceMode === 'dark' ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-200 text-zinc-400'
            }`}>✕</span>
          </div>
        </div>

        {/* Dashboard Main container */}
        <div className="flex-1 flex overflow-hidden">
          
          {!userSession ? (
            <LoginView
              students={students}
              teachers={teachers}
              admins={admins}
              onLoginSuccess={handleLoginSuccess}
              appearanceMode={appearanceMode}
            />
          ) : userSession.role === 'student' ? (
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col">
              <StudentPortalView 
                students={students}
                fees={fees}
                attendance={attendance}
                results={results}
                feedbacks={feedbacks}
                leaveApplications={leaveApplications}
                onAddFeedback={handleAddFeedback}
                onAddLeave={handleAddLeave}
                appearanceMode={appearanceMode}
                userSession={userSession}
                onLogout={handleLogout}
              />
            </div>
          ) : (
            <>
              {/* Sidebar Area mimicking CustomTkinter sidebar */}
              <aside className={`w-64 border-r flex flex-col justify-between p-4 select-none ${
                appearanceMode === 'dark' 
                  ? 'bg-[#1e1e24] border-zinc-900' 
                  : 'bg-[#eaeaea] border-zinc-200'
              }`}>
                <div className="space-y-6">
                  {/* Branding header */}
                  <div className="px-2 py-4 text-center flex flex-col items-center">
                    <div className="relative mb-2.5 p-0.5 rounded-full bg-gradient-to-tr from-amber-500 to-blue-600">
                      <img 
                        src={schoolLogo} 
                        alt="Al-Suffa Logo" 
                        className="w-16 h-16 rounded-full border-2 border-[#1e1e24] object-cover bg-white shadow-inner"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h1 className={`text-md font-extrabold leading-tight tracking-tight ${
                      appearanceMode === 'dark' ? 'text-white' : 'text-zinc-900'
                    }`}>
                      Al-Suffa Schools
                    </h1>
                    <p className="text-[9px] text-[#297edb] font-bold mt-0.5 tracking-wider font-mono">
                      Science & Grammar, Lahore
                    </p>
                    <p className="text-[8px] text-gray-500 mt-1 uppercase tracking-widest font-mono">
                      v1.0 Offline-First
                    </p>
                  </div>

                  {/* Navigation Items */}
                  <nav className="space-y-1">
                    {[
                      { id: 'dashboard', label: '📊 Dashboard', roles: ['admin', 'teacher'] },
                      { id: 'grades', label: '📝 Academic Grading', roles: ['admin', 'teacher'] },
                      { id: 'attendance', label: '📅 Attendance Logger', roles: ['admin', 'teacher'] },
                      { id: 'studentPortal', label: '🎓 Student Leaves', roles: ['admin', 'teacher'] },
                      { id: 'aiInsights', label: '✨ Gemini AI Insights', roles: ['admin', 'teacher'] },
                      { id: 'admission', label: '👤 Student Admission', roles: ['admin'] },
                      { id: 'teachers', label: '👩‍🏫 Teachers Registry', roles: ['admin'] },
                      { id: 'admins', label: '🛡️ Admins Registry', roles: ['admin'] },
                      { id: 'fees', label: '💵 Fee Management', roles: ['admin'] },
                      { id: 'inventory', label: '📦 Supply Inventory', roles: ['admin'] },
                    ]
                    .filter(item => item.roles.includes(userSession?.role || ''))
                    .map(item => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                            isActive 
                              ? 'bg-[#1f538d] text-white shadow-md' 
                              : appearanceMode === 'dark'
                              ? 'text-zinc-400 hover:text-white hover:bg-zinc-850'
                              : 'text-zinc-600 hover:text-black hover:bg-zinc-300/60'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Bottom Config controls */}
                <div className="space-y-4 pt-4 border-t border-zinc-800/40">
                  {/* User Profile Info Card */}
                  <div className={`p-2.5 rounded-lg flex items-center justify-between text-xs ${
                    appearanceMode === 'dark' ? 'bg-[#121214] text-zinc-300 border border-zinc-850' : 'bg-[#dadada] text-zinc-800 border border-zinc-300'
                  }`}>
                    <div className="truncate flex-1">
                      <p className="font-bold truncate text-white">{userSession?.name}</p>
                      <p className="text-[9px] text-[#297edb] uppercase font-mono tracking-wider font-bold mt-0.5">{userSession?.role}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      title="Sign Out"
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition border border-rose-500/15"
                    >
                      <LogOut size={13} />
                    </button>
                  </div>

                  {/* Appearance Menu Selector inside sidebar */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block px-1">
                      Appearance Mode
                    </label>
                    <div className={`flex rounded-lg p-1 ${
                      appearanceMode === 'dark' ? 'bg-[#121214]' : 'bg-[#dadada]'
                    }`}>
                      <button
                        onClick={() => handleAppearanceChange('dark')}
                        className={`flex-1 flex justify-center items-center py-1 rounded text-xs gap-1 font-semibold transition ${
                          appearanceMode === 'dark' 
                            ? 'bg-[#1f538d] text-white font-bold' 
                            : 'text-zinc-500 hover:text-black'
                        }`}
                      >
                        <Moon size={12} />
                        Dark
                      </button>
                      <button
                        onClick={() => handleAppearanceChange('light')}
                        className={`flex-1 flex justify-center items-center py-1 rounded text-xs gap-1 font-semibold transition ${
                          appearanceMode === 'light' 
                            ? 'bg-[#1f538d] text-white font-bold' 
                            : 'text-zinc-500 hover:text-white'
                        }`}
                      >
                        <Sun size={12} />
                        Light
                      </button>
                    </div>
                  </div>

                  {/* Status bar badge */}
                  <div className={`p-2.5 rounded-lg flex items-center gap-2 text-[10px] font-mono ${
                    appearanceMode === 'dark' ? 'bg-[#121214] text-zinc-500' : 'bg-[#dadada] text-zinc-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isFirebaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    <span>Firebase Firestore: {isFirebaseConnected ? 'Connected' : 'Offline/Local'}</span>
                  </div>
                </div>
              </aside>

              {/* Main workspace viewport content */}
              <main className={`flex-1 overflow-y-auto p-6 md:p-8 flex flex-col ${
                appearanceMode === 'dark' ? 'bg-[#141416]' : 'bg-white'
              }`}>
                {isLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-center">
                      <h3 className="text-sm font-bold text-gray-300">Syncing database</h3>
                      <p className="text-xs text-gray-500 mt-1">Loading records from Google Cloud Firestore...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {activeTab === 'dashboard' && (
                      <DashboardView 
                        students={students}
                        fees={fees}
                        attendance={attendance}
                        inventory={inventory}
                        currentMonth={currentMonth}
                        onNavigate={setActiveTab}
                        userSession={userSession}
                      />
                    )}

                    {activeTab === 'grades' && (
                      <GradesView 
                        students={students}
                        results={results}
                        onSaveResult={handleSaveResult}
                        userSession={userSession}
                        appearanceMode={appearanceMode}
                      />
                    )}

                    {activeTab === 'studentPortal' && (
                      <StudentPortalView 
                        students={students}
                        fees={fees}
                        attendance={attendance}
                        results={results}
                        feedbacks={feedbacks}
                        leaveApplications={leaveApplications}
                        onAddFeedback={handleAddFeedback}
                        onAddLeave={handleAddLeave}
                        onApproveLeave={handleApproveLeave}
                        onRejectLeave={handleRejectLeave}
                        appearanceMode={appearanceMode}
                        userSession={userSession}
                        onLogout={handleLogout}
                      />
                    )}

                    {activeTab === 'aiInsights' && (
                      <AIInsightsView 
                        students={students}
                        results={results}
                        feedbacks={feedbacks}
                        userSession={userSession}
                        appearanceMode={appearanceMode}
                      />
                    )}

                    {activeTab === 'admission' && (
                      <AdmissionView 
                        students={students}
                        onSaveStudent={handleSaveStudent}
                        onDeleteStudent={handleDeleteStudent}
                      />
                    )}

                    {activeTab === 'teachers' && (
                      <TeachersView 
                        teachers={teachers}
                        onAddTeacher={handleAddTeacher}
                        onEditTeacher={handleEditTeacher}
                        onDeleteTeacher={handleDeleteTeacher}
                      />
                    )}

                    {activeTab === 'admins' && (
                      <AdminsView 
                        admins={admins}
                        onAddAdmin={handleAddAdmin}
                        onEditAdmin={handleEditAdmin}
                        onDeleteAdmin={handleDeleteAdmin}
                      />
                    )}

                    {activeTab === 'fees' && (
                      <FeesView 
                        students={students}
                        fees={fees}
                        onToggleFee={handleToggleFee}
                      />
                    )}

                    {activeTab === 'attendance' && (
                      <AttendanceView 
                        students={students}
                        attendance={attendance}
                        onSaveAttendance={handleSaveAttendance}
                        userSession={userSession}
                      />
                    )}

                    {activeTab === 'inventory' && (
                      <InventoryView 
                        inventory={inventory}
                        onSaveInventoryItem={handleSaveInventoryItem}
                        onDeleteInventoryItem={handleDeleteInventoryItem}
                      />
                    )}
                  </>
                )}
              </main>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
