import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-course-mgmt',
  imports: [FormsModule],
  templateUrl: './course-mgmt.component.html',
  styleUrl: './course-mgmt.component.css'
})
export class CourseMgmtComponent {
  courses = [
    { id: 1, name: 'Mathematics 101', teacher: 'Alice Johnson' },
    { id: 2, name: 'English Literature', teacher: 'Diana Lee' },
    { id: 3, name: 'Biology Basics', teacher: 'Frank Thompson' },
    { id: 4, name: 'World History', teacher: 'Isla Moore' },
    { id: 5, name: 'Physics for Beginners', teacher: 'Alice Johnson' },
    { id: 6, name: 'Art & Design', teacher: 'Diana Lee' },
    { id: 7, name: 'Chemistry Lab', teacher: 'Frank Thompson' },
    { id: 8, name: 'Computer Science 1', teacher: 'Isla Moore' },
  ];

  newCourse = { name: '', teacher: '' };

  addCourse() {
    if (this.newCourse.name && this.newCourse.teacher) {
      this.courses.push({
        id: this.courses.length + 1,
        name: this.newCourse.name,
        teacher: this.newCourse.teacher,
      });
      this.newCourse = { name: '', teacher: '' };
    }
  }

  deleteCourse(id: number) {
    this.courses = this.courses.filter(course => course.id !== id);
  }
}
