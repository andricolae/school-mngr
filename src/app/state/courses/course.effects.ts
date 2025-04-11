import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as CourseActions from './course.actions';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { CourseService } from '../../core/services/course.service';
import { Course } from '../../core/user.model';
import { NotificationComponent } from '../../core/notification/notification.component';
import { HttpClient } from '@angular/common/http';
import { SpinnerService } from '../../core/services/spinner.service';

@Injectable()
export class CoursesEffects {
  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private courseService: CourseService,
    private spinnerService: SpinnerService,
  ) {}

  loadCourses$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.loadCourses),
      mergeMap(() =>
        this.courseService.getCourses().pipe(
          map((courses) => CourseActions.loadCoursesSuccess({ courses })),
          catchError((err) =>
            of(CourseActions.loadCoursesFail({ error: err.message }))
          )
        )
      )
    )
  );

  addCourse$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.addCourse),
      mergeMap(({ course }) =>
        this.courseService
          .addCourse({ ...course})
          .pipe(
            map((courseId) => {
                NotificationComponent.show('success', 'Course added successfully');
                return CourseActions.addCourseSuccess({
                  course: {
                    ...course,
                  } as Course
                });
              }),
            catchError((err) =>{
              NotificationComponent.show('alert', `Failed to add course: ${err.message}`);
              return of(CourseActions.addCourseFail({ error: err.message }));
            })
        )
      )
    )
  );

  deleteCourse$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.deleteCourse),
      mergeMap(({ courseId }) =>
        this.courseService.deleteCourse(courseId).pipe(
          map(() => {
            NotificationComponent.show('success', 'Course deleted successfully');
            return CourseActions.deleteCourseSuccess({ courseId });
          }),
          catchError((error) => {
            NotificationComponent.show('alert', `Failed to delete course: ${error.message}`);
            return of(CourseActions.deleteCourseFail({ error: error.message }));
          })
        )
      )
    )
  );

  updateCourse$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.updateCourse),
      mergeMap(({ course }) =>
        this.courseService.updateCourse(course).pipe(
          map(() => {
            NotificationComponent.show('success', 'Course updated successfully');
            return CourseActions.updateCourseSuccess({ course });
          }),
          catchError((err) => {
            NotificationComponent.show('alert', `Failed to update course: ${err.message}`);
            return of(CourseActions.updateCourseFail({ error: err.message }));
          })
        )
      )
    )
  );

  enrollStudent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.enrollStudent),
      mergeMap(({ courseId, studentId }) =>
        this.courseService.enrollStudent(courseId, studentId).pipe(
          map(() => {
            NotificationComponent.show('success', 'Enrolled in course successfully');
            return CourseActions.enrollStudentSuccess({ courseId, studentId });
          }),
          catchError((error) => {
            NotificationComponent.show('alert', `Failed to enroll in course: ${error.message}`);
            return of(CourseActions.enrollStudentFail({ error: error.message }));
          })
        )
      )
    )
  );

  unenrollStudent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.unenrollStudent),
      mergeMap(({ courseId, studentId }) =>
        this.courseService.unenrollStudent(courseId, studentId).pipe(
          map(() => {
            NotificationComponent.show('success', 'Unenrolled from course successfully');
            return CourseActions.unenrollStudentSuccess({ courseId, studentId });
          }),
          catchError((error) => {
            NotificationComponent.show('alert', `Failed to unenroll from course: ${error.message}`);
            return of(CourseActions.unenrollStudentFail({ error: error.message }));
          })
        )
      )
    )
  );

  addStudentGrade$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.addStudentGrade),
      mergeMap(({ courseId, studentId, grade }) =>
        this.courseService.addStudentGrade(courseId, studentId, grade).pipe(
          map((gradeId) => {
            NotificationComponent.show('success', 'Grade added successfully');
            return CourseActions.addStudentGradeSuccess({
              courseId,
              studentId,
              grade: { ...grade, id: gradeId }
            });
          }),
          catchError((error) => {
            NotificationComponent.show('alert', `Failed to add grade: ${error.message}`);
            return of(CourseActions.addStudentGradeFail({ error: error.message }));
          })
        )
      )
    )
  );

  updateStudentAttendance$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.updateStudentAttendance),
      mergeMap(({ courseId, studentId, sessionId, present }) =>
        this.courseService.updateStudentAttendance(courseId, studentId, sessionId, present).pipe(
          map(() => {
            NotificationComponent.show('success', 'Attendance updated successfully');
            return CourseActions.updateStudentAttendanceSuccess({
              courseId,
              studentId,
              sessionId,
              present
            });
          }),
          catchError((error) => {
            NotificationComponent.show('alert', `Failed to update attendance: ${error.message}`);
            return of(CourseActions.updateStudentAttendanceFail({ error: error.message }));
          })
        )
      )
    )
  );

  markCourseForScheduling$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CourseActions.markCourseForScheduling),
      mergeMap(({ courseId }) =>
        this.http.post<any>('https://school-api-server.vercel.app/api/mark-course-pending/', { courseId }).pipe(
          map(() => CourseActions.markCourseForSchedulingSuccess({ courseId })),
          catchError(error => {
            console.error('Error marking course for scheduling:', error);
            return of(CourseActions.markCourseForSchedulingFailure({ error }));
          }),
          tap(() => {
            this.spinnerService.hide();
            NotificationComponent.show("success", "Course successfully marked for scheduling")
          })
        )
      )
    );
  });

  checkScheduleStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.checkScheduleStatus),
      mergeMap(({ courseId }) =>
        this.courseService.checkScheduleStatus(courseId).pipe(
          map((isScheduled) => CourseActions.checkScheduleStatusSuccess({ courseId, isScheduled })),
          catchError((error) => of(CourseActions.checkScheduleStatusFail({ error: error.message })))
        )
      )
    )
  );
}
