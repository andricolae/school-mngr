import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as CourseActions from './course.actions';
import { catchError, from, map, mergeMap, of, tap } from 'rxjs';
import { CourseService } from '../../core/services/course.service';
import { Router } from '@angular/router';
import { Course } from '../../core/user.model';

@Injectable()
export class CoursesEffects {
  constructor(
    private actions$: Actions,
    private dbService: CourseService,
    private router: Router
  ) {}

  loadCourses$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.loadCourses),
      mergeMap(() =>
        this.dbService.getCourses().pipe(
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
        this.dbService
          .addCourse({ ...course})
          .pipe(
            map((courseId) => {
                console.log("Firebase returned courseId:", courseId);
                return CourseActions.addCourseSuccess({
                  course: {
                    ...course,
                  } as Course
                });
              }),
            catchError((err) =>
              of(CourseActions.addCourseFail({ error: err.message }))
            )
        )
      )
    )
  );

  deleteCourse$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.deleteCourse),
      mergeMap(({ courseId }) =>
        this.dbService.deleteCourse(courseId).pipe(
          map(() => CourseActions.deleteCourseSuccess({ courseId })),
          tap(() => console.log(`Deleted course with id: ${courseId}`)),
          catchError((err) =>
            of(CourseActions.deleteCourseFail({ error: err.message }))
          )
        )
      )
    )
  );

  updateCourse$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.updateCourse),
      mergeMap(({ course }) =>
        this.dbService.updateCourse(course).pipe(
          map(() => CourseActions.updateCourseSuccess({ course })),
          catchError((err) =>
            of(CourseActions.updateCourseFail({ error: err.message }))
          )
        )
      )
    )
  );

}
