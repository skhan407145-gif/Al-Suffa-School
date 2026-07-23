# Security Specification: Al-Suffa School Management System

## 1. Data Invariants

1. **Student Invariant**: Every student must have a valid `id` (number), `name` (string), and `rollNo` (string).
2. **Teacher Invariant**: Every teacher must have a valid `id`, `name`, `email`, and a `status` which is either `"Active"` or `"On Leave"`.
3. **Fee Record Invariant**: Every fee record must reference a valid student ID, a string month, a non-negative numeric amount, and its status must be either `"Paid"` or `"Pending"`.
4. **Attendance Record Invariant**: Every attendance record must have a student ID, a valid ISO date representation, and a status of either `"Present"` or `"Absent"`.
5. **Inventory Invariant**: Inventory items must have a non-negative numeric quantity, a non-negative low-stock threshold, and a valid item name.
6. **Feedback Invariant**: Ratings for teaching and environment quality must be strictly bounded between 1 and 5.
7. **Leave Invariant**: Leave applications must have a start/end date, and their review status must strictly be one of `"Pending"`, `"Approved"`, or `"Rejected"`.
8. **Result Invariant**: Total obtained marks cannot exceed total possible marks, and the score percentage must be bounded between 0 and 100.

---

## 2. The "Dirty Dozen" Payloads (Malicious Write Attempts)

Here are twelve payloads designed to violate data structures, bypass validation checks, or trigger privilege escalation in an unauthenticated setup.

### Payload 1: Student Record with Ghost Fields (Shadow Update)
```json
{
  "id": 101,
  "name": "Arslan Khan",
  "className": "Class 10-A",
  "rollNo": "101",
  "contact": "+923001234567",
  "isVerified": true,
  "systemAdminRole": "super-admin"
}
```
*Expected Result*: `PERMISSION_DENIED` (fails `hasOnly` / keys size schema gate).

### Payload 2: Teacher with Negative Salary
```json
{
  "id": 1,
  "name": "M. Ali",
  "subject": "Mathematics",
  "qualification": "M.Sc. Mathematics",
  "className": "Class 10-A",
  "contact": "+923219876543",
  "email": "m.ali@alsuffa.edu.pk",
  "salary": -50000,
  "joiningDate": "2024-03-15",
  "status": "Active"
}
```
*Expected Result*: `PERMISSION_DENIED` (salary must be >= 0).

### Payload 3: Attendance Record with Invalid Status Type
```json
{
  "studentId": 101,
  "date": "2026-07-05",
  "status": "Late"
}
```
*Expected Result*: `PERMISSION_DENIED` (status must be "Present" or "Absent").

### Payload 4: Attendance with Invalid Huge String ID (Resource Poisoning)
```json
{
  "id": "att_101_2026-07-05_extra_poison_padding_character_sequence_extending_beyond_one_hundred_and_twenty_eight_bytes_long_to_drain_storage_and_bandwidth",
  "studentId": 101,
  "date": "2026-07-05",
  "status": "Present"
}
```
*Expected Result*: `PERMISSION_DENIED` (fails ID format/size check).

### Payload 5: Fee Record with Negative Amount
```json
{
  "studentId": 102,
  "month": "July 2026",
  "amount": -1500,
  "status": "Paid"
}
```
*Expected Result*: `PERMISSION_DENIED` (amount must be >= 0).

### Payload 6: Inventory Item with String Quantity (Type Confusion)
```json
{
  "id": 99,
  "itemName": "Whiteboard Markers",
  "quantity": "50",
  "lowStockThreshold": 10
}
```
*Expected Result*: `PERMISSION_DENIED` (quantity must be a number).

### Payload 7: Feedback with Environment Rating Out of Bounds (Value Poisoning)
```json
{
  "id": 5,
  "studentId": 101,
  "studentName": "Ali Raza",
  "rollNo": "101",
  "teachingRating": 5,
  "environmentRating": 99,
  "comments": "This environment is insanely outstanding!",
  "date": "2026-07-05"
}
```
*Expected Result*: `PERMISSION_DENIED` (environmentRating must be <= 5).

### Payload 8: Feedback with Sub-zero Rating
```json
{
  "id": 6,
  "studentId": 101,
  "studentName": "Ali Raza",
  "rollNo": "101",
  "teachingRating": -1,
  "environmentRating": 4,
  "comments": "Poor teaching",
  "date": "2026-07-05"
}
```
*Expected Result*: `PERMISSION_DENIED` (teachingRating must be >= 1).

### Payload 9: Leave Application status change bypassing state machine
```json
{
  "id": 1,
  "studentId": 101,
  "studentName": "Ali Raza",
  "rollNo": "101",
  "startDate": "2026-07-10",
  "endDate": "2026-07-15",
  "reason": "Medical leave",
  "status": "Auto-Approved-By-Attacker",
  "dateSubmitted": "2026-07-05"
}
```
*Expected Result*: `PERMISSION_DENIED` (status must be "Pending", "Approved", or "Rejected").

### Payload 10: Result Card with Impossible Percentage
```json
{
  "studentId": 101,
  "examName": "Final Exam 2026",
  "totalObtained": 950,
  "totalPossible": 1000,
  "percentage": 105,
  "gpa": "4.0",
  "remarks": "Fabulous job"
}
```
*Expected Result*: `PERMISSION_DENIED` (percentage must be <= 100).

### Payload 11: Result Card with Excess Obtained Marks
```json
{
  "studentId": 101,
  "examName": "Final Exam 2026",
  "totalObtained": 1200,
  "totalPossible": 1000,
  "percentage": 120,
  "gpa": "4.0",
  "remarks": "Fabulous job"
}
```
*Expected Result*: `PERMISSION_DENIED` (totalObtained must be <= totalPossible).

### Payload 12: Inventory Item with Extremely Long Name (Denial of Wallet)
```json
{
  "id": 105,
  "itemName": "A very long item name consisting of repetitive words repeating continuously to exceed the characters threshold and bloat index size in firestore index files",
  "quantity": 100,
  "lowStockThreshold": 5
}
```
*Expected Result*: `PERMISSION_DENIED` (itemName size must be <= 100 characters).

---

## 3. The Test Suite (`firestore.rules.test.ts`)

Below is the complete TypeScript test suite validating security restrictions.

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "summer-hue-qtxfk",
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8')
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("School Management Security Rules", () => {
  it("should deny shadow update on student", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const ref = doc(db, 'students/101');
    await assertFails(setDoc(ref, {
      id: 101,
      name: "Arslan Khan",
      className: "Class 10-A",
      rollNo: "101",
      contact: "+923001234567",
      isVerified: true,
      systemAdminRole: "super-admin"
    }));
  });

  it("should deny teacher with negative salary", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const ref = doc(db, 'teachers/1');
    await assertFails(setDoc(ref, {
      id: 1,
      name: "M. Ali",
      subject: "Mathematics",
      qualification: "M.Sc. Mathematics",
      className: "Class 10-A",
      contact: "+923219876543",
      email: "m.ali@alsuffa.edu.pk",
      salary: -50000,
      joiningDate: "2024-03-15",
      status: "Active"
    }));
  });

  it("should deny attendance status with invalid values", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const ref = doc(db, 'attendance/att_101_2026-07-05');
    await assertFails(setDoc(ref, {
      studentId: 101,
      date: "2026-07-05",
      status: "Late"
    }));
  });
});
```
