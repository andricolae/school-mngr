import { Course, CourseSession, UserModel } from './../../core/user.model';
import * as CourseActions from '../../state/courses/course.actions';
import * as UserActions from '../../state/users/user.actions';
import { Store } from '@ngrx/store';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { selectAllCourses } from '../../state/courses/course.selector';
import { AsyncPipe } from '@angular/common';
import { SpinnerComponent } from '../../core/spinner/spinner.component';
import { SpinnerService } from '../../core/services/spinner.service';
import { ConfirmationDialogComponent } from "../../core/confirmation-dialog/confirmation-dialog.component";
import { selectAllUsers } from '../../state/users/user.selector';
import { v4 as uuidv4 } from 'uuid';

interface CourseGrade {
  title: string;
  value: number;
  date: string;
}

interface ClassSession {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
}

interface StudentGrade {
  id: string;
  title: string;
  value: number;
  date: string;
}

interface StudentAttendance {
  id: string;
  sessionId: string;
  status: 'present' | 'absent';
}

interface EnrolledStudent {
  id: string;
  name: string;
  email: string;
  grades: StudentGrade[];
  attendance: StudentAttendance[];
}

interface CourseData {
  id: string;
  sessions: ClassSession[];
  enrolledStudents: EnrolledStudent[];
}

@Component({
  selector: 'app-admin-dash',
  standalone: true,
  imports: [FormsModule, AsyncPipe, SpinnerComponent, ConfirmationDialogComponent],
  templateUrl: './admin-dash.component.html',
})
export class AdminDashComponent {
  @ViewChild('dialog') dialog!: ConfirmationDialogComponent;

  courseCount = 0;
  studentCount = 0;
  teacherCount = 0;

  newUser: UserModel = { fullName: '', role: '', email: '' };
  editingUserId: string | null = null;
  users$ = this.store.select(selectAllUsers);

  teachers: UserModel[] = [];

  newCourse: Course = {name: '', teacher: '', schedule: '', sessions: [], enrolledStudents: []};
  courses$ = this.store.select(selectAllCourses);
  editingCourseId: string | null = null;
  selectedCourseId: string | undefined = '';

  activeTab: 'grades' | 'attendance' = 'grades';

  showSessionModal = false;
  editingSession: CourseSession = {
    id: '',
    date: new Date(),
    startTime: '',
    endTime: '',
  };
  editingSessionIndex: number = -1;

