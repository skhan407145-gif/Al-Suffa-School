export interface Student {
  id: number;
  name: string;
  className: string;
  rollNo: string;
  contact: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianContact?: string;
  password?: string;
}

export interface FeeRecord {
  studentId: number;
  month: string;
  amount: number;
  status: 'Paid' | 'Pending';
}

export interface AttendanceRecord {
  studentId: number;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent';
}

export interface InventoryItem {
  id: number;
  itemName: string;
  quantity: number;
  lowStockThreshold: number;
  expiryDate?: string; // YYYY-MM-DD
}

export interface StudentFeedback {
  id: number;
  studentId: number;
  studentName: string;
  rollNo: string;
  teachingRating: number; // 1-5
  environmentRating: number; // 1-5
  comments: string;
  date: string;
}

export interface LeaveApplication {
  id: number;
  studentId: number;
  studentName: string;
  rollNo: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  dateSubmitted: string;
}

export interface SubjectScore {
  subject: string;
  marks: number;
  totalMarks: number;
  grade: string;
}

export interface StudentResult {
  studentId: number;
  examName: string;
  subjectScores: SubjectScore[];
  totalObtained: number;
  totalPossible: number;
  percentage: number;
  gpa: string;
  remarks: string;
}

export interface Teacher {
  id: number;
  name: string;
  subject: string;
  qualification: string;
  className: string; // Designated Class Teacher
  contact: string;
  email: string;
  salary: number;
  joiningDate: string; // YYYY-MM-DD
  status: 'Active' | 'On Leave';
  password?: string;
}

export interface Admin {
  id: number;
  name: string;
  email: string;
  password?: string;
  contact?: string;
}

export interface UserSession {
  role: 'admin' | 'teacher' | 'student';
  userId: string | number;
  name: string;
  email?: string;
  rollNo?: string;
  className?: string; // Designated class name for student or teacher
}

