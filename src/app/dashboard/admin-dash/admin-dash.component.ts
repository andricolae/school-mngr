import { Course } from './../../core/user.model';
import * as CourseActions from '../../state/courses/course.actions';
import { Store } from '@ngrx/store';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { selectAllCourses } from '../../state/courses/course.selector';
import { CourseService } from '../../core/services/course.service';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-admin-dash',
  standalone: true,
  imports: [FormsModule, AsyncPipe],
  templateUrl: './admin-dash.component.html',
})
export class AdminDashComponent {
  users = [
    { id: 1, name: 'Alice Johnson', role: 'Teacher' },
    { id: 2, name: 'Brian Smith', role: 'Student' },
    { id: 3, name: 'Carlos Rivera', role: 'Student' },
    { id: 4, name: 'Diana Lee', role: 'Teacher' },
    { id: 5, name: 'Emily Wang', role: 'Student' },
    { id: 6, name: 'Frank Thompson', role: 'Teacher' },
    { id: 7, name: 'Grace Kim', role: 'Student' },
    { id: 8, name: 'Henry Patel', role: 'Student' },
    { id: 9, name: 'Isla Moore', role: 'Teacher' },
    { id: 10, name: 'Jack Nguyen', role: 'Student' },
  ];

  newUser = { name: '', role: '' };

  newCourse: Course = {name: '', teacher: '', schedule: ''};

  courses$ = this.store.select(selectAllCourses);

  editingCourseId: string | null = null;

  constructor(private store: Store, private router: Router){}

  ngOnInit(): void {
    this.store.dispatch(CourseActions.loadCourses());
  }

  get teachers() {
    return this.users.filter((u) => u.role === 'Teacher');
  }

  get students() {
    return this.users.filter((u) => u.role === 'Student');
  }

  addUser() {
    if (this.newUser.name && this.newUser.role) {
      this.users.push({
        id: this.users.length + 1,
        name: this.newUser.name,
        role: this.newUser.role,
      });
      this.newUser = { name: '', role: '' };
    }
  }

  deleteUser(id: number) {
    this.users = this.users.filter((u) => u.id !== id);
  }

  // addCourse() {
  //   this.store.dispatch(CourseActions.addCourse({
  //     course: this.newCourse
  //   }));
  //   this.newCourse = {
  //     name: '',
  //     teacher: '',
  //     schedule: ''
  //   };
  // }

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

  editCourse(course: Course) {
    this.newCourse = {
      name: course.name,
      teacher: course.teacher,
      schedule: course.schedule
    };
    this.editingCourseId = course.id!;
  }

  deleteCourse(courseId: string) {
    this.store.dispatch(CourseActions.deleteCourse({ courseId }))
  }
}
