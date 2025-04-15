import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, deleteDoc, doc, updateDoc, getDoc, arrayUnion, arrayRemove } from '@angular/fire/firestore';
import { catchError, from, map, Observable, switchMap, throwError } from 'rxjs';
import { Course } from '../user.model';
import { v4 as uuidv4 } from 'uuid';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private coursesCollection;

  constructor(private firestore: Firestore, private http: HttpClient) {
    this.coursesCollection = collection(this.firestore, 'courses');
  }


  getCourses(): Observable<Course[]> {
    return collectionData(this.coursesCollection, { idField: 'id' }).pipe(
      map(courses => {
        return courses.map(course => {
          if (course['sessions']) {
            course['sessions'] = course['sessions'].map((session: any) => {
              if (session.date && typeof session.date.toDate === 'function') {
                return {
                  ...session,
                  date: session.date.toDate()
                };
              }
              return session;
            });
          } else {
            course['sessions'] = [];
          }

          if (!course['studentGrades']) {
            course['studentGrades'] = {};
          }

          if (!course['studentAttendance']) {
            course['studentAttendance'] = {};
          }

          return course as Course;
        });
      })
    ) as Observable<Course[]>;
  }

  getCourse(id: string): Observable<Course | undefined> {
    const courseDoc = doc(this.firestore, `courses/${id}`);
    return from(getDoc(courseDoc)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data['sessions']) {
            data['sessions'] = data['sessions'].map((session: any) => {
              if (session.date && typeof session.date.toDate === 'function') {
                return {
                  ...session,
                  date: session.date.toDate()
                };
              }
              return session;
            });
          }
          return { ...data, id: docSnap.id } as Course;
        }
        return undefined;
      })
    );
  }

  addCourse(course: Omit<Course, 'id'>): Observable<string> {
    const courseToAdd = {
      ...course,
      sessions: course.sessions || [],
      enrolledStudents: course.enrolledStudents || []
    };
    return from(addDoc(this.coursesCollection, courseToAdd).then(ref => ref.id));
  }

  deleteCourse(courseId: string): Observable<void> {
    const courseDoc = doc(this.firestore, `courses/${courseId}`);
    return from(deleteDoc(courseDoc));
  }

  updateCourse(course: Course): Observable<void> {
    const courseDoc = doc(this.firestore, `courses/${course.id}`);
    const { id, ...courseWithoutId } = course;
    return from(updateDoc(courseDoc, courseWithoutId));
  }

  enrollStudent(courseId: string, studentId: string): Observable<void> {
    const courseDoc = doc(this.firestore, `courses/${courseId}`);
    return from(
      updateDoc(courseDoc, {
        enrolledStudents: arrayUnion(studentId)
      })
    );
  }

  unenrollStudent(courseId: string, studentId: string): Observable<void> {
    const courseDoc = doc(this.firestore, `courses/${courseId}`);

    return from(getDoc(courseDoc)).pipe(
      switchMap(docSnap => {
        if (docSnap.exists()) {
          const courseData = docSnap.data();

          const updatedData: any = {
            enrolledStudents: arrayRemove(studentId)
          };

          if (courseData['studentGrades'] && courseData['studentGrades'][studentId]) {
            const updatedGrades = { ...courseData['studentGrades'] };
            delete updatedGrades[studentId];
            updatedData.studentGrades = updatedGrades;
          }

          if (courseData['studentAttendance'] && courseData['studentAttendance'][studentId]) {
            const updatedAttendance = { ...courseData['studentAttendance'] };
            delete updatedAttendance[studentId];
            updatedData.studentAttendance = updatedAttendance;
          }

          return from(updateDoc(courseDoc, updatedData));
        }
        throw new Error('Course not found');
      })
    );
  }

  addStudentGrade(courseId: string, studentId: string, grade: any): Observable<string> {
    const courseDoc = doc(this.firestore, `courses/${courseId}`);
    const gradeId = uuidv4();

    return from(getDoc(courseDoc)).pipe(
      switchMap(docSnap => {
        if (docSnap.exists()) {
          const courseData = docSnap.data();

          let studentGrades = courseData['studentGrades'] || {};

          if (!studentGrades[studentId]) {
            studentGrades[studentId] = [];
          }

          const newGrade = {
            id: gradeId,
            title: grade.title,
            value: grade.value,
            date: grade.date
          };

          studentGrades[studentId].push(newGrade);

          return from(updateDoc(courseDoc, { studentGrades })).pipe(
            map(() => gradeId)
          );
        }
        throw new Error('Course not found');
      })
    );
  }

  updateStudentAttendance(courseId: string, studentId: string, sessionId: string, present: boolean): Observable<void> {
    const courseDoc = doc(this.firestore, `courses/${courseId}`);

    return from(getDoc(courseDoc)).pipe(
      switchMap(docSnap => {
        if (docSnap.exists()) {
          const courseData = docSnap.data();

          let studentAttendance = courseData['studentAttendance'] || {};

          if (!studentAttendance[studentId]) {
            studentAttendance[studentId] = {};
          }

          studentAttendance[studentId][sessionId] = present;

          return from(updateDoc(courseDoc, { studentAttendance }));
        }
        throw new Error('Course not found');
      })
    );
  }

  markCourseForScheduling(courseId: string): Observable<any> {
    return this.http.post('https://school-api-server.vercel.app/api/pending-schedule', { courseId })
      .pipe(
        catchError(error => {
          console.error('Error marking course for scheduling:', error);
          return throwError(() => new Error('Failed to mark course for scheduling'));
        })
      );
  }

  checkScheduleStatus(courseId: string): Observable<boolean> {
    return this.getCourse(courseId).pipe(
      map(course => {
        return !course!.pendingSchedule && course!.sessions! && course!.sessions!.length > 0;
      }),
      catchError(error => {
        console.error('Error checking schedule status:', error);
        return throwError(() => new Error('Failed to check schedule status'));
      })
    );
  }
}
