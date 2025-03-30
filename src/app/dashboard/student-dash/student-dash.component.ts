import { Component } from '@angular/core';
import * as UserActions from '../../state/users/user.actions';
import * as CourseActions from '../../state/courses/course.actions'
import { Store } from '@ngrx/store';
import { selectAllUsers } from '../../state/users/user.selector';
import { UserModel } from '../../core/user.model';
import { SpinnerService } from '../../core/services/spinner.service';
import { SpinnerComponent } from "../../core/spinner/spinner.component";
import { CourseEnrollmentComponent } from "./course-enrollment/course-enrollment.component";
import { DatePipe, NgClass } from '@angular/common';

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
  attended: boolean;
}

interface EnrolledCourse {
  id: string;
  name: string;
  teacher: string;
  schedule: string;
  grades: CourseGrade[];
  sessions: ClassSession[];
}

@Component({
  selector: 'app-student-dash',
  imports: [SpinnerComponent, CourseEnrollmentComponent, DatePipe, NgClass],
  templateUrl: './student-dash.component.html',
  styleUrl: './student-dash.component.css'
})
export class StudentDashComponent {
  activeTab: 'grades' | 'attendance' = 'grades';

  users$ = this.store.select(selectAllUsers);
  loggedUser: UserModel = { fullName: 'loading', role: 'loading', email: 'loading' };
  currentDate = new Date(2025, 2, 30);

  isEnrollmentModalOpen = false;
  enrolledCourseIds = ['course1', 'course3', 'course5'];

  selectedCourse: string | null = null

  commonSessions: ClassSession[] = [
    { id: 'session1', date: new Date(2025, 2, 5), startTime: '13:00', endTime: '15:00', attended: false },
    { id: 'session2', date: new Date(2025, 2, 10), startTime: '13:00', endTime: '15:00', attended: false },
    { id: 'session3', date: new Date(2025, 2, 15), startTime: '13:00', endTime: '15:00', attended: true },
    { id: 'session4', date: new Date(2025, 2, 20), startTime: '13:00', endTime: '15:00', attended: true },
    { id: 'session5', date: new Date(2025, 2, 25), startTime: '13:00', endTime: '15:00', attended: false },
    { id: 'session6', date: new Date(2025, 2, 30), startTime: '13:00', endTime: '15:00', attended: false },
    { id: 'session7', date: new Date(2025, 2, 31), startTime: '13:00', endTime: '15:00', attended: false }
  ];

  enrolledCourses: EnrolledCourse[] = [
    {
      id: 'course1',
      name: 'Biology Basics',
      teacher: 'Frank Thompson',
      schedule: 'Mon & Wed 10:00',
      grades: [
        { title: 'Midterm Exam', value: 9.5, date: '2025-02-15' },
        { title: 'Lab Report 1', value: 10, date: '2025-01-25' },
        { title: 'Lab Report 2', value: 10.5, date: '2025-03-10' }
      ],
      sessions: [...this.commonSessions]
    },
    {
      id: 'course3',
      name: 'Computer Science 1',
      teacher: 'Isla Moore',
      schedule: 'Tue & Thu 13:00',
      grades: [
        { title: 'Algorithm Quiz', value: 8.5, date: '2025-02-10' },
        { title: 'Programming Project', value: 9.5, date: '2025-03-01' }
      ],
      sessions: [...this.commonSessions]
    },
    {
      id: 'course5',
      name: 'Art & Design',
      teacher: 'Diana Lee',
      schedule: 'Fri 15:00',
      grades: [
        { title: 'Portfolio Review', value: 9.5, date: '2025-02-20' },
        { title: 'Design Theory Test', value: 9.0, date: '2025-01-30' },
        { title: 'Final Project', value: 10.0, date: '2025-03-15' }
      ],
      sessions: [...this.commonSessions]
    }
  ];

  constructor(private store: Store, private spinner: SpinnerService) {}

  ngOnInit() {
    this.spinner.show();
    this.store.dispatch(CourseActions.loadCourses());
    this.store.dispatch(UserActions.loadUsers());
    this.users$.subscribe(users => {
      this.loggedUser = users.find(user => user.email === JSON.parse(localStorage.getItem('userData')!).email)!;
    });
    setTimeout(() => {
      this.spinner.hide();
    }, 1000);
  }

  calculateMeanGrade(grades: CourseGrade[]): number {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((total, grade) => total + grade.value, 0);
    return parseFloat((sum / grades.length).toFixed(1));
  }

  toggleView(courseName: string) {
    this.selectedCourse = this.selectedCourse === courseName ? null : courseName;
  }

  openEnrollmentModal() {
    this.isEnrollmentModalOpen = true;
  }

  closeEnrollmentModal() {
    this.isEnrollmentModalOpen = false;
  }

