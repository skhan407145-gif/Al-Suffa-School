import { Student, FeeRecord, AttendanceRecord, InventoryItem, StudentResult, StudentFeedback, LeaveApplication, Teacher } from './types';

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 1,
    name: 'Mr. Muhammad Ali',
    subject: 'Mathematics',
    qualification: 'M.Sc Mathematics (PU)',
    className: 'Class 10-A',
    contact: '+92 300 1234567',
    email: 'm.ali@alsuffa.edu.pk',
    salary: 55000,
    joiningDate: '2021-03-10',
    status: 'Active'
  },
  {
    id: 2,
    name: 'Ms. Ayesha Khan',
    subject: 'Chemistry',
    qualification: 'M.Phil Organic Chemistry (QAU)',
    className: 'Class 9-B',
    contact: '+92 333 9876543',
    email: 'ayesha.k@alsuffa.edu.pk',
    salary: 52000,
    joiningDate: '2022-08-15',
    status: 'Active'
  },
  {
    id: 3,
    name: 'Mr. Bilal Ahmed',
    subject: 'Physics',
    qualification: 'M.Sc Applied Physics (KU)',
    className: 'Class 8-C',
    contact: '+92 312 2345678',
    email: 'bilal.a@alsuffa.edu.pk',
    salary: 50000,
    joiningDate: '2023-01-10',
    status: 'Active'
  },
  {
    id: 4,
    name: 'Mrs. Sana Fatima',
    subject: 'English Literature & Grammar',
    qualification: 'M.A. English Linguistics (UOK)',
    className: 'None',
    contact: '+92 321 8765432',
    email: 'sana.f@alsuffa.edu.pk',
    salary: 45000,
    joiningDate: '2024-04-05',
    status: 'On Leave'
  },
  {
    id: 5,
    name: 'Mr. Usman Tariq',
    subject: 'Computer Studies',
    qualification: 'BS Computer Science (FAST-NUCES)',
    className: 'None',
    contact: '+92 345 3456789',
    email: 'usman.t@alsuffa.edu.pk',
    salary: 60000,
    joiningDate: '2022-11-20',
    status: 'Active'
  }
];

export const INITIAL_STUDENTS: Student[] = [
  { 
    id: 1, 
    name: 'Alex Johnson', 
    className: 'Class 10-A', 
    rollNo: '101', 
    contact: '+1 (555) 123-4567',
    fatherName: 'Robert Johnson',
    motherName: 'Linda Johnson',
    guardianName: 'Robert Johnson',
    guardianRelation: 'Father',
    guardianContact: '+1 (555) 123-4567'
  },
  { 
    id: 2, 
    name: 'Sarah Miller', 
    className: 'Class 10-A', 
    rollNo: '102', 
    contact: '+1 (555) 987-6543',
    fatherName: 'Thomas Miller',
    motherName: 'Susan Miller',
    guardianName: 'Thomas Miller',
    guardianRelation: 'Father',
    guardianContact: '+1 (555) 987-6543'
  },
  { 
    id: 3, 
    name: 'Ryan Davis', 
    className: 'Class 9-B', 
    rollNo: '201', 
    contact: '+1 (555) 234-5678',
    fatherName: 'James Davis',
    motherName: 'Karen Davis',
    guardianName: 'James Davis',
    guardianRelation: 'Father',
    guardianContact: '+1 (555) 234-5678'
  },
  { 
    id: 4, 
    name: 'Emily Wilson', 
    className: 'Class 9-B', 
    rollNo: '202', 
    contact: '+1 (555) 876-5432',
    fatherName: 'David Wilson',
    motherName: 'Helen Wilson',
    guardianName: 'David Wilson',
    guardianRelation: 'Father',
    guardianContact: '+1 (555) 876-5432'
  },
  { 
    id: 5, 
    name: 'Michael Brown', 
    className: 'Class 8-C', 
    rollNo: '301', 
    contact: '+1 (555) 345-6789',
    fatherName: 'William Brown',
    motherName: 'Patricia Brown',
    guardianName: 'Patricia Brown',
    guardianRelation: 'Mother',
    guardianContact: '+1 (555) 345-6789'
  }
];

