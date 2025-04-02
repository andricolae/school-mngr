import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Course } from '../../../core/user.model';
import * as CourseSelectors from '../../../state/courses/course.selector';
import * as CourseActions from '../../../state/courses/course.actions';
import { SpinnerComponent } from '../../../core/spinner/spinner.component';
import { SpinnerService } from '../../../core/services/spinner.service';

@Component({
  selector: 'app-course-enrollment',
  imports: [CommonModule, SpinnerComponent],
  templateUrl: './course-enrollment.component.html',
  styleUrl: './course-enrollment.component.css'
})
export class CourseEnrollmentComponent {
  @Input() studentId!: string;
  @Input() enrolledCourseIds: string[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() enrollmentChanged = new EventEmitter<string[]>();

  // availableCourses = [
  //   { id: 'course1', name: 'Biology Basics', teacher: 'Frank Thompson', schedule: 'Mon & Wed 10:00' },
  //   { id: 'course2', name: 'Mathematics 101', teacher: 'Sarah Johnson', schedule: 'Mon & Fri 9:00' },
  //   { id: 'course3', name: 'Computer Science 1', teacher: 'Isla Moore', schedule: 'Tue & Thu 13:00' },
  //   { id: 'course4', name: 'Physics Fundamentals', teacher: 'Robert Chen', schedule: 'Wed & Fri 11:00' },
  //   { id: 'course5', name: 'Art & Design', teacher: 'Diana Lee', schedule: 'Fri 15:00' },
  //   { id: 'course6', name: 'History of Europe', teacher: 'Michael Brown', schedule: 'Tue 14:00' }
  // ];

  availableCourses$: Observable<Course[]> = this.store.select(CourseSelectors.selectAvailableCourses);
  loading$ = this.store.select(CourseSelectors.selectCoursesLoading);
  error$ = this.store.select(CourseSelectors.selectCoursesError);

  isLoading = false;

  constructor(
    private store: Store,
    private spinner: SpinnerService
  ) {}

  ngOnInit() {
    this.store.dispatch(CourseActions.loadCourses());
  }

  isEnrolled(courseId: string): boolean {
    return this.enrolledCourseIds.includes(courseId);
  }

  toggleEnrollment(course: Course): void {
    if (!this.studentId || !course.id) return;

    this.spinner.show();
    this.isLoading = true;

    setTimeout(() => {
      let updatedEnrollments: string[];

      if (this.isEnrolled(course.id!)) {
        this.store.dispatch(CourseActions.unenrollStudent({
          courseId: course.id!,
          studentId: this.studentId
        }));
        updatedEnrollments = this.enrolledCourseIds.filter(id => id !== course.id);
      } else {
        this.store.dispatch(CourseActions.enrollStudent({
          courseId: course.id!,
          studentId: this.studentId
        }));
        updatedEnrollments = [...this.enrolledCourseIds!, course.id!];
      }

      this.spinner.hide();
      this.isLoading = false;

      this.enrollmentChanged.emit(updatedEnrollments);
    }, 500);
  }

  close() {
    this.closeModal.emit();
  }

  formatSessionDates(course: Course): string {
    if (!course.sessions || course.sessions.length === 0) {
      return 'No sessions scheduled';
    }

    const sortedSessions = [...course.sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const displaySessions = sortedSessions.slice(0, 3);

    return displaySessions.map(session => {
      const date = new Date(session.date);
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${session.startTime}-${session.endTime}`;
    }).join(', ') + (sortedSessions.length > 3 ? ' + more' : '');
  }

  getEnrollmentStatus(course: Course): { text: string; color: string } {
    return { text: 'Open', color: 'green' };
  }
}
