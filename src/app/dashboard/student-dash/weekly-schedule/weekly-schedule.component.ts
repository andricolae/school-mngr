import { Component, Input, SimpleChanges } from '@angular/core';
import { CourseSession } from '../../../core/user.model';

interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: string;
  isToday: boolean;
  sessions: WeekSession[];
}

interface WeekSession {
  id: string;
  courseId: string;
  courseName: string;
  startTime: string;
  endTime: string;
  teacherName: string;
}

@Component({
  selector: 'app-weekly-schedule',
  imports: [],
  templateUrl: './weekly-schedule.component.html',
  styleUrl: './weekly-schedule.component.css'
})
export class WeeklyScheduleComponent {
  @Input() enrolledCourses: any[] = [];

  weekDays: WeekDay[] = [];
  today = new Date();
  startOfWeek!: Date;
  endOfWeek!: Date;

  constructor() {
    this.initializeWeek();
  }

  ngOnInit(): void {
    this.generateWeekSchedule();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['enrolledCourses']) {
      this.generateWeekSchedule();
    }
  }

  initializeWeek(): void {
    const now = new Date();

    const startDay = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1);
    this.startOfWeek = new Date(now.setDate(startDay));
    this.startOfWeek.setHours(0, 0, 0, 0);

    now.setHours(0, 0, 0, 0);
    this.today = new Date(now);

    this.endOfWeek = new Date(this.startOfWeek);
    this.endOfWeek.setDate(this.startOfWeek.getDate() + 6);
    this.endOfWeek.setHours(23, 59, 59, 999);

    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(this.startOfWeek);
      currentDate.setDate(this.startOfWeek.getDate() + i);

      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = currentDate.getDate().toString();
      const isToday = this.isDateToday(currentDate);

      this.weekDays.push({
        date: currentDate,
        dayName,
        dayNumber,
        isToday,
        sessions: []
      });
    }
  }

  generateWeekSchedule(): void {
    this.weekDays.forEach(day => day.sessions = []);

    this.enrolledCourses.forEach(course => {
      if (!course.sessions || !course.sessions.length) return;

      course.sessions.forEach((session: CourseSession) => {
        const sessionDate = new Date(session.date);

        if (sessionDate >= this.startOfWeek && sessionDate <= this.endOfWeek) {
          const dayIndex = this.getDayIndex(sessionDate);

          if (dayIndex >= 0 && dayIndex < 7) {
            this.weekDays[dayIndex].sessions.push({
              id: session.id,
              courseId: course.id,
              courseName: course.name,
              startTime: session.startTime,
              endTime: session.endTime,
              teacherName: course.teacher
            });

            this.weekDays[dayIndex].sessions.sort((a, b) => {
              return this.convertTimeToMinutes(a.startTime) - this.convertTimeToMinutes(b.startTime);
            });
          }
        }
      });
    });
  }

  getDayIndex(date: Date): number {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  }

  isDateToday(date: Date): boolean {
    return date.getDate() === this.today.getDate() &&
          date.getMonth() === this.today.getMonth() &&
          date.getFullYear() === this.today.getFullYear();
  }

  convertTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  formatTimeRange(startTime: string, endTime: string): string {
    return `${this.formatTime(startTime)} - ${this.formatTime(endTime)}`;
  }

  formatTime(time: string): string {
    const [hoursStr, minutesStr] = time.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${hours}:${minutes} ${ampm}`;
  }
}
