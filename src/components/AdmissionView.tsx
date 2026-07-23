import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import { Search, UserPlus, Trash2, Edit2, Check, Sparkles } from 'lucide-react';

interface AdmissionViewProps {
  students: Student[];
  onSaveStudent: (student: Omit<Student, 'id'> & { id?: number }) => void;
  onDeleteStudent: (id: number) => void;
}

export const AdmissionView: React.FC<AdmissionViewProps> = ({
  students,
  onSaveStudent,
  onDeleteStudent
}) => {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [contact, setContact] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('');
  const [guardianContact, setGuardianContact] = useState('');
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Save or edit action
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !className.trim() || !rollNo.trim()) {
      alert('Name, Class, and Roll Number are required!');
      return;
    }

    onSaveStudent({
      id: editingId || undefined,
      name: name.trim(),
      className: className.trim(),
      rollNo: rollNo.trim(),
      contact: contact.trim(),
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      guardianName: guardianName.trim(),
      guardianRelation: guardianRelation.trim(),
      guardianContact: guardianContact.trim()
    });

    // Clear form
    handleClear();
  };

  const handleEdit = (student: Student) => {
    setEditingId(student.id);
    setName(student.name);
    setClassName(student.className);
    setRollNo(student.rollNo);
    setContact(student.contact);
    setFatherName(student.fatherName || '');
    setMotherName(student.motherName || '');
    setGuardianName(student.guardianName || '');
    setGuardianRelation(student.guardianRelation || '');
    setGuardianContact(student.guardianContact || '');
  };

  const handleClear = () => {
    setEditingId(null);
    setName('');
    setClassName('');
    setRollNo('');
    setContact('');
    setFatherName('');
    setMotherName('');
    setGuardianName('');
    setGuardianRelation('');
    setGuardianContact('');
  };

  const handleDelete = (id: number, sName: string) => {
    if (confirm(`Are you sure you want to delete student '${sName}'? This will delete all attendance and fee records as well.`)) {
      onDeleteStudent(id);
      if (editingId === id) {
        handleClear();
      }
    }
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return students;
    return students.filter(
      s => s.name.toLowerCase().includes(q) || s.className.toLowerCase().includes(q) || s.rollNo.includes(q)
    );
  }, [students, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="p-1.5 bg-blue-600 rounded-md text-white text-base">👤</span>
          Student Admission Portal
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Form-based admissions control. Edits trigger real-time simulated SQL UPDATE queries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Side: Form */}
        <div className="lg:col-span-2 bg-gray-800/60 border border-gray-700/40 rounded-xl p-5 h-fit">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-blue-400" />
            {editingId ? 'Edit Student Record' : 'Student Registration Form'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition placeholder:text-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Class / Grade *
              </label>
              <input
                type="text"
                value={className}
                onChange={e => setClassName(e.target.value)}
                placeholder="e.g. Class 10-A"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition placeholder:text-gray-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Roll Number *
                </label>
                <input
                  type="text"
                  value={rollNo}
                  onChange={e => setRollNo(e.target.value)}
                  placeholder="e.g. 101"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition placeholder:text-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  placeholder="e.g. +1 (555) 123-4567"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition placeholder:text-gray-600"
                />
              </div>
            </div>

            <div className="border-t border-gray-750 pt-3 mt-1.5 space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Parent & Guardian Information
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Father's Name
                  </label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={e => setFatherName(e.target.value)}
                    placeholder="e.g. Robert Johnson"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition placeholder:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Mother's Name
                  </label>
                  <input
                    type="text"
                    value={motherName}
                    onChange={e => setMotherName(e.target.value)}
                    placeholder="e.g. Linda Johnson"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition placeholder:text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Guardian's Full Name
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={e => setGuardianName(e.target.value)}
                  placeholder="e.g. Robert Johnson (Leave blank if parent)"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition placeholder:text-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Guardian Relation
                  </label>
                  <input
                    type="text"
                    value={guardianRelation}
                    onChange={e => setGuardianRelation(e.target.value)}
                    placeholder="e.g. Father, Mother, Uncle"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition placeholder:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Guardian Contact
                  </label>
                  <input
                    type="text"
                    value={guardianContact}
                    onChange={e => setGuardianContact(e.target.value)}
                    placeholder="e.g. +1 (555) 123-4567"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition placeholder:text-gray-600"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition ${
                  editingId 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {editingId ? <Check size={16} /> : null}
                {editingId ? 'Update Record' : 'Save Student'}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2.5 bg-transparent border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 rounded-lg text-sm transition"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Registry List */}
        <div className="lg:col-span-3 bg-gray-800/60 border border-gray-700/40 rounded-xl p-5 flex flex-col h-[520px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-blue-400" />
              Active Student Registry
            </h3>
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full bg-gray-900/80 border border-gray-700 rounded-lg pl-9 pr-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition placeholder:text-gray-600"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => (
                <div 
                  key={student.id} 
                  className={`bg-gray-900/60 border rounded-xl p-4 flex flex-col justify-between items-stretch gap-3 hover:bg-gray-900/90 transition duration-150 ${
                    editingId === student.id ? 'border-emerald-500/50 bg-emerald-500/[0.02]' : 'border-gray-800/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {student.name}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-normal">
                          Roll: {student.rollNo}
                        </span>
                      </h4>
                      <p className="text-xs text-gray-400 flex items-center gap-2">
                        <span>📍 {student.className}</span>
                        {student.contact && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span>📞 {student.contact}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleEdit(student)}
                        className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition"
                        title="Edit Student"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id, student.name)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                        title="Delete Student"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Family / Parent / Guardian expand details section */}
                  {(student.fatherName || student.motherName || student.guardianName) && (
                    <div className="pt-2 border-t border-gray-800/80 space-y-1.5 text-xs text-gray-400 bg-gray-950/20 p-2 rounded-lg">
                      <div className="grid grid-cols-2 gap-1.5">
                        {student.fatherName && (
                          <div>
                            <span className="text-gray-500 font-medium">Father: </span>
                            <span className="text-gray-300 font-semibold">{student.fatherName}</span>
                          </div>
                        )}
                        {student.motherName && (
                          <div>
                            <span className="text-gray-500 font-medium">Mother: </span>
                            <span className="text-gray-300 font-semibold">{student.motherName}</span>
                          </div>
                        )}
                      </div>
                      {(student.guardianName || student.guardianContact) && (
                        <div className="pt-1 border-t border-gray-900/60 flex flex-wrap justify-between items-center gap-1">
                          <div>
                            <span className="text-gray-500 font-medium">Guardian: </span>
                            <span className="text-gray-200 font-bold">{student.guardianName || 'N/A'}</span>
                            {student.guardianRelation && (
                              <span className="text-gray-500 font-mono text-[10px] ml-1">({student.guardianRelation})</span>
                            )}
                          </div>
                          {student.guardianContact && (
                            <div className="text-blue-400 font-semibold text-[10px] font-mono">
                              📞 {student.guardianContact}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <p className="text-sm text-gray-400">No students found.</p>
                <p className="text-xs text-gray-500 mt-1">Add them via the register form on the left.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
