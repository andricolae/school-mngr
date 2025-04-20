// src/app/core/services/logging.service.ts
import { Injectable, Optional } from '@angular/core';
import { Store } from '@ngrx/store';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { LogCategory, LogEntry } from '../user.model';
import * as LogActions from '../../state/logs/log.actions';
import { AuthService } from './auth.service';
import { User } from '../user.model';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private logsCollection = 'school-mngr-logs';
  private currentUser: User | null = null;

  constructor(
    @Optional() private store: Store,
    private firestore: Firestore,
    private authService: AuthService
  ) {
    this.authService.user.subscribe(user => {
      this.currentUser = user;
    });
  }

  log(category: LogCategory, action: string, message: string, details?: any): void {
    const logEntry: LogEntry = {
      timestamp: Date.now(),
      userId: this.currentUser?.id,
      userName: this.currentUser?.email,
      userRole: this.currentUser?.role,
      category,
      action,
      message,
      details: this.sanitizeLogDetails(details)
    };

    this.store.dispatch(LogActions.addLog({ log: logEntry }));

    addDoc(collection(this.firestore, this.logsCollection), logEntry)
      .catch(error => console.error('Error writing log:', error));
  }

  logAuth(action: string, message: string, details?: any): void {
    this.log(LogCategory.AUTH, action, message, details);
  }

  logCourse(action: string, message: string, details?: any): void {
    this.log(LogCategory.COURSE, action, message, details);
  }

  logGrade(action: string, message: string, details?: any): void {
    this.log(LogCategory.GRADE, action, message, details);
  }

  logAttendance(action: string, message: string, details?: any): void {
    this.log(LogCategory.ATTENDANCE, action, message, details);
  }

  logStudent(action: string, message: string, details?: any): void {
    this.log(LogCategory.STUDENT, action, message, details);
  }

  logTeacher(action: string, message: string, details?: any): void {
    this.log(LogCategory.TEACHER, action, message, details);
  }

  logSchedule(action: string, message: string, details?: any): void {
    this.log(LogCategory.SCHEDULER, action, message, details);
  }

  logAdmin(action: string, message: string, details?: any): void {
    this.log(LogCategory.ADMIN, action, message, details);
  }

  logNavigation(action: string, message: string, details?: any): void {
    this.log(LogCategory.NAVIGATION, action, message, details);
  }

  logSystem(action: string, message: string, details?: any): void {
    this.log(LogCategory.SYSTEM, action, message, details);
  }

  private sanitizeLogDetails(details: any): any {
    if (!details) return null;

    try {
      const sanitized = JSON.parse(JSON.stringify(details));

      const truncateStringValues = (obj: any) => {
        if (!obj) return obj;

        if (typeof obj === 'object') {
          for (const key in obj) {
            if (typeof obj[key] === 'string' && obj[key].length > 500) {
              obj[key] = obj[key].substring(0, 500) + '... [truncated]';
            } else if (typeof obj[key] === 'object') {
              obj[key] = truncateStringValues(obj[key]);
            }
          }
        }
        return obj;
      };

      return truncateStringValues(sanitized);
    } catch (error) {
      return {
        error: 'Could not serialize log details',
        type: typeof details,
        summary: details ? details.toString().substring(0, 100) : null
      };
    }
  }
}
