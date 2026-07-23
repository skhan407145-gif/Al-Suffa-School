import React, { useState, useMemo } from 'react';
import { Teacher } from '../types';
import { 
  UserPlus, Search, Edit2, Trash2, Phone, Mail, 
  Calendar, Award, DollarSign, Check, X, Shield, Plus, Briefcase
} from 'lucide-react';

interface TeachersViewProps {
  teachers: Teacher[];
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  onEditTeacher: (id: number, teacher: Partial<Teacher>) => void;
  onDeleteTeacher: (id: number) => void;
}

export const TeachersView: React.FC<TeachersViewProps> = ({
  teachers,
  onAddTeacher,
  onEditTeacher,
  onDeleteTeacher
}) => {
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [qualification, setQualification] = useState('');
  const [className, setClassName] = useState('None');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [status, setStatus] = useState<'Active' | 'On Leave'>('Active');

  const [formError, setFormError] = useState('');

  // Get unique subjects for filter dropdown
  const uniqueSubjects = useMemo(() => {
    const subs = teachers.map(t => t.subject.trim());
    return Array.from(new Set(subs)).filter(Boolean);
  }, [teachers]);

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.qualification.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = subjectFilter === '' || t.subject === subjectFilter;
      const matchesStatus = statusFilter === '' || t.status === statusFilter;
      return matchesSearch && matchesSubject && matchesStatus;
    });
  }, [teachers, searchTerm, subjectFilter, statusFilter]);

  // Open Form for Adding
  const handleOpenAdd = () => {
    setEditingTeacherId(null);
    setName('');
    setSubject('');
    setQualification('');
    setClassName('None');
    setContact('');
    setEmail('');
    setSalary('');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setStatus('Active');
    setFormError('');
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacherId(t.id);
    setName(t.name);
    setSubject(t.subject);
    setQualification(t.qualification);
    setClassName(t.className);
    setContact(t.contact);
    setEmail(t.email);
    setSalary(t.salary.toString());
    setJoiningDate(t.joiningDate);
    setStatus(t.status);
    setFormError('');
    setIsFormOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = name.trim();
    const trimmedSubject = subject.trim();
    const trimmedQualification = qualification.trim();
    const parsedSalary = parseFloat(salary);

    if (!trimmedName || !trimmedSubject || !trimmedQualification) {
      setFormError('Name, Designated Subject, and Qualification are required fields.');
      return;
    }

    if (isNaN(parsedSalary) || parsedSalary <= 0) {
      setFormError('Please enter a valid positive salary amount.');
      return;
    }

    const payload = {
      name: trimmedName,
      subject: trimmedSubject,
      qualification: trimmedQualification,
      className,
      contact: contact.trim() || 'Not Provided',
      email: email.trim() || 'not.provided@alsuffa.edu.pk',
      salary: parsedSalary,
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      status
    };

    if (editingTeacherId === null) {
      // Adding new
      onAddTeacher(payload);
    } else {
      // Editing existing
      onEditTeacher(editingTeacherId, payload);
    }

    setIsFormOpen(false);
  };

  // Total monthly salary budget
  const totalSalaryBudget = useMemo(() => {
    return teachers.reduce((acc, curr) => acc + curr.salary, 0);
  }, [teachers]);

  // Active headcounts
  const activeCount = useMemo(() => {
    return teachers.filter(t => t.status === 'Active').length;
  }, [teachers]);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>👩‍🏫</span> Al-Suffa Teacher Registry & Staff Directory
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Maintain official academic credentials, designated subjects, class assignments, and pay records.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-[#1f538d] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow"
        >
          <UserPlus size={14} /> Register New Teacher
        </button>
      </div>

      {/* Metrics Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-850 border border-gray-800 rounded-2xl p-4.5">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block">Total Instructors</span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black text-white">{teachers.length}</span>
            <span className="text-xs text-emerald-400 font-semibold">Registered Staff</span>
          </div>
        </div>

        <div className="bg-gray-850 border border-gray-800 rounded-2xl p-4.5">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block">Active Instructors</span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black text-white">{activeCount}</span>
            <span className="text-xs text-sky-400 font-semibold">On-Duty</span>
          </div>
        </div>

        <div className="bg-gray-850 border border-gray-800 rounded-2xl p-4.5">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block">Monthly Payroll Budget</span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black text-emerald-400">Rs. {totalSalaryBudget.toLocaleString()}</span>
            <span className="text-xs text-gray-400">Total Salaries</span>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Teachers list with Filters */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Controls Bar */}
          <div className="bg-gray-850 border border-gray-800/80 p-3.5 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            
            <div className="sm:col-span-6 relative">
              <span className="absolute left-3 top-2.5 text-gray-500">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search by name, qualification, or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900 border border-gray-750 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={subjectFilter}
                onChange={e => setSubjectFilter(e.target.value)}
                className="w-full bg-gray-900 border border-gray-750 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="">All Subjects</option>
                {uniqueSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full bg-gray-900 border border-gray-750 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

          </div>

          {/* Directory Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTeachers.length > 0 ? (
              filteredTeachers.map(teacher => (
                <div 
                  key={teacher.id}
                  className="bg-gray-850/50 border border-gray-800 rounded-2xl p-4.5 hover:border-gray-700 transition flex flex-col justify-between space-y-4 relative group"
                >
                  <div className="space-y-3">
                    {/* Upper Line */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition">
                          {teacher.name}
                        </h3>
                        <p className="text-[11px] text-[#1f538d] font-semibold mt-0.5 flex items-center gap-1">
                          <Briefcase size={12} /> {teacher.subject} Teacher
                        </p>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        teacher.status === 'Active' 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/10' 
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/10'
                      }`}>
                        {teacher.status}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="bg-gray-900/40 p-3 rounded-xl border border-gray-900/60 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Award size={13} className="text-yellow-500 shrink-0" />
                        <span className="truncate">{teacher.qualification}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-400 border-t border-gray-800/40 pt-2 mt-2">
                        <div>
                          <span className="text-[9px] text-gray-500 uppercase block font-bold">Class Assigned</span>
                          <span className="text-white font-medium">{teacher.className === 'None' ? 'None (Subject Teacher)' : teacher.className}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-500 uppercase block font-bold">Monthly Pay</span>
                          <span className="text-emerald-400 font-bold font-mono">Rs. {teacher.salary.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Contacts block */}
                    <div className="space-y-1.5 text-xs text-gray-400 pt-1 px-1">
                      <div className="flex items-center gap-2">
                        <Phone size={11} className="text-gray-500" />
                        <span className="font-mono">{teacher.contact}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <Mail size={11} className="text-gray-500" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Controls footer */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-800/60 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> Joined: {teacher.joiningDate}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(teacher)}
                        className="p-1.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition border border-gray-800"
                        title="Edit Teacher Info"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove ${teacher.name} from the Al-Suffa Teachers Registry?`)) {
                            onDeleteTeacher(teacher.id);
                          }
                        }}
                        className="p-1.5 bg-gray-900 hover:bg-rose-950 text-gray-450 hover:text-rose-400 rounded-lg transition border border-gray-800"
                        title="Delete Teacher"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                </div>
              ))
            ) : (
              <div className="col-span-full bg-gray-850 border border-gray-800 rounded-2xl py-16 text-center space-y-3">
                <span className="text-4xl">🔍</span>
                <p className="text-sm font-bold text-white">No teachers found matching criteria.</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Adjust your search string or select alternative subject and status filters above.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right Side Form (Creates side drawer experience when open) */}
        <div className={`lg:col-span-4 transition-all duration-300 ${isFormOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none lg:opacity-100 lg:scale-100 lg:pointer-events-auto'}`}>
          <div className="bg-gray-850 border border-gray-800 rounded-2xl p-5 space-y-4">
            
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                {editingTeacherId === null ? (
                  <>
                    <UserPlus size={16} className="text-[#1f538d]" />
                    <span>Staff Registration</span>
                  </>
                ) : (
                  <>
                    <Edit2 size={16} className="text-amber-500" />
                    <span>Modify Record</span>
                  </>
                )}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-gray-500 hover:text-white lg:hidden"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/15 font-semibold">
                ⚠️ {formError}
              </p>
            )}

            {!isFormOpen && (
              <div className="hidden lg:flex flex-col items-center justify-center text-center py-24 text-gray-500 space-y-2">
                <span className="text-3xl">📝</span>
                <p className="text-xs font-bold text-gray-400">Registry Form Standby</p>
                <p className="text-[11px] max-w-xs leading-relaxed">
                  Click "Register New Teacher" or use the Edit tool icon on any card to update school records.
                </p>
              </div>
            )}

            {isFormOpen && (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Full name */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Teacher Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Prof. Zia ul Haq"
                    className="w-full bg-gray-900 border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-650"
                    required
                  />
                </div>

                {/* Subject & Qualification */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Designated Subject *
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="e.g. Science, Mathematics"
                      className="w-full bg-gray-900 border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-650"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Qualification *
                    </label>
                    <input
                      type="text"
                      value={qualification}
                      onChange={e => setQualification(e.target.value)}
                      placeholder="e.g. M.Phil Physics"
                      className="w-full bg-gray-900 border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-650"
                      required
                    />
                  </div>
                </div>

                {/* Class Teacher assignment & Salary */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Class Teacher of
                    </label>
                    <select
                      value={className}
                      onChange={e => setClassName(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="None">None (Subject Teacher)</option>
                      <option value="Class 10-A">Class 10-A</option>
                      <option value="Class 9-B">Class 9-B</option>
                      <option value="Class 8-C">Class 8-C</option>
                      <option value="Class 7">Class 7</option>
                      <option value="Class 6">Class 6</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Monthly Salary (Rs.) *
                    </label>
                    <input
                      type="number"
                      value={salary}
                      onChange={e => setSalary(e.target.value)}
                      placeholder="e.g. 45000"
                      className="w-full bg-gray-900 border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-650"
                      required
                    />
                  </div>
                </div>

                {/* Contacts */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={contact}
                      onChange={e => setContact(e.target.value)}
                      placeholder="e.g. +92 321 0000000"
                      className="w-full bg-gray-900 border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-650"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. staff@alsuffa.edu.pk"
                      className="w-full bg-gray-900 border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-650"
                    />
                  </div>
                </div>

                {/* Joining date & status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={joiningDate}
                      onChange={e => setJoiningDate(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as any)}
                      className="w-full bg-gray-900 border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Active">Active / On Duty</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>
                </div>

                {/* Submit operations */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 py-2.5 text-xs font-bold rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#1f538d] hover:bg-blue-600 text-white py-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5"
                  >
                    {editingTeacherId === null ? <Plus size={12} /> : <Check size={12} />}
                    {editingTeacherId === null ? 'Register' : 'Save Changes'}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
