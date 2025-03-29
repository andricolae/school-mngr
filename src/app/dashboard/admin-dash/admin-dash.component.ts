import { Course, UserModel } from './../../core/user.model';
import * as CourseActions from '../../state/courses/course.actions';
import * as UserActions from '../../state/users/user.actions';
import { Store } from '@ngrx/store';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { selectAllCourses } from '../../state/courses/course.selector';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { SpinnerComponent } from '../../core/spinner/spinner.component';
import { SpinnerService } from '../../core/services/spinner.service';
import { ConfirmationDialogComponent } from "../../core/confirmation-dialog/confirmation-dialog.component";
import { selectAllUsers } from '../../state/users/user.selector';

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

  newCourse: Course = {name: '', teacher: '', schedule: ''};

  users$ = this.store.select(selectAllUsers);
  courses$ = this.store.select(selectAllCourses);

  editingCourseId: string | null = null;
  editingUserId: string | null = null;

  constructor(private store: Store, private router: Router, private spinner: SpinnerService){}

  ngOnInit(): void {
    this.spinner.show();
    this.store.dispatch(CourseActions.loadCourses());
    this.store.dispatch(UserActions.loadUsers());
    this.courses$.subscribe(courses => {
      this.courseCount = courses.length;
    });
    this.users$.subscribe(users => {
      this.teacherCount = users.filter(user => user.role === 'Teacher').length;
      this.studentCount = users.filter(user => user.role === 'Student').length;
    });
    setTimeout(() => {
      this.spinner.hide();
    }, 300);
  }

  async deleteUser(userId: string) {
    const confirmed = await this.dialog.open('Do you really want to delete this user?');
    if (confirmed) {
      this.store.dispatch(UserActions.deleteUser({ userId }))
    }
  }

  addCourse() {
    if (this.editingCourseId) {
      this.store.dispatch(CourseActions.updateCourse({
        course: { ...this.newCourse, id: this.editingCourseId }
      }));
    } else {
      this.store.dispatch(CourseActions.addCourse({
        course: this.newCourse
      }));
    }

    this.newCourse = { name: '', teacher: '', schedule: '' };
    this.editingCourseId = null;
  }

  updateUser() {
    this.store.dispatch(UserActions.updateUser({
      user: { ...this.newUser, id: this.editingUserId! }
    }));
    this.newUser = { email: '', fullName: '', role: '' };
    this.editingUserId = null;
  }

  editCourse(course: Course) {
    this.newCourse = {
      name: course.name,
      teacher: course.teacher,
      schedule: course.schedule
    };
    this.editingCourseId = course.id!;
  }

  editUser(user: UserModel) {
    if(user.role === "admin") {
      return;
    }
    this.newUser = {
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
    this.editingUserId = user.id!;
  }

  async deleteCourse(courseId: string) {
    const confirmed = await this.dialog.open('Do you really want to delete this course?');
    if (confirmed) {
      this.store.dispatch(CourseActions.deleteCourse({ courseId }))
    }
  }
}