  // courseData: CourseData[] = [
  //   {
  //     id: '8wsabe26wHRwtWVovATi',
  //     sessions: [
  //       { id: 'session1', date: new Date(2025, 2, 5), startTime: '13:00', endTime: '15:00' },
  //       { id: 'session2', date: new Date(2025, 2, 10), startTime: '13:00', endTime: '15:00' },
  //       { id: 'session3', date: new Date(2025, 2, 15), startTime: '13:00', endTime: '15:00' },
  //       { id: 'session4', date: new Date(2025, 2, 20), startTime: '13:00', endTime: '15:00' },
  //       { id: 'session5', date: new Date(2025, 2, 25), startTime: '13:00', endTime: '15:00' },
  //       { id: 'session6', date: new Date(2025, 2, 30), startTime: '13:00', endTime: '15:00' }
  //     ],
  //     enrolledStudents: [
  //       {
  //         id: 'student1',
  //         name: 'Alex Johnson',
  //         email: 'alex@example.com',
  //         grades: [
  //           { id: 'grade1', title: 'Midterm Exam', value: 9.5, date: '2025-02-15' },
  //           { id: 'grade2', title: 'Lab Report 1', value: 8.8, date: '2025-01-25' },
  //           { id: 'grade3', title: 'Lab Report 2', value: 7.5, date: '2025-03-10' }
  //         ],
  //         attendance: [
  //           { id: 'att1', sessionId: 'session1', status: 'present' },
  //           { id: 'att2', sessionId: 'session2', status: 'present' },
  //           { id: 'att3', sessionId: 'session3', status: 'present' },
  //           { id: 'att4', sessionId: 'session4', status: 'absent' },
  //           { id: 'att5', sessionId: 'session5', status: 'present' },
  //           { id: 'att6', sessionId: 'session6', status: 'present' }
  //         ]
  //       },
  //       {
  //         id: 'student2',
  //         name: 'Emma Wilson',
  //         email: 'emma@example.com',
  //         grades: [
  //           { id: 'grade1', title: 'Midterm Exam', value: 8.5, date: '2025-02-15' },
  //           { id: 'grade2', title: 'Lab Report 1', value: 9.2, date: '2025-01-25' },
  //           { id: 'grade3', title: 'Lab Report 2', value: 8.7, date: '2025-03-10' }
  //         ],
  //         attendance: [
  //           { id: 'att1', sessionId: 'session1', status: 'present' },
  //           { id: 'att2', sessionId: 'session2', status: 'absent' },
  //           { id: 'att3', sessionId: 'session3', status: 'present' },
  //           { id: 'att4', sessionId: 'session4', status: 'present' },
  //           { id: 'att5', sessionId: 'session5', status: 'present' },
  //           { id: 'att6', sessionId: 'session6', status: 'absent' }
  //         ]
  //       },
  //       {
  //         id: 'student3',
  //         name: 'Michael Brown',
  //         email: 'michael@example.com',
  //         grades: [
  //           { id: 'grade1', title: 'Midterm Exam', value: 6.5, date: '2025-02-15' },
  //           { id: 'grade2', title: 'Lab Report 1', value: 7.0, date: '2025-01-25' },
  //           { id: 'grade3', title: 'Lab Report 2', value: 8.0, date: '2025-03-10' }
  //         ],
  //         attendance: [
  //           { id: 'att1', sessionId: 'session1', status: 'absent' },
  //           { id: 'att2', sessionId: 'session2', status: 'absent' },
  //           { id: 'att3', sessionId: 'session3', status: 'present' },
  //           { id: 'att4', sessionId: 'session4', status: 'present' },
  //           { id: 'att5', sessionId: 'session5', status: 'present' },
  //           { id: 'att6', sessionId: 'session6', status: 'present' }
  //         ]
  //       }
  //     ]
  //   },
  //   {
  //     id: 'Budcdq3sbZPIISnqRZls',
  //     sessions: [
  //       { id: 'session1', date: new Date(2025, 2, 7), startTime: '10:00', endTime: '12:00' },
  //       { id: 'session2', date: new Date(2025, 2, 14), startTime: '10:00', endTime: '12:00' },
  //       { id: 'session3', date: new Date(2025, 2, 21), startTime: '10:00', endTime: '12:00' },
  //       { id: 'session4', date: new Date(2025, 2, 28), startTime: '10:00', endTime: '12:00' }
  //     ],
  //     enrolledStudents: [
  //       {
  //         id: 'student1',
  //         name: 'Alex Johnson',
  //         email: 'alex@example.com',
  //         grades: [
  //           { id: 'grade1', title: 'Quiz 1', value: 8.0, date: '2025-02-07' },
  //           { id: 'grade2', title: 'Midterm', value: 7.5, date: '2025-02-21' }
  //         ],
  //         attendance: [
  //           { id: 'att1', sessionId: 'session1', status: 'present' },
  //           { id: 'att2', sessionId: 'session2', status: 'present' },
  //           { id: 'att3', sessionId: 'session3', status: 'absent' },
  //           { id: 'att4', sessionId: 'session4', status: 'present' }
  //         ]
  //       },
  //       {
  //         id: 'student4',
  //         name: 'Sophia Lee',
  //         email: 'sophia@example.com',
  //         grades: [
  //           { id: 'grade1', title: 'Quiz 1', value: 9.5, date: '2025-02-07' },
  //           { id: 'grade2', title: 'Midterm', value: 9.2, date: '2025-02-21' }
  //         ],
  //         attendance: [
  //           { id: 'att1', sessionId: 'session1', status: 'present' },
  //           { id: 'att2', sessionId: 'session2', status: 'present' },
  //           { id: 'att3', sessionId: 'session3', status: 'present' },
  //           { id: 'att4', sessionId: 'session4', status: 'present' }
  //         ]
  //       }
  //     ]
  //   },
  //   {
  //     id: 'yCBfdQqqdoDQp0BalGtF',
  //     sessions: [
  //       { id: 'session1', date: new Date(2025, 2, 6), startTime: '14:00', endTime: '16:00' },
  //       { id: 'session2', date: new Date(2025, 2, 13), startTime: '14:00', endTime: '16:00' },
  //       { id: 'session3', date: new Date(2025, 2, 20), startTime: '14:00', endTime: '16:00' },
  //       { id: 'session4', date: new Date(2025, 2, 27), startTime: '14:00', endTime: '16:00' }
  //     ],
  //     enrolledStudents: [
  //       {
  //         id: 'student2',
  //         name: 'Emma Wilson',
  //         email: 'emma@example.com',
  //         grades: [
  //           { id: 'grade1', title: 'Presentation', value: 10.0, date: '2025-02-13' },
  //           { id: 'grade2', title: 'Final Project', value: 9.8, date: '2025-03-27' }
  //         ],
  //         attendance: [
  //           { id: 'att1', sessionId: 'session1', status: 'present' },
  //           { id: 'att2', sessionId: 'session2', status: 'present' },
  //           { id: 'att3', sessionId: 'session3', status: 'absent' },
  //           { id: 'att4', sessionId: 'session4', status: 'present' }
  //         ]
  //       },
  //       {
  //         id: 'student5',
  //         name: 'James Taylor',
  //         email: 'james@example.com',
  //         grades: [
  //           { id: 'grade1', title: 'Presentation', value: 7.5, date: '2025-02-13' },
  //           { id: 'grade2', title: 'Final Project', value: 8.2, date: '2025-03-27' }
  //         ],
  //         attendance: [
  //           { id: 'att1', sessionId: 'session1', status: 'absent' },
  //           { id: 'att2', sessionId: 'session2', status: 'present' },
  //           { id: 'att3', sessionId: 'session3', status: 'present' },
  //           { id: 'att4', sessionId: 'session4', status: 'present' }
  //         ]
  //       }
  //     ]
  //   }
  // ];

