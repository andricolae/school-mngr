import { Course } from './../../core/user.model';
import * as CourseActions from '../../state/courses/course.actions';
import { Store } from '@ngrx/store';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { selectAllCourses } from '../../state/courses/course.selector';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { SpinnerComponent } from '../../core/spinner/spinner.component';
import { SpinnerService } from '../../core/services/spinner.service';
import { ConfirmationDialogComponent } from "../../core/confirmation-dialog/confirmation-dialog.component";

@Component({
  selector: 'app-admin-dash',
  standalone: true,
  imports: [FormsModule, AsyncPipe, SpinnerComponent, ConfirmationDialogComponent],
  templateUrl: './admin-dash.component.html',
})
export class AdminDashComponent {
  users = [
    { id: 1, name: 'Alice Johnson', role: 'Teacher' },
    { id: 2, name: 'Brian Smith', role: 'Student' },
    { id: 3, name: 'Carlos Rivera', role: 'Student' },
    { id: 4, name: 'Diana Lee', role: 'Teacher' },
    { id: 5, name: 'Emily Wang', role: 'Student' },
  ];

  @ViewChild('dialog') dialog!: ConfirmationDialogComponent;

  courseCount = 0;

  newUser = { name: '', role: '' };

  newCourse: Course = {name: '', teacher: '', schedule: ''};

  courses$ = this.store.select(selectAllCourses);

  editingCourseId: string | null = null;

  constructor(private store: Store, private router: Router, private spinner: SpinnerService){}

  ngOnInit(): void {
    this.spinner.show();
    this.store.dispatch(CourseActions.loadCourses());
    this.courses$.subscribe(courses => {
      this.courseCount = courses.length;
      setTimeout(() => {
        this.spinner.hide();
      }, 200);
    });

  }

  get teachers() {
    return this.users.filter((u) => u.role === 'Teacher');
  }

  get students() {
    return this.users.filter((u) => u.role === 'Student');
  }

  deleteUser(id: number) {
    this.users = this.users.filter((u) => u.id !== id);
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

  editCourse(course: Course) {
    this.newCourse = {
      name: course.name,
      teacher: course.teacher,
      schedule: course.schedule
    };
    this.editingCourseId = course.id!;
  }

  async deleteCourse(courseId: string) {
    const confirmed = await this.dialog.open('Do you really want to delete this course?');
    if (confirmed) {
      this.store.dispatch(CourseActions.deleteCourse({ courseId }))
    }
  }
}
