import React, { useState } from 'react';
import { Student, Teacher, Admin, UserSession } from '../types';
import { 
  GraduationCap, 
  ShieldAlert, 
  KeyRound, 
  User, 
  ChevronRight, 
  Check, 
  Sparkles, 
  BookOpen, 
  UserCheck, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Lock,
  UserPlus
} from 'lucide-react';
import { saveDocument } from '../firebase';

interface LoginViewProps {
  students: Student[];
  teachers: Teacher[];
  admins?: Admin[];
  onLoginSuccess: (session: UserSession) => void;
  appearanceMode: 'dark' | 'light';
}

export const LoginView: React.FC<LoginViewProps> = ({
  students,
  teachers,
  admins = [],
  onLoginSuccess,
  appearanceMode
}) => {
  const [activePortal, setActivePortal] = useState<'student' | 'teacher' | 'admin'>('student');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Loading and feedback states
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Common Form States
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [contact, setContact] = useState('');
  const [className, setClassName] = useState('Class 9');
  
  // Student Form States
  const [rollNo, setRollNo] = useState('');
  const [fatherName, setFatherName] = useState('');

  // Teacher Form States
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [qualification, setQualification] = useState('');

  // Admin Form States
  const [adminEmail, setAdminEmail] = useState('');
  const [masterKey, setMasterKey] = useState('');

  const isDark = appearanceMode === 'dark';

  // Handle resets when switching tabs or auth modes
  const handleTabChange = (portal: 'student' | 'teacher' | 'admin') => {
    setActivePortal(portal);
    setAuthMode('signin');
    setErrorMsg('');
    setSuccessMsg('');
    clearForms();
  };

  const handleAuthModeChange = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
    clearForms();
  };

  const clearForms = () => {
    setName('');
    setPassword('');
    setContact('');
    setRollNo('');
    setFatherName('');
    setEmail('');
    setSubject('');
    setQualification('');
    setAdminEmail('');
    setMasterKey('');
  };

  // Student Authentication Handling
  const handleStudentAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (authMode === 'signin') {
      const trimmedRoll = rollNo.trim();
      if (!trimmedRoll) {
        setErrorMsg('Please enter your roll number.');
        return;
      }

      const student = students.find(s => s.rollNo.toLowerCase() === trimmedRoll.toLowerCase());
      if (student) {
        // If password exists for this student, verify it
        if (student.password && student.password.trim()) {
          if (student.password !== password) {
            setErrorMsg('Incorrect password for this roll number.');
            return;
          }
        }
        
        onLoginSuccess({
          role: 'student',
          userId: student.id,
          name: student.name,
          rollNo: student.rollNo,
          className: student.className
        });
      } else {
        setErrorMsg(`Roll number "${trimmedRoll}" not found in our database. If you are new, please Sign Up first.`);
      }
    } else {
      // Sign Up Student
      const trimmedName = name.trim();
      const trimmedRoll = rollNo.trim();
      const trimmedContact = contact.trim();
      const trimmedPassword = password.trim();

      if (!trimmedName || !trimmedRoll || !trimmedContact || !trimmedPassword) {
        setErrorMsg('All fields are required for Student registration.');
        return;
      }

      // Check if roll number already taken
      const exists = students.some(s => s.rollNo.toLowerCase() === trimmedRoll.toLowerCase());
      if (exists) {
        setErrorMsg(`Roll number "${trimmedRoll}" is already registered. Please check or sign in.`);
        return;
      }

      setLoading(true);
      try {
        // Generate a new unique integer ID
        const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 101;
        
        const newStudent: Student = {
          id: newId,
          name: trimmedName,
          rollNo: trimmedRoll,
          className,
          contact: trimmedContact,
          fatherName: fatherName.trim() || undefined,
          password: trimmedPassword
        };

        await saveDocument('student', newId, newStudent);
        setSuccessMsg('Account created successfully! Logging you in...');
        
        setTimeout(() => {
          onLoginSuccess({
            role: 'student',
            userId: newId,
            name: trimmedName,
            rollNo: trimmedRoll,
            className
          });
        }, 1200);
      } catch (err) {
        console.error('Error during student signup:', err);
        setErrorMsg('Registration failed. Please check connection and try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Teacher Authentication Handling
  const handleTeacherAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (authMode === 'signin') {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail || !password) {
        setErrorMsg('Please enter both email and password.');
        return;
      }

      const teacher = teachers.find(t => t.email.toLowerCase() === trimmedEmail);
      if (teacher) {
        const correctPassword = teacher.password || 'teacher123';
        if (password === correctPassword) {
          onLoginSuccess({
            role: 'teacher',
            userId: teacher.id,
            name: teacher.name,
            email: teacher.email,
            className: teacher.className
          });
        } else {
          setErrorMsg('Incorrect password. Default for pre-seeded teachers is "teacher123".');
        }
      } else {
        setErrorMsg('Teacher email not found in registry. Please Sign Up to register your account.');
      }
    } else {
      // Teacher Sign Up
      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedSubject = subject.trim();
      const trimmedQual = qualification.trim();
      const trimmedContact = contact.trim();
      const trimmedPassword = password.trim();

      if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedQual || !trimmedContact || !trimmedPassword) {
        setErrorMsg('All fields are required for Teacher registration.');
        return;
      }

      // Check if email already registered
      const exists = teachers.some(t => t.email.toLowerCase() === trimmedEmail);
      if (exists) {
        setErrorMsg(`Email "${trimmedEmail}" is already registered. Please Sign In.`);
        return;
      }

      setLoading(true);
      try {
        const newId = teachers.length > 0 ? Math.max(...teachers.map(t => t.id)) + 1 : 1;
        const newTeacher: Teacher = {
          id: newId,
          name: trimmedName,
          email: trimmedEmail,
          subject: trimmedSubject,
          qualification: trimmedQual,
          className,
          contact: trimmedContact,
          password: trimmedPassword,
          salary: 35000, // Default baseline scale
          joiningDate: new Date().toISOString().split('T')[0],
          status: 'Active'
        };

        await saveDocument('teacher', newId, newTeacher);
        setSuccessMsg('Teacher registration complete! Logging you into class control...');

        setTimeout(() => {
          onLoginSuccess({
            role: 'teacher',
            userId: newId,
            name: trimmedName,
            email: trimmedEmail,
            className
          });
        }, 1200);
      } catch (err) {
        console.error('Error during teacher signup:', err);
        setErrorMsg('Teacher registration failed. Verify database rules.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Admin Authentication Handling
  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (authMode === 'signin') {
      const trimmedEmail = adminEmail.trim().toLowerCase();
      if (!trimmedEmail || !password) {
        setErrorMsg('Please enter both admin email and password.');
        return;
      }

      // Check database admins first
      const dbAdmin = admins.find(
        a => a.email.toLowerCase() === trimmedEmail || (trimmedEmail === 'admin' && a.email.toLowerCase() === 'admin@alsuffa.edu.pk')
      );

      if (dbAdmin) {
        const correctPassword = dbAdmin.password || 'admin123';
        if (password === correctPassword) {
          onLoginSuccess({
            role: 'admin',
            userId: dbAdmin.id,
            name: dbAdmin.name,
            email: dbAdmin.email
          });
          return;
        } else {
          setErrorMsg('Incorrect admin password.');
          return;
        }
      }

      // Fallback baseline credentials if database is offline or empty
      if (
        (trimmedEmail === 'admin' || trimmedEmail === 'admin@alsuffa.edu.pk') &&
        password === 'admin123'
      ) {
        onLoginSuccess({
          role: 'admin',
          userId: 'admin',
          name: 'Principal Office (Admin)'
        });
        return;
      }

      setErrorMsg('No administrator found with these credentials.');
    } else {
      // Admin Sign Up with Master Key validation
      const trimmedName = name.trim();
      const trimmedEmail = adminEmail.trim().toLowerCase();
      const trimmedContact = contact.trim();
      const trimmedPassword = password.trim();

      if (!trimmedName || !trimmedEmail || !trimmedPassword) {
        setErrorMsg('Name, Email, and Password are required.');
        return;
      }

      // Verify Administrative Master Key
      if (masterKey !== 'admin123' && masterKey !== 'alsuffa2026') {
        setErrorMsg('Unauthorized Security Error: The Master System Key is invalid.');
        return;
      }

      const exists = admins.some(a => a.email.toLowerCase() === trimmedEmail);
      if (exists) {
        setErrorMsg(`Admin email "${trimmedEmail}" already has administrative clearance.`);
        return;
      }

      setLoading(true);
      try {
        const newId = admins.length > 0 ? Math.max(...admins.map(a => a.id)) + 1 : 1;
        const newAdmin: Admin = {
          id: newId,
          name: trimmedName,
          email: trimmedEmail,
          password: trimmedPassword,
          contact: trimmedContact || undefined
        };

        await saveDocument('admin', newId, newAdmin);
        setSuccessMsg('Administrative clearance granted! Logging you in...');

        setTimeout(() => {
          onLoginSuccess({
            role: 'admin',
            userId: newId,
            name: trimmedName,
            email: trimmedEmail
          });
        }, 1200);
      } catch (err) {
        console.error('Error during admin signup:', err);
        setErrorMsg('Administrative node registration failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
      
      {/* Brand Left / Top Side */}
      <div className={`md:w-5/12 flex flex-col justify-center items-center p-6 md:p-8 text-center border-b md:border-b-0 md:border-r transition-colors duration-300 ${
        isDark ? 'bg-zinc-950/40 border-zinc-900' : 'bg-zinc-100/50 border-zinc-200'
      }`}>
        <div className="relative mb-4 p-1 rounded-full bg-gradient-to-tr from-amber-500 to-blue-600">
          <img 
            src="/src/assets/images/alsuffa_logo_1783059479131.jpg" 
            alt="Al-Suffa Logo" 
            className="w-20 h-20 md:w-24 md:h-24 rounded-full border border-zinc-950 object-cover bg-white"
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-tight">
          Al-Suffa Schools
        </h1>
        <p className="text-xs text-[#297edb] font-bold mt-1 tracking-wider uppercase font-mono">
          Lahore Campus
        </p>
        <p className="text-xs text-gray-400 mt-3 max-w-xs text-center leading-relaxed font-sans">
          Welcome to the multi-user academic gateway. Please sign in or register to access your designated records.
        </p>

        {/* Quick Credentials Info Drawer on Desktop */}
        <div className="mt-6 w-full hidden md:block text-left text-[11px] space-y-2.5 border border-gray-800/40 bg-gray-950/75 p-4 rounded-xl">
          <h4 className="font-bold text-gray-300 uppercase tracking-wider mb-2 border-b border-gray-800 pb-1.5 flex items-center gap-1.5">
            <ShieldAlert size={12} className="text-amber-500" />
            <span>Developer Credentials & Setup Key</span>
          </h4>
          
          <div className="space-y-2 text-gray-400">
            <p>
              <strong className="text-white font-semibold">🔑 Administration Node:</strong><br />
              Email: <code className="text-blue-300 font-mono bg-gray-900/80 px-1 py-0.5 rounded">admin</code><br />
              Password: <code className="text-amber-300 font-mono">admin123</code>
            </p>
            <p>
              <strong className="text-white font-semibold">🔑 Faculty Registry:</strong><br />
              Email: <code className="text-blue-300 font-mono bg-gray-900/80 px-1 py-0.5 rounded">{teachers[0]?.email || 'm.ali@alsuffa.edu.pk'}</code><br />
              Password: <code className="text-amber-300 font-mono">teacher123</code>
            </p>
            <p>
              <strong className="text-white font-semibold">🔑 Student Access:</strong><br />
              Roll Number: <code className="text-emerald-300 font-mono bg-gray-900/80 px-1 py-0.5 rounded">101</code> or <code className="text-emerald-300 font-mono bg-gray-900/80 px-1 py-0.5 rounded">102</code>
            </p>
            <div className="border-t border-gray-800/60 pt-2 mt-2">
              <p className="text-gray-500 text-[10px] italic">
                * Register a new admin using Master Key: <code className="text-amber-400">admin123</code>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forms Area Right / Bottom */}
      <div className="flex-1 flex flex-col justify-center p-6 md:p-12 max-w-lg mx-auto w-full overflow-y-auto">
        
        {/* Portal Selection Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-gray-950/80 border border-gray-850 p-1 rounded-xl mb-6 select-none shadow-inner">
          <button
            onClick={() => handleTabChange('student')}
            className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-[11px] font-bold transition ${
              activePortal === 'student' 
                ? 'bg-[#1f538d] text-white shadow' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <GraduationCap size={16} className="mb-0.5" />
            Student
          </button>
          <button
            onClick={() => handleTabChange('teacher')}
            className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-[11px] font-bold transition ${
              activePortal === 'teacher' 
                ? 'bg-violet-700 text-white shadow' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen size={16} className="mb-0.5" />
            Teacher
          </button>
          <button
            onClick={() => handleTabChange('admin')}
            className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-[11px] font-bold transition ${
              activePortal === 'admin' 
                ? 'bg-amber-600 text-white shadow border border-amber-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <KeyRound size={16} className="mb-0.5" />
            Admin Secure
          </button>
        </div>

        {/* Sign In vs Sign Up Toggle Sub-Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <button 
              onClick={() => handleAuthModeChange('signin')}
              className={`text-sm font-bold pb-1 border-b-2 transition ${
                authMode === 'signin' 
                  ? activePortal === 'student' ? 'border-[#1f538d] text-white' : activePortal === 'teacher' ? 'border-violet-500 text-white' : 'border-amber-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Sign In
            </button>
            <button 
              onClick={() => handleAuthModeChange('signup')}
              className={`text-sm font-bold pb-1 border-b-2 transition ${
                authMode === 'signup' 
                  ? activePortal === 'student' ? 'border-[#1f538d] text-white' : activePortal === 'teacher' ? 'border-violet-500 text-white' : 'border-amber-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Sign Up / Register
            </button>
          </div>
          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
            activePortal === 'admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' :
            activePortal === 'teacher' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/15' :
            'bg-[#1f538d]/10 text-blue-400 border border-blue-500/15'
          }`}>
            {activePortal} node
          </span>
        </div>

        {/* ----------------- 1. STUDENT FORM ----------------- */}
        {activePortal === 'student' && (
          <form onSubmit={handleStudentAuth} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-md font-bold text-white flex items-center gap-1.5">
                <GraduationCap size={18} className="text-blue-400" />
                {authMode === 'signin' ? 'Student Portal Entry' : 'New Student Sign Up'}
              </h2>
              <p className="text-xs text-gray-400">
                {authMode === 'signin' 
                  ? 'Access your academic scorecard, attendance records, and leave applications.' 
                  : 'Create a permanent student node in the Al-Suffa academic database.'}
              </p>
            </div>

            {authMode === 'signup' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Full Student Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-3.5 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Abdul Rehman"
                      className="w-full bg-gray-950 border border-gray-800/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Class/Grade</label>
                    <select
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800/80 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                    >
                      <option value="Class 9">Class 9 (Ninth)</option>
                      <option value="Class 10">Class 10 (Tenth)</option>
                      <option value="Class 11">Class 11 (F.Sc Part 1)</option>
                      <option value="Class 12">Class 12 (F.Sc Part 2)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Father Name</label>
                    <input
                      type="text"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder="e.g. Muhammad Jameel"
                      className="w-full bg-gray-950 border border-gray-800/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Parent Contact / Phone</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-3.5 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="e.g. +92 300 1234567"
                      className="w-full bg-gray-950 border border-gray-800/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Class Roll Number</label>
                <input
                  type="text"
                  required
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="e.g. 101, 102, 103"
                  className="w-full bg-gray-950 border border-gray-800/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  {authMode === 'signin' ? 'Security Password (If set)' : 'Choose Password'}
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3.5 text-gray-500" />
                  <input
                    type="password"
                    required={authMode === 'signup'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={authMode === 'signin' ? 'Enter password (optional for demo)' : 'Minimum 4 characters'}
                    className="w-full bg-gray-950 border border-gray-800/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>
            </div>

            {errorMsg && <p className="text-xs text-rose-400 font-medium mt-1">⚠️ {errorMsg}</p>}
            {successMsg && <p className="text-xs text-emerald-400 font-medium mt-1">✨ {successMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1f538d] hover:bg-blue-600 text-white font-bold text-xs py-3 rounded-xl transition shadow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : authMode === 'signin' ? (
                <>Verify & Enter Portal <ChevronRight size={14} /></>
              ) : (
                <>Create Student Account & Enter <UserPlus size={14} /></>
              )}
            </button>

            {/* Quick Demo Roll helper buttons */}
            {authMode === 'signin' && (
              <div className="border-t border-gray-800/40 pt-3 space-y-2">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quick Demo Rolls:</h4>
                <div className="flex gap-2 flex-wrap">
                  {students.slice(0, 3).map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setRollNo(s.rollNo);
                        setPassword('');
                      }}
                      className="bg-gray-950 border border-gray-850 rounded-lg px-2.5 py-1 text-[10px] text-gray-300 font-mono hover:border-blue-500"
                    >
                      Roll {s.rollNo} ({s.name.split(' ')[0]})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        )}

        {/* ----------------- 2. TEACHER FORM ----------------- */}
        {activePortal === 'teacher' && (
          <form onSubmit={handleTeacherAuth} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-md font-bold text-white flex items-center gap-1.5">
                <BookOpen size={18} className="text-violet-400" />
                {authMode === 'signin' ? 'Faculty Sign In' : 'Teacher Board Registry'}
              </h2>
              <p className="text-xs text-gray-400">
                {authMode === 'signin' 
                  ? 'Access your classroom grading modules, mark daily attendance logs, and review leave applications.' 
                  : 'Join the academic staff roster. Register your details to secure classroom administrative clearance.'}
              </p>
            </div>

            {authMode === 'signup' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Full Roster Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-3.5 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Prof. Muhammad Ali"
                      className="w-full bg-gray-950 border border-gray-800/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Subject Specialization</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Mathematics"
                      className="w-full bg-gray-950 border border-gray-800/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Qualification</label>
                    <input
                      type="text"
                      required
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. M.Sc. Math, B.Ed"
                      className="w-full bg-gray-950 border border-gray-800/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Designated Class</label>
                    <select
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800/80 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition"
                    >
                      <option value="Class 9">Class 9 (Ninth)</option>
                      <option value="Class 10">Class 10 (Tenth)</option>
                      <option value="Class 11">Class 11 (F.Sc Part 1)</option>
                      <option value="Class 12">Class 12 (F.Sc Part 2)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Contact Phone</label>
                    <input
                      type="text"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="e.g. +92 321 4455667"
                      className="w-full bg-gray-950 border border-gray-800/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500 transition"
                    />
                  </div>
                </div>
              </>
            ) : null}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">School Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-3.5 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. m.ali@alsuffa.edu.pk"
                    className="w-full bg-gray-950 border border-gray-800/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Faculty Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3.5 text-gray-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. teacher123"
                    className="w-full bg-gray-950 border border-gray-800/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500 transition"
                  />
                </div>
              </div>

              {errorMsg && <p className="text-xs text-rose-400 font-medium mt-1">⚠️ {errorMsg}</p>}
              {successMsg && <p className="text-xs text-emerald-400 font-medium mt-1">✨ {successMsg}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-700 hover:bg-violet-600 text-white font-bold text-xs py-3 rounded-xl transition shadow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : authMode === 'signin' ? (
                <>Authenticate Faculty <ChevronRight size={14} /></>
              ) : (
                <>Register Roster Account <UserPlus size={14} /></>
              )}
            </button>
          </form>
        )}

        {/* ----------------- 3. ADMIN FORM ----------------- */}
        {activePortal === 'admin' && (
          <form onSubmit={handleAdminAuth} className="space-y-4 border border-amber-500/25 bg-amber-500/5 p-5 rounded-2xl">
            <div className="space-y-1 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 mb-2">
                <KeyRound size={18} />
              </div>
              <h2 className="text-md font-extrabold text-amber-400 uppercase tracking-wide">
                {authMode === 'signin' ? 'SECURE ADMINISTRATION GATEWAY' : 'REGISTER ADMINISTRATIVE CLEARANCE'}
              </h2>
              <p className="text-[11px] text-gray-400 leading-normal max-w-xs mx-auto">
                {authMode === 'signin' 
                  ? 'Access the master registry, student admissions, school salary scales, and supply logs.'
                  : 'Establish a secondary administration supervisor node in Google Cloud.'}
              </p>
            </div>

            {authMode === 'signup' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-amber-400/90 uppercase tracking-widest block">Administrator Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Principal Jamil Ahmad"
                    className="w-full bg-gray-950 border border-amber-500/20 rounded-xl px-4 py-2 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-amber-400/90 uppercase tracking-widest block">Phone Contact (Optional)</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="e.g. +92 42 11112233"
                    className="w-full bg-gray-950 border border-amber-500/20 rounded-xl px-4 py-2 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-400/90 uppercase tracking-widest block">Administrative Email / Username</label>
                <div className="relative">
                  <Mail size={12} className="absolute left-3 top-3 text-gray-600" />
                  <input
                    type="text"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="e.g. admin or admin@alsuffa.edu.pk"
                    className="w-full bg-gray-950 border border-amber-500/20 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-400/90 uppercase tracking-widest block">Security Code Password</label>
                <div className="relative">
                  <Lock size={12} className="absolute left-3 top-3 text-gray-600" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Baseline password (e.g. admin123)"
                    className="w-full bg-gray-950 border border-amber-500/20 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">System Master Key (Passcode)</label>
                  <input
                    type="password"
                    required
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    placeholder="Enter security key (e.g. admin123)"
                    className="w-full bg-gray-950 border border-amber-500/30 rounded-xl px-4 py-2 text-xs text-white placeholder:text-gray-750 focus:outline-none focus:border-amber-500 transition font-mono"
                  />
                  <p className="text-[9px] text-amber-500/80 italic mt-0.5">* Master System Key is required to authorize root administrator nodes.</p>
                </div>
              )}

              {errorMsg && <p className="text-xs text-rose-400 font-medium mt-1">⚠️ {errorMsg}</p>}
              {successMsg && <p className="text-xs text-emerald-400 font-medium mt-1">✨ {successMsg}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[11px] py-2.5 rounded-xl transition shadow-lg shadow-amber-950/40 border border-amber-400/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : authMode === 'signin' ? (
                <>DECRYPT & ENTER PRINCIPAL BLOCK <ChevronRight size={13} /></>
              ) : (
                <>REGISTER SECURE NODE & AUTHORIZE <ShieldCheck size={13} /></>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
