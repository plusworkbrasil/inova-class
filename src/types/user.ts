export type UserRole = 'admin' | 'secretary' | 'instructor' | 'student' | 'coordinator' | 'tutor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  auto_student_id?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student extends User {
  role: 'student';
  studentId: string;
  classId: string;
  enrollmentDate: Date;
  cpf: string;
  fullName: string;
  photo?: string;
  parentName: string;
  escolaridade: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  guardianName?: string;
  guardianPhone?: string;
}

export interface Teacher extends User {
  role: 'instructor';
  teacherId: string;
  subjects: string[];
  classes: string[];
}

export interface Class {
  id: string;
  name: string;
  grade: string;
  year: number;
  teacherId: string;
  studentCount: number;
  subjects: Subject[];
}

export interface Subject {
  id: string;
  name: string;
  teacherId: string;
  classId: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  date: Date;
  isPresent: boolean;
  justification?: string;
}

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  value: number;
  maxValue: number;
  type: 'test' | 'assignment' | 'project' | 'final';
  date: Date;
}

export interface AbsenceDeclaration {
  id: string;
  studentId: string;
  submittedBy: string;
  reason: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  documents?: string[];
}