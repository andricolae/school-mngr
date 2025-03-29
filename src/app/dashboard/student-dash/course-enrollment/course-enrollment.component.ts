import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-course-enrollment',
  imports: [],
  templateUrl: './course-enrollment.component.html',
  styleUrl: './course-enrollment.component.css'
})
export class CourseEnrollmentComponent {
  @Input() enrolledCourseIds: string[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() enrollmentChanged = new EventEmitter<string[]>();

  availableCourses = [
    { id: 'course1', name: 'Biology Basics', teacher: 'Frank Thompson', schedule: 'Mon & Wed 10:00' },
    { id: 'course2', name: 'Mathematics 101', teacher: 'Sarah Johnson', schedule: 'Mon & Fri 9:00' },
    { id: 'course3', name: 'Computer Science 1', teacher: 'Isla Moore', schedule: 'Tue & Thu 13:00' },
    { id: 'course4', name: 'Physics Fundamentals', teacher: 'Robert Chen', schedule: 'Wed & Fri 11:00' },
    { id: 'course5', name: 'Art & Design', teacher: 'Diana Lee', schedule: 'Fri 15:00' },
    { id: 'course6', name: 'History of Europe', teacher: 'Michael Brown', schedule: 'Tue 14:00' }
  ];

  isLoading = false;

  isEnrolled(courseId: string): boolean {
    return this.enrolledCourseIds.includes(courseId);
  }

  toggleEnrollment(courseId: string) {
    this.isLoading = true;

    setTimeout(() => {
      let updatedEnrollments: string[];

      if (this.isEnrolled(courseId)) {
        updatedEnrollments = this.enrolledCourseIds.filter(id => id !== courseId);
      } else {
        updatedEnrollments = [...this.enrolledCourseIds, courseId];
      }

      this.isLoading = false;
      this.enrollmentChanged.emit(updatedEnrollments);
    }, 500);
  }

  close() {
    this.closeModal.emit();
  }
}
