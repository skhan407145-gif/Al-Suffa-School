import React, { useState, useMemo, useEffect } from 'react';
import { Student, AttendanceRecord, UserSession } from '../types';
import { Check, X, Calendar, Search } from 'lucide-react';

interface AttendanceViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  onSaveAttendance: (date: string, records: Array<{ studentId: number; status: 'Present' | 'Absent' }>) => void;
  userSession?: UserSession | null;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  attendance,
  onSaveAttendance,
  userSession
}) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [classNameInput, setClassNameInput] = useState(() => {
    return userSession?.role === 'teacher' ? userSession.className || '' : '';
  });
  const [tempRecords, setTempRecords] = useState<Record<number, 'Present' | 'Absent'>>({});
  const [loadedClass, setLoadedClass] = useState<string | null>(null);

  // Auto-load class attendance if teacher
  useEffect(() => {
    if (userSession?.role === 'teacher' && userSession.className) {
      const matchedClass = userSession.className;
      setLoadedClass(matchedClass);
      setClassNameInput(matchedClass);

      // Filter students belonging to this class
      const matchingStudents = students.filter(s => s.className.toLowerCase() === matchedClass.toLowerCase());

      const recordsMap: Record<number, 'Present' | 'Absent'> = {};
      matchingStudents.forEach(student => {
        const existing = attendance.find(a => a.studentId === student.id && a.date === selectedDate);
        recordsMap[student.id] = existing ? existing.status : 'Present';
      });
      setTempRecords(recordsMap);
    }
  }, [userSession, students, selectedDate, attendance]);

  // Retrieve active students under the specified class
  const classStudents = useMemo(() => {
    if (!loadedClass) return [];
    return students.filter(s => s.className.toLowerCase() === loadedClass.toLowerCase());
  }, [students, loadedClass]);

  // Load the attendance sheet for the selected class and date
  const handleLoadSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim()) {
      alert('Please enter a class name (e.g. Class 10-A) to load!');
      return;
    }

    const matchedClass = classNameInput.trim();
    setLoadedClass(matchedClass);

    // Filter students belonging to this class
    const matchingStudents = students.filter(s => s.className.toLowerCase() === matchedClass.toLowerCase());

    const recordsMap: Record<number, 'Present' | 'Absent'> = {};
    matchingStudents.forEach(student => {
      // Check if there is an existing record in our list for this date & student
      const existing = attendance.find(a => a.studentId === student.id && a.date === selectedDate);
      recordsMap[student.id] = existing ? existing.status : 'Present'; // default to Present if not logged
    });

    setTempRecords(recordsMap);
  };

  const handleToggleStatus = (studentId: number, status: 'Present' | 'Absent') => {
    setTempRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSetAll = (status: 'Present' | 'Absent') => {
    const updated = { ...tempRecords };
    classStudents.forEach(student => {
      updated[student.id] = status;
    });
    setTempRecords(updated);
  };

  const handleSave = () => {
    if (!loadedClass) return;
    const recordsToSave = classStudents.map(student => ({
      studentId: student.id,
      status: tempRecords[student.id] || 'Present'
    }));

    onSaveAttendance(selectedDate, recordsToSave);
    alert(`Attendance sheet for ${selectedDate} under ${loadedClass} saved successfully!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="p-1.5 bg-blue-600 rounded-md text-white text-base">📅</span>
          Daily Attendance Ledger
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Select date and class to log daily attendance. Saves execute simulated SQL REPLACE queries on <code className="text-blue-400 bg-gray-900/50 px-1 py-0.5 rounded font-mono">attendance</code>.
        </p>
      </div>

      {/* Selector controls */}
      <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-5">
        <form onSubmit={handleLoadSheet} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Attendance Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => {
                setSelectedDate(e.target.value);
                setLoadedClass(null); // Reset sheet on date change so they reload
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Class Filter */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Class / Grade * {userSession?.role === 'teacher' && <span className="text-amber-400 text-[10px] lowercase font-normal">(locked to your class)</span>}
            </label>
            <div className="relative">
              <input
                type="text"
                value={classNameInput}
                onChange={e => setClassNameInput(e.target.value)}
                placeholder="e.g. Class 10-A, Class 9-B..."
                disabled={userSession?.role === 'teacher'}
                className={`w-full bg-gray-900 border border-gray-700 rounded-lg px-3.5 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition placeholder:text-gray-600 ${
                  userSession?.role === 'teacher' ? 'opacity-70 cursor-not-allowed text-amber-300 font-bold border-amber-600/30' : ''
                }`}
                required
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5"
            >
              <Search size={14} />
              Load Sheet
            </button>
          </div>

          {/* Batch Toggles */}
          {loadedClass && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSetAll('Present')}
                className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-2 rounded-lg text-[11px] font-bold transition"
              >
                ✅ All Present
              </button>
              <button
                type="button"
                onClick={() => handleSetAll('Absent')}
                className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-2 rounded-lg text-[11px] font-bold transition"
              >
                ❌ All Absent
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Grid Sheet Display */}
      {loadedClass ? (
        <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-5 flex flex-col h-[380px]">
          {/* Table headers */}
          <div className="border-b border-gray-700/50 pb-3 mb-3 flex justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
            <span>Roll & Student Name</span>
            <span className="mr-24">Status Marker</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {classStudents.length > 0 ? (
              classStudents.map(student => {
                const currentStatus = tempRecords[student.id] || 'Present';
                const isPresent = currentStatus === 'Present';

                return (
                  <div 
                    key={student.id} 
                    className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-900/95 transition duration-150"
                  >
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        #{student.rollNo}
                        <span className="text-gray-600">•</span>
                        <span>{student.name}</span>
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(student.id, 'Present')}
                        className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition w-28 ${
                          isPresent 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white'
                        }`}
                      >
                        <Check size={14} />
                        Present
                      </button>
                      <button
                        onClick={() => handleToggleStatus(student.id, 'Absent')}
                        className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition w-28 ${
                          !isPresent 
                            ? 'bg-rose-600 text-white' 
                            : 'bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white'
                        }`}
                      >
                        <X size={14} />
                        Absent
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <p className="text-sm text-gray-400">No registered students found in "{loadedClass}".</p>
                <p className="text-xs text-gray-500 mt-1">Please verify class names inside the Admission portal first.</p>
              </div>
            )}
          </div>

          {/* Footer Save Button */}
          {classStudents.length > 0 && (
            <div className="border-t border-gray-700/50 pt-4 mt-4">
              <button
                onClick={handleSave}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-sm transition"
              >
                💾 Save Marked Attendance Sheet
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-10 text-center text-gray-400 h-[380px] flex flex-col justify-center items-center">
          <Calendar size={48} className="text-gray-600 mb-4" />
          <h3 className="text-base font-bold text-white mb-1">Attendance Sheet Not Loaded</h3>
          <p className="text-xs text-gray-500 max-w-sm">
            Enter a class grade (e.g. "Class 10-A") and click "Load Sheet" above to mark attendance.
          </p>
        </div>
      )}
    </div>
  );
};
