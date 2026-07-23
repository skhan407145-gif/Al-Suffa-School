import React, { useState, useMemo } from 'react';
import { Student, FeeRecord } from '../types';
import { DollarSign, CheckCircle, Clock, FileText } from 'lucide-react';

interface FeesViewProps {
  students: Student[];
  fees: FeeRecord[];
  onToggleFee: (studentId: number, month: string, amount: number) => void;
}

export const FeesView: React.FC<FeesViewProps> = ({
  students,
  fees,
  onToggleFee
}) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const now = new Date();
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  });

  const [billingAmount, setBillingAmount] = useState('3500.00');
  const [classFilter, setClassFilter] = useState('');

  // Dropdown billing cycles list
  const billingCycles = useMemo(() => {
    const year = new Date().getFullYear();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months.map(m => `${m} ${year}`);
  }, []);

  // Filter students by class
  const filteredStudents = useMemo(() => {
    const f = classFilter.toLowerCase().trim();
    if (!f) return students;
    return students.filter(s => s.className.toLowerCase().includes(f));
  }, [students, classFilter]);

  // Compute stats for current month + current filters
  const feeSummary = useMemo(() => {
    let total = 0;
    let paid = 0;
    let pending = 0;

    const parsedAmt = parseFloat(billingAmount) || 3500.00;

    filteredStudents.forEach(student => {
      const rec = fees.find(f => f.studentId === student.id && f.month === selectedMonth);
      if (rec) {
        total += rec.amount;
        if (rec.status === 'Paid') {
          paid += rec.amount;
        } else {
          pending += rec.amount;
        }
      } else {
        total += parsedAmt;
        pending += parsedAmt;
      }
    });

    return { total, paid, pending };
  }, [filteredStudents, fees, selectedMonth, billingAmount]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="p-1.5 bg-blue-600 rounded-md text-white text-base">💵</span>
          Fee Management Portal
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Monitor and track monthly fee records. Toggles apply simulated SQL UPSERT queries to <code className="text-blue-400 bg-gray-900/50 px-1 py-0.5 rounded font-mono">fees</code>.
        </p>
      </div>

      {/* Control Panel Bar */}
      <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
          {/* Select Month */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Billing Cycle
            </label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition"
            >
              {billingCycles.map(cycle => (
                <option key={cycle} value={cycle}>{cycle}</option>
              ))}
            </select>
          </div>

          {/* Billing value */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Billing Value (Rs.)
            </label>
            <input
              type="number"
              value={billingAmount}
              onChange={e => setBillingAmount(e.target.value)}
              placeholder="e.g. 3500.00"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Class Filter
            </label>
            <input
              type="text"
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              placeholder="All classes..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition placeholder:text-gray-600"
            />
          </div>

          {/* Summary metrics badge inside control bar */}
          <div className="md:col-span-3 lg:col-span-1 bg-gray-900/50 border border-gray-800 rounded-xl p-3 flex justify-between items-center text-xs font-semibold font-mono">
            <div className="space-y-0.5">
              <span className="text-gray-500 block uppercase text-[9px] tracking-wider">Metrics</span>
              <span className="text-white">Total: Rs. {feeSummary.total.toLocaleString()}</span>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-emerald-400 block">Paid: Rs. {feeSummary.paid.toLocaleString()}</span>
              <span className="text-rose-400 block">Pend: Rs. {feeSummary.pending.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet Ledger List */}
      <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-5 flex flex-col h-[400px]">
        {/* Table headers */}
        <div className="border-b border-gray-700/50 pb-3 mb-3 flex justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
          <span>Student Name & Class</span>
          <span className="mr-40">Fee Bill Action</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {filteredStudents.length > 0 ? (
            filteredStudents.map(student => {
              const rec = fees.find(f => f.studentId === student.id && f.month === selectedMonth);
              const status = rec ? rec.status : 'Pending';
              const amt = rec ? rec.amount : (parseFloat(billingAmount) || 3500.00);

              const isPaid = status === 'Paid';

              return (
                <div 
                  key={student.id} 
                  className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-900/95 transition duration-150"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {student.name}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-normal">
                        Roll: {student.rollNo}
                      </span>
                    </h4>
                    <p className="text-xs text-gray-400">📍 {student.className}</p>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-sm font-bold text-white font-mono">Rs. {amt.toLocaleString()}</span>
                    <button
                      onClick={() => onToggleFee(student.id, selectedMonth, amt)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition w-full sm:w-44 justify-center ${
                        isPaid 
                          ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle size={14} />
                          <span>💰 Paid - Click to Undo</span>
                        </>
                      ) : (
                        <>
                          <Clock size={14} />
                          <span>⚠️ Pending - Click to Pay</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <p className="text-sm text-gray-400">No students matching the criteria.</p>
              <p className="text-xs text-gray-500 mt-1">Please add students or change the filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