  onEnrollmentChanged(updatedEnrollments: string[]) {
    this.enrolledCourseIds = updatedEnrollments;
    this.updateDisplayedCourses();
  }

  canJoinSession(session: ClassSession): boolean {
    const sessionDate = new Date(session.date);

    if (
      sessionDate.getDate() !== this.currentDate.getDate() ||
      sessionDate.getMonth() !== this.currentDate.getMonth() ||
      sessionDate.getFullYear() !== this.currentDate.getFullYear()
    ) {
      return false;
    }

    const now = this.currentDate;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTimeMinutes = hours * 60 + minutes;

    const [startHours, startMinutes] = session.startTime.split(':').map(Number);
    const [endHours, endMinutes] = session.endTime.split(':').map(Number);

    const startTimeMinutes = startHours * 60 + startMinutes;
    const endTimeMinutes = endHours * 60 + endMinutes;

    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
  }

  markAttendance(courseId: string, sessionId: string): void {
    this.spinner.show();

    setTimeout(() => {
      const courseIndex = this.enrolledCourses.findIndex(course => course.id === courseId);
      if (courseIndex !== -1) {
        const sessionIndex = this.enrolledCourses[courseIndex].sessions.findIndex(
          session => session.id === sessionId
        );

        if (sessionIndex !== -1) {
          this.enrolledCourses[courseIndex].sessions[sessionIndex].attended = true;
        }
      }

      this.spinner.hide();
    }, 800);
  }

  getSessionStatus(session: ClassSession): string {
    const sessionDate = new Date(session.date);
    const today = this.currentDate;

    if (session.attended) {
      return 'Present';
    }

    if (sessionDate.getTime() < today.setHours(0, 0, 0, 0)) {
      return 'Absent';
    }

    if (this.canJoinSession(session)) {
      return 'Join Now';
    }

    return 'Upcoming';
  }

  getAttendanceCount(course: EnrolledCourse): number {
    return course.sessions.filter(s => s.attended).length;
  }
  getAbsenceCount(course: EnrolledCourse): number {
    return course.sessions.filter(s => !s.attended && new Date(s.date) < this.currentDate && this.getSessionStatus(s) === 'Absent').length;
  }

  getAttendanceRate(course: EnrolledCourse): number {
    return (this.getAttendanceCount(course) / (this.getAttendanceCount(course) + this.getAbsenceCount(course)) * 100);
  }
  getSessionStatusClass(session: ClassSession): string {
    const status = this.getSessionStatus(session);

    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      case 'Join Now':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  private updateDisplayedCourses() {
    const allCourses: EnrolledCourse[] = [
      {
        id: 'course1',
        name: 'Biology Basics',
        teacher: 'Frank Thompson',
        schedule: 'Mon & Wed 10:00',
        grades: [
          { title: 'Midterm Exam', value: 9.5, date: '2025-02-15' },
          { title: 'Lab Report 1', value: 10, date: '2025-01-25' },
          { title: 'Lab Report 2', value: 10.5, date: '2025-03-10' }
        ],
        sessions: [...this.commonSessions]
      },
      {
        id: 'course2',
        name: 'Mathematics 101',
        teacher: 'Sarah Johnson',
        schedule: 'Mon & Fri 9:00',
        grades: [],
        sessions: [...this.commonSessions]
      },
      {
        id: 'course3',
        name: 'Computer Science 1',
        teacher: 'Isla Moore',
        schedule: 'Tue & Thu 13:00',
        grades: [
          { title: 'Algorithm Quiz', value: 8.5, date: '2025-02-10' },
          { title: 'Programming Project', value: 9.5, date: '2025-03-01' }
        ],
        sessions: [...this.commonSessions]
      },
      {
        id: 'course4',
        name: 'Physics Fundamentals',
        teacher: 'Robert Chen',
        schedule: 'Wed & Fri 11:00',
        grades: [],
        sessions: [...this.commonSessions]
      },
      {
        id: 'course5',
        name: 'Art & Design',
        teacher: 'Diana Lee',
        schedule: 'Fri 15:00',
        grades: [
          { title: 'Portfolio Review', value: 9.5, date: '2025-02-20' },
          { title: 'Design Theory Test', value: 9.0, date: '2025-01-30' },
          { title: 'Final Project', value: 10.0, date: '2025-03-15' }
        ],
        sessions: [...this.commonSessions]
      },
      {
        id: 'course6',
        name: 'History of Europe',
        teacher: 'Michael Brown',
        schedule: 'Tue 14:00',
        grades: [],
        sessions: [...this.commonSessions]
      }
    ];

    this.enrolledCourses = allCourses
      .filter(course => this.enrolledCourseIds.includes(course.id));
  }
}