  constructor(private store: Store, private spinner: SpinnerService) {}

  ngOnInit(): void {
    this.spinner.show();
    this.store.dispatch(CourseActions.loadCourses());
    this.store.dispatch(UserActions.loadUsers());
    this.courses$.subscribe(courses => {
      this.courseCount = courses.length;
    });
    this.users$.subscribe(users => {
      this.teachers = users.filter(user => user.role === 'Teacher');
      this.teacherCount = this.teachers.length;
      this.studentCount = users.filter(user => user.role === 'Student').length;
    });
    setTimeout(() => {
      this.spinner.hide();
    }, 300);
  }

  addCourse() {
    if (this.editingCourseId) {
      if (this.newCourse.teacherId) {
        const selectedTeacher = this.teachers.find(t => t.id === this.newCourse.teacherId);
        if (selectedTeacher) {
          this.newCourse.teacher = selectedTeacher.fullName;
        }
      }

      this.store.dispatch(CourseActions.updateCourse({
        course: { ...this.newCourse, id: this.editingCourseId }
      }));
    } else {
      if (this.newCourse.teacherId) {
        const selectedTeacher = this.teachers.find(t => t.id === this.newCourse.teacherId);
        if (selectedTeacher) {
          this.newCourse.teacher = selectedTeacher.fullName;
        }
      }

      const courseToAdd: Course = {
        ...this.newCourse,
        sessions: this.newCourse.sessions || [],
        enrolledStudents: []
      };
      this.store.dispatch(CourseActions.addCourse({
        course: courseToAdd
      }));
    }
    this.resetCourseForm();
    // this.newCourse = { name: '', teacher: '', schedule: '' };
    // this.editingCourseId = null;
  }

  editCourse(course: Course) {
    this.newCourse = { ...course };
    this.editingCourseId = course.id!;

    if (!this.newCourse.teacherId && this.newCourse.teacher) {
      const foundTeacher = this.teachers.find(t => t.fullName === this.newCourse.teacher);
      if (foundTeacher) {
        this.newCourse.teacherId = foundTeacher.id;
      }
    }
  }

  async deleteCourse(courseId: string): Promise<void> {
    const confirmed = await this.dialog.open('Do you really want to delete this course?');
    if (confirmed) {
      this.store.dispatch(CourseActions.deleteCourse({ courseId }))
    }
  }

  viewStudentData(course: Course): void {
    this.selectedCourseId = course.id;
    this.activeTab = 'grades';
  }

  async deleteUser(userId: string): Promise<void> {
    const confirmed = await this.dialog.open('Do you really want to delete this user?');
    if (confirmed) {
      this.store.dispatch(UserActions.deleteUser({ userId }))
    }
  }

