import { Component } from '@angular/core';
import * as UserActions from '../../state/users/user.actions';
import * as CourseActions from '../../state/courses/course.actions'
import { Store } from '@ngrx/store';
import { selectAllUsers } from '../../state/users/user.selector';
import { UserModel } from '../../core/user.model';
import { SpinnerService } from '../../core/services/spinner.service';
import { SpinnerComponent } from "../../core/spinner/spinner.component";
import { CourseEnrollmentComponent } from "./course-enrollment/course-enrollment.component";

@Component({
  selector: 'app-student-dash',
  imports: [SpinnerComponent, CourseEnrollmentComponent],
  templateUrl: './student-dash.component.html',
  styleUrl: './student-dash.component.css'
})
export class StudentDashComponent {
  users$ = this.store.select(selectAllUsers);
  loggedUser: UserModel = { fullName: 'loading', role: 'loading', email: 'loading' };

  isEnrollmentModalOpen = false;
  enrolledCourseIds = ['course1', 'course3', 'course5'];

  selectedCourse: string | null = null

  enrolledCourses = [
    { name: 'Biology Basics', grade: '10', teacher: 'Frank Thompson', schedule: 'Mon & Wed 10:00' },
    { name: 'Computer Science 1', grade: '9', teacher: 'Isla Moore', schedule: 'Tue & Thu 13:00' },
    { name: 'Art & Design', grade: '9.5', teacher: 'Diana Lee', schedule: 'Fri 15:00' }
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

  private updateDisplayedCourses() {
    const allCourses = [
      { id: 'course1', name: 'Biology Basics', grade: '10', teacher: 'Frank Thompson', schedule: 'Mon & Wed 10:00' },
      { id: 'course2', name: 'Mathematics 101', grade: '', teacher: 'Sarah Johnson', schedule: 'Mon & Fri 9:00' },
      { id: 'course3', name: 'Computer Science 1', grade: '9', teacher: 'Isla Moore', schedule: 'Tue & Thu 13:00' },
      { id: 'course4', name: 'Physics Fundamentals', grade: '', teacher: 'Robert Chen', schedule: 'Wed & Fri 11:00' },
      { id: 'course5', name: 'Art & Design', grade: '9.5', teacher: 'Diana Lee', schedule: 'Fri 15:00' },
      { id: 'course6', name: 'History of Europe', grade: '', teacher: 'Michael Brown', schedule: 'Tue 14:00' }
    ];

    this.enrolledCourses = allCourses
      .filter(course => this.enrolledCourseIds.includes(course.id))
      .map(course => ({
        ...course,
        grade: course.grade || 'Not graded yet'
      }));
  }
}
