import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, deleteDoc, doc, updateDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { Course } from '../user.model';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private coursesCollection;

  constructor(private firestore: Firestore) {
    this.coursesCollection = collection(this.firestore, 'courses');
  }

  getCourses(): Observable<Course[]> {
    return collectionData(this.coursesCollection, { idField: 'id' }) as Observable<Course[]>;
  }

  addCourse(course: Omit<Course, 'id'>): Observable<string> {
    return from(addDoc(this.coursesCollection, course).then(ref => ref.id));
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

}
