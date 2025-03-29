import { Component } from '@angular/core';
import * as UserActions from '../../state/users/user.actions';
import * as CourseActions from '../../state/courses/course.actions'
import { Store } from '@ngrx/store';
import { selectAllUsers } from '../../state/users/user.selector';
import { UserModel } from '../../core/user.model';
import { SpinnerService } from '../../core/services/spinner.service';
import { SpinnerComponent } from "../../core/spinner/spinner.component";

@Component({
  selector: 'app-student-dash',
  imports: [SpinnerComponent],
  templateUrl: './student-dash.component.html',
  styleUrl: './student-dash.component.css'
})
export class StudentDashComponent {
  users$ = this.store.select(selectAllUsers);
  loggedUser: UserModel = { fullName: 'loading', role: 'loading', email: 'loading' };

  isEnrollmentModalOpen = false;
  enrolledCourseIds: string[] = [];

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

  onEnrollmentChanged() {
    this.store.dispatch(UserActions.loadUsers());
  }
}