  editUser(user: UserModel) {
    if(user.role === "Admin") {
      return;
    }
    this.newUser = {
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
    this.editingUserId = user.id!;
  }

  updateUser() {
    this.store.dispatch(UserActions.updateUser({
      user: { ...this.newUser, id: this.editingUserId! }
    }));
    this.resetUserForm();
    // this.newUser = { email: '', fullName: '', role: '' };
    // this.editingUserId = null;
  }

  openAddSessionModal(course: Course): void {
    this.editingSession = {
      id: uuidv4(),
      date: new Date(),
      startTime: '10:00',
      endTime: '12:00'
    };
    this.editingSessionIndex = -1;
    this.showSessionModal = true;
  }

  editSession(course: Course, sessionIndex: number): void {
    this.editingSession = { ...course.sessions![sessionIndex] };
    this.editingSessionIndex = sessionIndex;
    this.showSessionModal = true;
  }

  saveSession(): void {
    if (!this.editingCourseId) return;

    const updatedCourse = { ...this.newCourse };

    if (this.editingSessionIndex === -1) {
      updatedCourse.sessions = [...updatedCourse.sessions!, this.editingSession];
    } else {
      updatedCourse.sessions = updatedCourse.sessions!.map((session, index) =>
        index === this.editingSessionIndex ? this.editingSession : session
      );
    }

    this.newCourse = updatedCourse;
    this.closeSessionModal();
  }

  async deleteSession(sessionIndex: number): Promise<void> {
    const confirmed = await this.dialog.open('Do you really want to delete this session?');
    if(confirmed) {
      const updatedCourse = { ...this.newCourse };
      updatedCourse.sessions = updatedCourse.sessions!.filter((_, index) => index !== sessionIndex);
      this.newCourse = updatedCourse;
    }
  }

  closeSessionModal(): void {
    this.showSessionModal = false;
  }

  // getEnrolledStudents(courseId: string): EnrolledStudent[] {
  //   const course = this.courseData.find(c => c.id === courseId);
  //   return course ? course.enrolledStudents : [];
  // }

  // getGradeHeaders(courseId: string): string[] {
  //   const course = this.courseData.find(c => c.id === courseId);
  //   if (!course) return [];

  //   const allGradeTitles = new Set<string>();
  //   course.enrolledStudents.forEach(student => {
  //     student.grades.forEach(grade => {
  //       allGradeTitles.add(grade.title);
  //     });
  //   });
  //   return Array.from(allGradeTitles);
  // }

  // getStudentGrade(courseId: string, studentId: string, gradeTitle: string): number | null {
  //   const course = this.courseData.find(c => c.id === courseId);
  //   if (!course) return null;

  //   const student = course.enrolledStudents.find(s => s.id === studentId);
  //   if (!student) return null;

  //   const grade = student.grades.find(g => g.title === gradeTitle);
  //   return grade ? grade.value : null;
  // }

  // getStudentMeanGrade(courseId: string, studentId: string): string {
  //   const course = this.courseData.find(c => c.id === courseId);
  //   if (!course) return 'N/A';

  //   const student = course.enrolledStudents.find(s => s.id === studentId);
  //   if (!student || student.grades.length === 0) return 'N/A';

  //   const sum = student.grades.reduce((acc, grade) => acc + grade.value, 0);
  //   const mean = sum / student.grades.length;
  //   return mean.toFixed(1);
  // }

  // getSessionDates(courseId: string): Date[] {
  //   const course = this.courseData.find(c => c.id === courseId);
  //   if (!course) return [];

  //   return course.sessions.map(session => session.date);
  // }

  // getAttendanceStatus(courseId: string, studentId: string, sessionDate: Date): string {
  //   const course = this.courseData.find(c => c.id === courseId);
  //   if (!course) return 'N/A';

  //   const student = course.enrolledStudents.find(s => s.id === studentId);
  //   if (!student) return 'N/A';

  //   const session = course.sessions.find(s =>
  //     s.date.getFullYear() === sessionDate.getFullYear() &&
  //     s.date.getMonth() === sessionDate.getMonth() &&
  //     s.date.getDate() === sessionDate.getDate()
  //   );
  //   if (!session) return 'N/A';

  //   const attendance = student.attendance.find(a => a.sessionId === session.id);
  //   return attendance ? attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1) : 'N/A';
  // }

  // getAttendanceStatusClass(courseId: string, studentId: string, sessionDate: Date): string {
  //   const course = this.courseData.find(c => c.id === courseId);
  //   if (!course) return '';

  //   const student = course.enrolledStudents.find(s => s.id === studentId);
  //   if (!student) return '';

  //   const session = course.sessions.find(s =>
  //     s.date.getFullYear() === sessionDate.getFullYear() &&
  //     s.date.getMonth() === sessionDate.getMonth() &&
  //     s.date.getDate() === sessionDate.getDate()
  //   );
  //   if (!session) return '';

  //   const attendance = student.attendance.find(a => a.sessionId === session.id);
  //   if (!attendance) return '';

  //   switch (attendance.status) {
  //     case 'present':
  //       return 'bg-green-100 text-green-800';
  //     case 'absent':
  //       return 'bg-red-100 text-red-800';
  //     default:
  //       return '';
  //   }
  // }

  // getStudentAttendanceRate(courseId: string, studentId: string): number {
  //   const course = this.courseData.find(c => c.id === courseId);
  //   if (!course) return 0;

  //   const student = course.enrolledStudents.find(s => s.id === studentId);
  //   if (!student || student.attendance.length === 0) return 0;

  //   const presentCount = student.attendance.filter(a => a.status === 'present').length;
  //   const attendanceRate = (presentCount / student.attendance.length) * 100;
  //   return Math.round(attendanceRate);
  // }

  resetCourseForm(): void {
    this.newCourse = {
      name: '',
      teacher: '',
      schedule: '',
      teacherId: '',
      sessions: [],
      enrolledStudents: []
    };
    this.editingCourseId = null;
  }

  resetUserForm(): void {
    this.newUser = { email: '', fullName: '', role: '' };
    this.editingUserId = null;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(time: string): string {
    return time;
  }
}
