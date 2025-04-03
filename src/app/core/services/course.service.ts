import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, deleteDoc, doc, updateDoc, getDoc, arrayUnion, arrayRemove } from '@angular/fire/firestore';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { Course } from '../user.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private coursesCollection;

  constructor(private firestore: Firestore) {
    this.coursesCollection = collection(this.firestore, 'courses');
  }


getCourses(): Observable<Course[]> {
  return collectionData(this.coursesCollection, { idField: 'id' }).pipe(
    map(courses => {
      return courses.map(course => {
        // Handle sessions dates
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

        // Ensure studentGrades is properly initialized
        if (!course['studentGrades']) {
          course['studentGrades'] = {};
        }

        // Ensure studentAttendance is properly initialized
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
    // return from(addDoc(this.coursesCollection, course).then(ref => ref.id));
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
    return from(
      updateDoc(courseDoc, {
        enrolledStudents: arrayRemove(studentId)
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

          // Create or update studentGrades field
          let studentGrades = courseData['studentGrades'] || {};

          // Create array for this student if it doesn't exist
          if (!studentGrades[studentId]) {
            studentGrades[studentId] = [];
          }

          // Add the new grade with ID
          const newGrade = {
            id: gradeId,
            title: grade.title,
            value: grade.value,
            date: grade.date
          };

          studentGrades[studentId].push(newGrade);

          // Update the document and return the grade ID
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

          // Create or update studentAttendance field
          let studentAttendance = courseData['studentAttendance'] || {};

          // Create object for this student if it doesn't exist
          if (!studentAttendance[studentId]) {
            studentAttendance[studentId] = {};
          }

          // Set attendance for this session
          studentAttendance[studentId][sessionId] = present;

          // Update the document
          return from(updateDoc(courseDoc, { studentAttendance }));
        }
        throw new Error('Course not found');
      })
    );
  }
}
