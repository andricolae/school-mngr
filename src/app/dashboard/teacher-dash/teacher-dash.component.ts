import { Component } from '@angular/core';
import { UserModel } from '../../core/user.model';
import * as UserActions from '../../state/users/user.actions';
import * as CourseActions from '../../state/courses/course.actions'
import { Store } from '@ngrx/store';
import { selectAllUsers } from '../../state/users/user.selector';
import { SpinnerService } from '../../core/services/spinner.service';
import { SpinnerComponent } from "../../core/spinner/spinner.component";
import { v4 as uuidv4 } from 'uuid';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CourseGrade {
  id: string;
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

interface StudentAttendance {
  sessionId: string;
  present: boolean;
}

interface Student {
  id: string;
  name: string;
  grades: CourseGrade[];
  attendance: StudentAttendance[];
}

interface TeacherCourse {
  id: string;
  name: string;
  schedule: string;
  students: Student[];
  sessions: ClassSession[];
}

interface NewGradeForm {
  courseId: string | null;
  studentId: string | null;
  title: string;
  value: number;
  date: string;
}

@Component({
  selector: 'app-teacher-dash',
  standalone: true,
  templateUrl: './teacher-dash.component.html',
  styleUrl: './teacher-dash.component.css',
  imports: [SpinnerComponent, NgClass, DatePipe, FormsModule],
})
export class TeacherDashComponent {
  teacherName = 'Diana Lee';
  activeTab: 'grades' | 'attendance' = 'grades';
  selectedCourse: string | null = null;
  isAddGradeModalOpen = false;
  currentDate = new Date();

  newGrade: NewGradeForm = {
    courseId: null,
    studentId: null,
    title: '',
    value: 0,
    date: new Date().toISOString().split('T')[0]
  };

  commonSessions: ClassSession[] = [
    { id: 'session1', date: new Date(2025, 2, 5), startTime: '13:00', endTime: '15:00' },
    { id: 'session2', date: new Date(2025, 2, 10), startTime: '13:00', endTime: '15:00' },
    { id: 'session3', date: new Date(2025, 2, 15), startTime: '13:00', endTime: '15:00' },
    { id: 'session4', date: new Date(2025, 2, 20), startTime: '13:00', endTime: '15:00' },
    { id: 'session5', date: new Date(2025, 2, 25), startTime: '13:00', endTime: '15:00' },
    { id: 'session6', date: new Date(2025, 2, 30), startTime: '16:00', endTime: '17:00' },
    { id: 'session7', date: new Date(2025, 2, 31), startTime: '13:00', endTime: '15:00' }
  ];

  myCourses: TeacherCourse[] = [];

  allCourses = [
    { name: 'Mathematics 101', teacher: 'Alice Johnson' },
    { name: 'English Literature', teacher: 'Diana Lee' },
    { name: 'Biology Basics', teacher: 'Frank Thompson' },
    { name: 'World History', teacher: 'Isla Moore' },
    { name: 'Physics for Beginners', teacher: 'Alice Johnson' },
    { name: 'Art & Design', teacher: 'Diana Lee' },
    { name: 'Chemistry Lab', teacher: 'Frank Thompson' },
    { name: 'Computer Science 1', teacher: 'Isla Moore' }
  ];

  baseStudents = [
    { name: 'Brian Smith', grade: '10' },
    { name: 'Carlos Rivera', grade: '8' },
    { name: 'Emily Wang', grade: '9' },
    { name: 'Grace Kim', grade: '9.5' },
    { name: 'Henry Patel', grade: '8.5' },
    { name: 'Jack Nguyen', grade: '7' }
  ];

  selectedAttendanceCourse: string | null = null;
  selectedGradesCourse: string | null = null;
  users$ = this.store.select(selectAllUsers);
  loggedUser: UserModel = { fullName: 'loading', role: 'loading', email: 'loading' };

  constructor(private store: Store, private spinner: SpinnerService) {}
  ngOnInit() {
    this.spinner.show();
    this.loadDummyData();

    this.store.dispatch(CourseActions.loadCourses());
    this.store.dispatch(UserActions.loadUsers());

    this.users$.subscribe(users => {
      this.loggedUser = users.find(user => user.email === JSON.parse(localStorage.getItem('userData')!).email)!;
    });
    setTimeout(() => {
      this.spinner.hide();
    }, 1000);
  }

  get selectedCourseObj(): TeacherCourse | undefined {
    return this.myCourses.find(course => course.name === this.selectedCourse);
  }

  loadDummyData() {
    const students: Student[] = [
      {
        id: 'student1',
        name: 'Brian Smith',
        grades: [
          { id: 'grade1', title: 'Midterm Exam', value: 9.0, date: '2025-02-15' },
          { id: 'grade2', title: 'Design Theory Test', value: 7.5, date: '2025-01-30' }
        ],
        attendance: []
      },
      {
        id: 'student2',
        name: 'Emily Wang',
        grades: [
          { id: 'grade3', title: 'Midterm Exam', value: 9.5, date: '2025-02-15' },
          { id: 'grade4', title: 'Design Theory Test', value: 8.5, date: '2025-01-30' }
        ],
        attendance: []
      },
      {
        id: 'student3',
        name: 'Carlos Rivera',
        grades: [
          { id: 'grade5', title: 'Midterm Exam', value: 7.0, date: '2025-02-15' },
          { id: 'grade6', title: 'Design Theory Test', value: 6.5, date: '2025-01-30' }
        ],
        attendance: []
      },
      {
        id: 'student4',
        name: 'Grace Kim',
        grades: [
          { id: 'grade7', title: 'Midterm Exam', value: 8.0, date: '2025-02-15' },
          { id: 'grade8', title: 'Design Theory Test', value: 9.0, date: '2025-01-30' }
        ],
        attendance: []
      }
    ];

    students.forEach(student => {
      this.commonSessions.forEach(session => {
        student.attendance.push({
          sessionId: session.id,
          present: Math.random() > 0.2
        });
      });
    });

    this.myCourses = [
      {
        id: 'course1',
        name: 'Art & Design',
        schedule: 'Fri 15:00',
        students: JSON.parse(JSON.stringify(students)),
        sessions: JSON.parse(JSON.stringify(this.commonSessions))
      },
      {
        id: 'course2',
        name: 'English Literature',
        schedule: 'Mon & Wed 14:00',
        students: JSON.parse(JSON.stringify(students)),
        sessions: JSON.parse(JSON.stringify(this.commonSessions))
      }
    ];
  }

  toggleView(courseName: string) {
    this.selectedCourse = this.selectedCourse === courseName ? null : courseName;
  }

  calculateMeanGrade(grades: CourseGrade[]): number {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((total, grade) => total + grade.value, 0);
    return parseFloat((sum / grades.length).toFixed(1));
  }

  isStudentPresent(student: Student, session: ClassSession): boolean {
    const attendanceRecord = student.attendance.find(a => a.sessionId === session.id);
    return attendanceRecord ? attendanceRecord.present : false;
  }

  getAttendanceStatus(student: Student, session: ClassSession): string {
    return this.isStudentPresent(student, session) ? 'Present' : 'Absent';
  }

  getAttendanceStatusClass(student: Student, session: ClassSession): string {
    return this.isStudentPresent(student, session)
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  }

  toggleAttendance(courseId: string, studentId: string, sessionId: string): void {
    this.spinner.show();

    setTimeout(() => {
      const courseIndex = this.myCourses.findIndex(course => course.id === courseId);
      if (courseIndex !== -1) {
        const studentIndex = this.myCourses[courseIndex].students.findIndex(
          student => student.id === studentId
        );

        if (studentIndex !== -1) {
          const student = this.myCourses[courseIndex].students[studentIndex];
          const attendanceIndex = student.attendance.findIndex(a => a.sessionId === sessionId);

          if (attendanceIndex !== -1) {
            student.attendance[attendanceIndex].present = !student.attendance[attendanceIndex].present;
          } else {
            student.attendance.push({ sessionId, present: true });
          }
        }
      }

      this.spinner.hide();
    }, 800);
  }

  openAddGradeModal(course: TeacherCourse) {
    this.newGrade = {
      courseId: course.id,
      studentId: null,
      title: '',
      value: 0,
      date: new Date().toISOString().split('T')[0]
    };
    this.isAddGradeModalOpen = true;
  }

  closeAddGradeModal() {
    this.isAddGradeModalOpen = false;
  }

  isNewGradeValid(): boolean {
    return this.newGrade.studentId !== null &&
      this.newGrade.title.trim() !== '' &&
      this.newGrade.value >= 0 &&
      this.newGrade.value <= 10;
  }

  saveNewGrade() {
    if (!this.isNewGradeValid() || !this.newGrade.courseId) {
      return;
    }

    this.spinner.show();

    setTimeout(() => {
      const courseIndex = this.myCourses.findIndex(course => course.id === this.newGrade.courseId);
      if (courseIndex !== -1 && this.newGrade.studentId) {
        const studentIndex = this.myCourses[courseIndex].students.findIndex(
          student => student.id === this.newGrade.studentId
        );

        if (studentIndex !== -1) {
          this.myCourses[courseIndex].students[studentIndex].grades.push({
            id: uuidv4(),
            title: this.newGrade.title,
            value: this.newGrade.value,
            date: this.newGrade.date
          });
        }
      }

      this.closeAddGradeModal();
      this.spinner.hide();
    }, 800);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // toggleGrades(courseName: string) {
  //   this.selectedGradesCourse = this.selectedGradesCourse === courseName ? null : courseName;
  // }

  // markAttendance(course: any, student: any) {
  //   student.status = student.status === 'Present' ? 'Absent' : 'Present';
  // }

  // updateGrade(course: any, student: any, event: any) {
  //   student.grade = event.target.value;
  // }
}
