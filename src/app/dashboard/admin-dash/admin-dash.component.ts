import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dash',
  standalone: true,
  imports: [FormsModule],
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

  newUser = { name: '', role: '' };
  newCourse = { name: '', teacher: '' };

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
    this.courses = this.courses.filter((c) => c.id !== id);
  }
}