export const INITIAL_RESULTS: StudentResult[] = [
  {
    studentId: 1,
    examName: 'Mid-Term Examination 2026',
    subjectScores: [
      { subject: 'Physics (Science)', marks: 88, totalMarks: 100, grade: 'A' },
      { subject: 'Chemistry (Science)', marks: 92, totalMarks: 100, grade: 'A+' },
      { subject: 'Mathematics', marks: 95, totalMarks: 100, grade: 'A+' },
      { subject: 'English Grammar', marks: 84, totalMarks: 100, grade: 'A' },
      { subject: 'Islamic Studies', marks: 90, totalMarks: 100, grade: 'A+' }
    ],
    totalObtained: 449,
    totalPossible: 500,
    percentage: 89.8,
    gpa: '3.90',
    remarks: 'Outstanding performance. Strong scientific analytical skills.'
  },
  {
    studentId: 2,
    examName: 'Mid-Term Examination 2026',
    subjectScores: [
      { subject: 'Physics (Science)', marks: 78, totalMarks: 100, grade: 'B' },
      { subject: 'Chemistry (Science)', marks: 82, totalMarks: 100, grade: 'A' },
      { subject: 'Mathematics', marks: 74, totalMarks: 100, grade: 'B' },
      { subject: 'English Grammar', marks: 88, totalMarks: 100, grade: 'A' },
      { subject: 'Islamic Studies', marks: 85, totalMarks: 100, grade: 'A' }
    ],
    totalObtained: 407,
    totalPossible: 500,
    percentage: 81.4,
    gpa: '3.40',
    remarks: 'Very Good performance. Keep putting in effort in math reasoning.'
  },
  {
    studentId: 3,
    examName: 'Mid-Term Examination 2026',
    subjectScores: [
      { subject: 'General Science', marks: 81, totalMarks: 100, grade: 'A' },
      { subject: 'Mathematics', marks: 89, totalMarks: 100, grade: 'A' },
      { subject: 'English Grammar', marks: 79, totalMarks: 100, grade: 'B+' },
      { subject: 'History & Civics', marks: 83, totalMarks: 100, grade: 'A' },
      { subject: 'Urdu Literature', marks: 80, totalMarks: 100, grade: 'A' }
    ],
    totalObtained: 412,
    totalPossible: 500,
    percentage: 82.4,
    gpa: '3.50',
    remarks: 'Consistent student. Excellent work in Mathematics.'
  },
  {
    studentId: 4,
    examName: 'Mid-Term Examination 2026',
    subjectScores: [
      { subject: 'General Science', marks: 65, totalMarks: 100, grade: 'C' },
      { subject: 'Mathematics', marks: 58, totalMarks: 100, grade: 'D' },
      { subject: 'English Grammar', marks: 72, totalMarks: 100, grade: 'B' },
      { subject: 'History & Civics', marks: 68, totalMarks: 100, grade: 'C' },
      { subject: 'Urdu Literature', marks: 70, totalMarks: 100, grade: 'B' }
    ],
    totalObtained: 333,
    totalPossible: 500,
    percentage: 66.6,
    gpa: '2.30',
    remarks: 'Needs improvement in Science & Math. Extra remedial sessions advised.'
  },
  {
    studentId: 5,
    examName: 'Mid-Term Examination 2026',
    subjectScores: [
      { subject: 'Science Studies', marks: 91, totalMarks: 100, grade: 'A+' },
      { subject: 'Mathematics', marks: 93, totalMarks: 100, grade: 'A+' },
      { subject: 'English Grammar', marks: 94, totalMarks: 100, grade: 'A+' },
      { subject: 'Geography', marks: 89, totalMarks: 100, grade: 'A' },
      { subject: 'Urdu', marks: 87, totalMarks: 100, grade: 'A' }
    ],
    totalObtained: 454,
    totalPossible: 500,
    percentage: 90.8,
    gpa: '4.00',
    remarks: 'Excellent student. Highest performance in English Grammar.'
  }
];

