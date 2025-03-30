import { Component } from '@angular/core';
import { UserModel } from '../../core/user.model';
import * as UserActions from '../../state/users/user.actions';
import * as CourseActions from '../../state/courses/course.actions'
import { Store } from '@ngrx/store';
import { selectAllUsers } from '../../state/users/user.selector';
import { SpinnerService } from '../../core/services/spinner.service';
import { SpinnerComponent } from "../../core/spinner/spinner.component";

@Component({
  selector: 'app-teacher-dash',
  standalone: true,
  templateUrl: './teacher-dash.component.html',
  styleUrl: './teacher-dash.component.css',
  imports: [SpinnerComponent],
})
export class TeacherDashComponent {
  teacherName = 'Diana Lee';

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

  students = [
    { name: 'Brian Smith', status: 'Present', grade: '10' },
    { name: 'Carlos Rivera', status: 'Absent', grade: '8' },
    { name: 'Emily Wang', status: 'Present', grade: '9' },
    { name: 'Grace Kim', status: 'Present', grade: '9.5' },
    { name: 'Henry Patel', status: 'Absent', grade: '8.5' },
    { name: 'Jack Nguyen', status: 'Present', grade: '7' }
  ];

  myCourses: any[] = [];
  selectedAttendanceCourse: string | null = null;
  selectedGradesCourse: string | null = null;
  users$ = this.store.select(selectAllUsers);
  loggedUser: UserModel = { fullName: 'loading', role: 'loading', email: 'loading' };

  constructor(private store: Store, private spinner: SpinnerService) {}
  ngOnInit() {
    setTimeout(() => {
      this.myCourses = this.allCourses
        .filter(course => course.teacher === this.teacherName)
        .map(course => ({
          ...course,
          enrolled: this.students.length,
          students: this.students.map(student => ({ ...student }))
        }));
    });

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

  toggleAttendance(courseName: string) {
    this.selectedAttendanceCourse = this.selectedAttendanceCourse === courseName ? null : courseName;
  }

  toggleGrades(courseName: string) {
    this.selectedGradesCourse = this.selectedGradesCourse === courseName ? null : courseName;
  }

  markAttendance(course: any, student: any) {
    student.status = student.status === 'Present' ? 'Absent' : 'Present';
  }

  updateGrade(course: any, student: any, event: any) {
    student.grade = event.target.value;
  }
}
