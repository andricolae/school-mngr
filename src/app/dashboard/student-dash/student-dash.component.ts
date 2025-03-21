import { Component } from '@angular/core';

@Component({
  selector: 'app-student-dash',
  imports: [],
  templateUrl: './student-dash.component.html',
  styleUrl: './student-dash.component.css'
})
export class StudentDashComponent {
  studentName = 'Emily Wang';

  enrolledCourses = [
    { name: 'Biology Basics', grade: '10', teacher: 'Frank Thompson', schedule: 'Mon & Wed 10:00' },
    { name: 'Computer Science 1', grade: '9', teacher: 'Isla Moore', schedule: 'Tue & Thu 13:00' },
    { name: 'Art & Design', grade: '9.5', teacher: 'Diana Lee', schedule: 'Fri 15:00' }
  ];

  selectedCourse: string | null = null;

  toggleView(courseName: string) {
    this.selectedCourse = this.selectedCourse === courseName ? null : courseName;
  }
}