export const INITIAL_FEEDBACKS: StudentFeedback[] = [
  {
    id: 1,
    studentId: 1,
    studentName: 'Alex Johnson',
    rollNo: '101',
    teachingRating: 5,
    environmentRating: 4,
    comments: 'The science teachers explain concepts using real-life experiments. Physics class is amazing! The playground environment is great but gets crowded.',
    date: '2026-06-25'
  },
  {
    id: 2,
    studentId: 3,
    studentName: 'Ryan Davis',
    rollNo: '201',
    teachingRating: 4,
    environmentRating: 5,
    comments: 'Very clean campus. Computer lab facilities are excellent, and the school library has great books for self-study.',
    date: '2026-06-28'
  }
];

export const INITIAL_LEAVES: LeaveApplication[] = [
  {
    id: 1,
    studentId: 2,
    studentName: 'Sarah Miller',
    rollNo: '102',
    startDate: '2026-07-05',
    endDate: '2026-07-06',
    reason: 'Urgent family matter to attend out of city with parents.',
    status: 'Pending',
    dateSubmitted: '2026-07-02'
  },
  {
    id: 2,
    studentId: 5,
    studentName: 'Michael Brown',
    rollNo: '301',
    startDate: '2026-06-20',
    endDate: '2026-06-22',
    reason: 'Sore throat and fever. Under medical observation.',
    status: 'Approved',
    dateSubmitted: '2026-06-19'
  }
];

export const getInitialFees = (): FeeRecord[] => {
  const currentMonth = getCurrentMonthString();
  return [
    { studentId: 1, month: currentMonth, amount: 3500.00, status: 'Paid' },
    { studentId: 2, month: currentMonth, amount: 3500.00, status: 'Pending' },
    { studentId: 3, month: currentMonth, amount: 3500.00, status: 'Paid' },
    { studentId: 4, month: currentMonth, amount: 3500.00, status: 'Pending' },
    { studentId: 5, month: currentMonth, amount: 3500.00, status: 'Paid' }
  ];
};

export const getInitialAttendance = (): AttendanceRecord[] => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  return [
    { studentId: 1, date: today, status: 'Present' },
    { studentId: 2, date: today, status: 'Present' },
    { studentId: 3, date: today, status: 'Present' },
    { studentId: 4, date: today, status: 'Absent' },
    { studentId: 5, date: today, status: 'Present' },
    // Yesterday
    { studentId: 1, date: yesterday, status: 'Present' },
    { studentId: 2, date: yesterday, status: 'Present' },
    { studentId: 3, date: yesterday, status: 'Present' },
    { studentId: 4, date: yesterday, status: 'Present' },
    { studentId: 5, date: yesterday, status: 'Present' }
  ];
};

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 1, itemName: 'School Blazers - Medium', quantity: 12, lowStockThreshold: 15 }, // Low stock
  { id: 2, itemName: 'Grade 10 Math Textbook', quantity: 45, lowStockThreshold: 10 },
  { id: 3, itemName: 'Science Lab Kit A', quantity: 5, lowStockThreshold: 10, expiryDate: getOffsetDateString(45) }, // Nearing expiry
  { id: 4, itemName: 'First Aid Refill kit', quantity: 15, lowStockThreshold: 5, expiryDate: getOffsetDateString(-15) }, // Expired
  { id: 5, itemName: 'Whiteboard Markers (Box of 12)', quantity: 30, lowStockThreshold: 8, expiryDate: getOffsetDateString(400) }
];

export function getCurrentMonthString(): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const now = new Date();
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

export function getOffsetDateString(daysOffset: number): string {
  const date = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);
  return date.toISOString().split('T')[0];
}
