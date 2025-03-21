import { Component } from '@angular/core';

@Component({
  selector: 'app-teacher-dash',
  standalone: true,
  templateUrl: './teacher-dash.component.html',
  styleUrl: './teacher-dash.component.css',
})
export class TeacherDashComponent {
  teacherName = 'Diana Lee';

  allCourses = [
    { name: 'Mathematics 101', teacher: 'Alice Johnson' },
    { name: 'English Literature', teacher: 'Diana Lee' },
    { name: 'Biology Basics', teacher: 'Frank Thompson' },
    { name: 'World History', teacher: 'Isla Moore' },
    { name: 'Physics for Beginners', teacher: 'Alice Johnson' },
    { name: 'Art & Design', teacher: 'Diana Lee' },
    { name: 'Chemistry Lab', teacher: 'Frank Thompson' },
    { name: 'Computer Science 1', teacher: 'Isla Moore' }
  ];

  baseStudents = [
    { name: 'Brian Smith', grade: '10' },
    { name: 'Carlos Rivera', grade: '8' },
    { name: 'Emily Wang', grade: '9' },
    { name: 'Grace Kim', grade: '9.5' },
    { name: 'Henry Patel', grade: '8.5' },
    { name: 'Jack Nguyen', grade: '7' }
  ];

  myCourses: any[] = [];
  selectedAttendanceCourse: string | null = null;
  selectedGradesCourse: string | null = null;

  ngOnInit() {
    this.myCourses = this.allCourses
      .filter(course => course.teacher === this.teacherName)
      .map(course => ({
        ...course,
        enrolled: this.baseStudents.length,
        students: this.baseStudents.map(student => ({
          ...student,
          attendance: Array(15).fill(false)
        }))
      }));
  }

  toggleAttendance(courseName: string) {
    this.selectedAttendanceCourse = this.selectedAttendanceCourse === courseName ? null : courseName;
  }

  toggleGrades(courseName: string) {
    this.selectedGradesCourse = this.selectedGradesCourse === courseName ? null : courseName;
  }

  toggleSession(course: any, student: any, index: number) {
    student.attendance[index] = !student.attendance[index];
  }

  updateGrade(course: any, student: any, event: any) {
    student.grade = event.target.value;
  }
}
