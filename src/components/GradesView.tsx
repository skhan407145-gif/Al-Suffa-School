import React, { useState, useEffect, useMemo } from 'react';
import { Student, StudentResult, SubjectScore, UserSession } from '../types';
import { Award, Plus, Trash, Save, BookOpen, Check, AlertCircle } from 'lucide-react';

interface GradesViewProps {
  students: Student[];
  results: StudentResult[];
  onSaveResult: (result: StudentResult) => Promise<void>;
  userSession: UserSession | null;
  appearanceMode: 'dark' | 'light';
}

export const GradesView: React.FC<GradesViewProps> = ({
  students,
  results,
  onSaveResult,
  userSession,
  appearanceMode
}) => {
  // Filter students based on Teacher's designated class
  const allowedStudents = useMemo(() => {
    if (!userSession) return [];
    if (userSession.role === 'admin') return students;
    if (userSession.role === 'teacher') {
      const teacherClass = userSession.className;
      if (!teacherClass || teacherClass === 'None') return [];
      return students.filter(s => s.className.toLowerCase() === teacherClass.toLowerCase());
    }
    return [];
  }, [students, userSession]);

  const classesList = useMemo(() => {
    const classesSet = new Set(allowedStudents.map(s => s.className));
    return Array.from(classesSet).sort();
  }, [allowedStudents]);

  // Form States
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');
  const [examName, setExamName] = useState<string>('Mid-Term Examination 2026');
  const [subjectScores, setSubjectScores] = useState<SubjectScore[]>([]);
  const [gpa, setGpa] = useState<string>('4.00');
  const [remarks, setRemarks] = useState<string>('');
  
  // Custom subject input state
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Set default class
  useEffect(() => {
    if (classesList.length > 0 && !selectedClass) {
      setSelectedClass(classesList[0]);
    }
  }, [classesList, selectedClass]);

  // Filter students by selected class
  const studentsInSelectedClass = useMemo(() => {
    if (!selectedClass) return [];
    return allowedStudents.filter(s => s.className === selectedClass);
  }, [allowedStudents, selectedClass]);

  // Load existing grade record when student is selected
  useEffect(() => {
    if (selectedStudentId !== '') {
      const existingResult = results.find(r => r.studentId === Number(selectedStudentId));
      if (existingResult) {
        setExamName(existingResult.examName);
        setSubjectScores(existingResult.subjectScores || []);
        setGpa(existingResult.gpa);
        setRemarks(existingResult.remarks);
      } else {
        // Populate standard default subjects
        const defaultSubjects = [
          { subject: 'Mathematics', marks: 80, totalMarks: 100, grade: 'A' },
          { subject: 'English Grammar', marks: 80, totalMarks: 100, grade: 'A' },
          { subject: 'Islamic Studies', marks: 80, totalMarks: 100, grade: 'A' },
          { subject: 'General Science', marks: 80, totalMarks: 100, grade: 'A' },
          { subject: 'Urdu Literature', marks: 80, totalMarks: 100, grade: 'A' }
        ];
        setExamName('Mid-Term Examination 2026');
        setSubjectScores(defaultSubjects);
        setGpa('3.50');
        setRemarks('Good progress. Active classroom participation.');
      }
    } else {
      setSubjectScores([]);
      setRemarks('');
    }
  }, [selectedStudentId, results]);

  // Helper for Grade Letter conversion
  const getGradeLetter = (marks: number, total: number): string => {
    const percentage = (marks / total) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  // Helper to suggest GPA based on percentage
  const suggestGpa = (percentage: number): string => {
    if (percentage >= 90) return '4.00';
    if (percentage >= 80) return (3.0 + (percentage - 80) * 0.1).toFixed(2);
    if (percentage >= 70) return (2.0 + (percentage - 70) * 0.1).toFixed(2);
    if (percentage >= 60) return (1.5 + (percentage - 60) * 0.05).toFixed(2);
    if (percentage >= 50) return '1.00';
    return '0.00';
  };

  // Handle score changes
  const handleScoreChange = (index: number, marks: number) => {
    const updated = [...subjectScores];
    const total = updated[index].totalMarks || 100;
    // Guard constraints
    const safeMarks = Math.max(0, Math.min(total, marks));
    updated[index].marks = safeMarks;
    updated[index].grade = getGradeLetter(safeMarks, total);
    setSubjectScores(updated);

    // Auto calculate totals & suggested GPA
    const totalObt = updated.reduce((sum, s) => sum + s.marks, 0);
    const totalPoss = updated.reduce((sum, s) => sum + s.totalMarks, 0);
    if (totalPoss > 0) {
      const percentage = (totalObt / totalPoss) * 100;
      setGpa(suggestGpa(percentage));
    }
  };

  // Add Custom Subject
  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    if (subjectScores.some(s => s.subject.toLowerCase() === newSubjectName.trim().toLowerCase())) {
      setNotification({ type: 'error', text: 'Subject already exists in list.' });
      return;
    }
    setSubjectScores([
      ...subjectScores,
      { subject: newSubjectName.trim(), marks: 80, totalMarks: 100, grade: 'A' }
    ]);
    setNewSubjectName('');
    setNotification(null);
  };

  // Remove Subject
  const handleRemoveSubject = (index: number) => {
    const updated = subjectScores.filter((_, i) => i !== index);
    setSubjectScores(updated);
  };

  // Derived calculations
  const totals = useMemo(() => {
    const obtained = subjectScores.reduce((sum, s) => sum + s.marks, 0);
    const possible = subjectScores.reduce((sum, s) => sum + s.totalMarks, 0);
    const percentage = possible > 0 ? parseFloat(((obtained / possible) * 100).toFixed(1)) : 0;
    return { obtained, possible, percentage };
  }, [subjectScores]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentId === '') {
      setNotification({ type: 'error', text: 'Please select a student.' });
      return;
    }
    if (subjectScores.length === 0) {
      setNotification({ type: 'error', text: 'Please add at least one subject score.' });
      return;
    }

    setIsSaving(true);
    setNotification(null);

    const updatedResult: StudentResult = {
      studentId: Number(selectedStudentId),
      examName: examName.trim() || 'Mid-Term Examination 2026',
      subjectScores,
      totalObtained: totals.obtained,
      totalPossible: totals.possible,
      percentage: totals.percentage,
      gpa,
      remarks: remarks.trim() || 'Grades input updated.'
    };

    try {
      await onSaveResult(updatedResult);
      setNotification({ type: 'success', text: 'Student grades saved successfully!' });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setNotification({ type: 'error', text: 'Error saving grades to database.' });
    } finally {
      setIsSaving(false);
    }
  };

  const isDark = appearanceMode === 'dark';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <span>📝</span> Academic Grading Panel
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {userSession?.role === 'teacher' 
            ? `Classroom Grade Entry for ${userSession.className}. Input or edit mid-term scorecards.`
            : 'Global academic registry. View, update, or publish student term cards.'}
        </p>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl flex items-center gap-2 text-xs border ${
          notification.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        }`}>
          {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{notification.text}</span>
        </div>
      )}

      {allowedStudents.length === 0 ? (
        <div className={`p-8 rounded-xl text-center border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
          <BookOpen className="mx-auto w-12 h-12 text-zinc-500 mb-2" />
          <h3 className="font-bold text-gray-300">No Assigned Classroom</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            You do not currently have a designated class assigned to your record (or your class is marked as 'None'). Ask an administrator to assign you a class in the Teachers Registry.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Student Selection */}
          <div className="lg:col-span-4 space-y-4">
            <div className={`p-5 rounded-xl border flex flex-col space-y-4 ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>👤</span> Select Student
              </h3>

              {classesList.length > 1 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Class Filter</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedStudentId('');
                    }}
                    className="w-full bg-gray-950 border border-gray-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                  >
                    {classesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Student Record</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-gray-950 border border-gray-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="">-- Choose Student --</option>
                  {studentsInSelectedClass.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Roll: {s.rollNo})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudentId !== '' && (
                <div className="p-3 bg-gray-950/40 rounded-lg border border-gray-800 space-y-2 text-xs">
                  {(() => {
                    const activeStudent = students.find(s => s.id === Number(selectedStudentId));
                    if (!activeStudent) return null;
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Student:</span>
                          <span className="text-white font-bold">{activeStudent.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Class:</span>
                          <span className="text-white font-semibold">{activeStudent.className}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Roll No:</span>
                          <span className="text-blue-400 font-bold font-mono">{activeStudent.rollNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Guardian:</span>
                          <span className="text-white font-medium">{activeStudent.guardianName || 'N/A'}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Grades Form */}
          <div className="lg:col-span-8">
            {selectedStudentId === '' ? (
              <div className={`h-full flex flex-col items-center justify-center p-12 text-center rounded-xl border ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <Award className="w-16 h-16 text-zinc-600 mb-2" />
                <h3 className="font-semibold text-gray-400 text-sm">No Student Selected</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  Please select a student from the sidebar to view their scorecard or enter their grades for the term.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={`p-6 rounded-xl border space-y-6 ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                
                {/* Term Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Exam Term Description</label>
                    <input
                      type="text"
                      required
                      value={examName}
                      onChange={(e) => setExamName(e.target.value)}
                      placeholder="e.g. Mid-Term Examination 2026"
                      className="w-full bg-gray-950 border border-gray-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Cumulative GPA</label>
                    <input
                      type="text"
                      required
                      value={gpa}
                      onChange={(e) => setGpa(e.target.value)}
                      placeholder="e.g. 3.85"
                      className="w-full bg-gray-950 border border-gray-850 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Score inputs list */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Subject Mark List</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="New Subject"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        className="bg-gray-950 border border-gray-850 rounded px-2.5 py-1 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubject();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddSubject}
                        className="p-1 bg-[#1f538d] hover:bg-blue-600 text-white rounded text-xs transition"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {subjectScores.map((score, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-gray-950/50 border border-gray-850/50 p-2 rounded-lg text-xs justify-between">
                        <span className="font-semibold text-gray-200 flex-1 truncate">{score.subject}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={score.totalMarks || 100}
                            value={score.marks}
                            onChange={(e) => handleScoreChange(idx, Number(e.target.value))}
                            className="bg-gray-950 border border-gray-850 rounded text-center w-14 py-1 text-xs text-white font-semibold font-mono"
                          />
                          <span className="text-gray-500">/</span>
                          <span className="text-gray-400 font-mono">{score.totalMarks || 100}</span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] w-8 text-center uppercase ${
                            score.grade.startsWith('A') 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : score.grade.startsWith('B')
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {score.grade}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(idx)}
                            className="text-gray-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition"
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {subjectScores.length === 0 && (
                      <p className="text-center text-xs text-gray-500 py-4">No subjects added. Use the top bar to add.</p>
                    )}
                  </div>
                </div>

                {/* Score Totals Card */}
                {subjectScores.length > 0 && (
                  <div className="bg-gray-950/60 border border-gray-850/50 rounded-xl p-3 flex justify-between items-center text-xs text-gray-400 font-medium">
                    <span>Summary:</span>
                    <div className="flex gap-4">
                      <span>Total Marks: <strong className="text-white font-mono">{totals.obtained} / {totals.possible}</strong></span>
                      <span>Percentage: <strong className="text-blue-400 font-mono">{totals.percentage}%</strong></span>
                    </div>
                  </div>
                )}

                {/* Remarks Field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Teacher's Assessment Remarks</label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Provide specific feedback on student strengths and study areas..."
                    className="w-full bg-gray-950 border border-gray-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                {/* Form Action */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition flex items-center gap-2"
                  >
                    <Save size={14} />
                    {isSaving ? 'Saving Card...' : 'Save Academic Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
