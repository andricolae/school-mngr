import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as CourseActions from './course.actions';
import * as UserSelectors from '../users/user.selector';
import { catchError, map, mergeMap, of, take, tap } from 'rxjs';
import { CourseService } from '../../core/services/course.service';
import { Course } from '../../core/user.model';
import { NotificationComponent } from '../../core/notification/notification.component';
import { HttpClient } from '@angular/common/http';
import { SpinnerService } from '../../core/services/spinner.service';
import { LoggingService } from '../../core/services/logging.service';

@Injectable()
export class CoursesEffects {
  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private courseService: CourseService,
    private spinnerService: SpinnerService,
    private logger: LoggingService,
    private store: Store
  ) {}

  loadCourses$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.loadCourses),
      tap(() => this.logger.logCourse('LOAD_COURSES', 'Loading all courses')),
      mergeMap(() =>
        this.courseService.getCourses().pipe(
          map((courses) => {
            this.logger.logCourse('LOAD_COURSES_SUCCESS', `Successfully loaded ${courses.length} courses`);
            return CourseActions.loadCoursesSuccess({ courses });
          }),
          catchError((err) => {
            this.logger.logCourse('LOAD_COURSES_FAIL', `Failed to load courses: ${err.message}`, { error: err });
            return of(CourseActions.loadCoursesFail({ error: err.message }));
          })
        )
      )
    )
  );

  addCourse$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.addCourse),
      tap(({ course }) => this.logger.logCourse('ADD_COURSE', `Adding new course: ${course.name}`, {
        courseName: course.name,
        teacher: course.teacher
      })),
      mergeMap(({ course }) =>
        this.courseService
          .addCourse({ ...course})
          .pipe(
            map((courseId) => {
                this.logger.logCourse('ADD_COURSE_SUCCESS', `Successfully added course: ${course.name}`, {
                  courseId,
                  courseName: course.name
                });
                NotificationComponent.show('success', 'Course added successfully');
                return CourseActions.addCourseSuccess({
                  course: {
                    ...course,
                  } as Course
                });
              }),
            catchError((err) => {
              this.logger.logCourse('ADD_COURSE_FAIL', `Failed to add course: ${err.message}`, {
                error: err.message,
                courseName: course.name
              });
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
      tap(({ courseId }) => this.logger.logCourse('DELETE_COURSE', `Deleting course with ID: ${courseId}`, { courseId })),
      mergeMap(({ courseId }) =>
        this.courseService.deleteCourse(courseId).pipe(
          map(() => {
            this.logger.logCourse('DELETE_COURSE_SUCCESS', `Successfully deleted course with ID: ${courseId}`, { courseId });
            NotificationComponent.show('success', 'Course deleted successfully');
            return CourseActions.deleteCourseSuccess({ courseId });
          }),
          catchError((error) => {
            this.logger.logCourse('DELETE_COURSE_FAIL', `Failed to delete course: ${error.message}`, {
              courseId,
              error: error.message
            });
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
      tap(({ course }) => this.logger.logCourse('UPDATE_COURSE', `Updating course: ${course.name}`, {
        courseId: course.id,
        courseName: course.name
      })),
      mergeMap(({ course }) =>
        this.courseService.updateCourse(course).pipe(
          map(() => {
            this.logger.logCourse('UPDATE_COURSE_SUCCESS', `Successfully updated course: ${course.name}`, {
              courseId: course.id,
              courseName: course.name
            });
            NotificationComponent.show('success', 'Course updated successfully');
            return CourseActions.updateCourseSuccess({ course });
          }),
          catchError((err) => {
            this.logger.logCourse('UPDATE_COURSE_FAIL', `Failed to update course: ${err.message}`, {
              courseId: course.id,
              courseName: course.name,
              error: err.message
            });
            NotificationComponent.show('alert', `Failed to update course: ${err.message}`);
            return of(CourseActions.updateCourseFail({ error: err.message }));
          })
        )
      )
    )
  );

  unenrollStudent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.unenrollStudent),
      tap(({ courseId, studentId }) => this.logger.logStudent('UNENROLL_STUDENT', `Unenrolling student from course`, {
        courseId,
        studentId
      })),
      mergeMap(({ courseId, studentId }) =>
        this.courseService.unenrollStudent(courseId, studentId).pipe(
          map(() => {
            this.logger.logStudent('UNENROLL_STUDENT_SUCCESS', `Successfully unenrolled student from course`, {
              courseId,
              studentId
            });
            NotificationComponent.show('success', 'Unenrolled from course successfully');
            return CourseActions.unenrollStudentSuccess({ courseId, studentId });
          }),
          catchError((error) => {
            this.logger.logStudent('UNENROLL_STUDENT_FAIL', `Failed to unenroll student from course: ${error.message}`, {
              courseId,
              studentId,
              error: error.message
            });
            NotificationComponent.show('alert', `Failed to unenroll from course: ${error.message}`);
            return of(CourseActions.unenrollStudentFail({ error: error.message }));
          })
        )
      )
    )
  );

  markCourseForScheduling$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CourseActions.markCourseForScheduling),
      tap(({ courseId }) => this.logger.logSchedule('MARK_FOR_SCHEDULING', `Marking course for scheduling`, { courseId })),
      mergeMap(({ courseId }) =>
        this.http.post<any>('https://school-api-server.vercel.app/api/mark-course-pending/', { courseId }).pipe(
          map(() => {
            this.logger.logSchedule('MARK_FOR_SCHEDULING_SUCCESS', `Successfully marked course for scheduling`, { courseId });
            return CourseActions.markCourseForSchedulingSuccess({ courseId });
          }),
          catchError(error => {
            this.logger.logSchedule('MARK_FOR_SCHEDULING_FAIL', `Failed to mark course for scheduling: ${error.message}`, {
              courseId,
              error: error.message
            });
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
      tap(({ courseId }) => this.logger.logSchedule('CHECK_SCHEDULE_STATUS', `Checking course schedule status`, { courseId })),
      mergeMap(({ courseId }) =>
        this.courseService.checkScheduleStatus(courseId).pipe(
          map((isScheduled) => {
            this.logger.logSchedule('CHECK_SCHEDULE_STATUS_SUCCESS', `Successfully checked course schedule status: ${isScheduled ? 'Scheduled' : 'Not scheduled'}`, {
              courseId,
              isScheduled
            });
            return CourseActions.checkScheduleStatusSuccess({ courseId, isScheduled });
          }),
          catchError((error) => {
            this.logger.logSchedule('CHECK_SCHEDULE_STATUS_FAIL', `Failed to check course schedule status: ${error.message}`, {
              courseId,
              error: error.message
            });
            return of(CourseActions.checkScheduleStatusFail({ error: error.message }));
          })
        )
      )
    )
  );

  // In CourseEffects class

// For student grade logging
addStudentGrade$ = createEffect(() =>
  this.actions$.pipe(
    ofType(CourseActions.addStudentGrade),
    mergeMap(({ courseId, studentId, grade }) => {
      // First, get course and student names
      return this.courseService.getCourse(courseId).pipe(
        mergeMap(course => {
          // Get student name from store
          return this.store.select(UserSelectors.selectAllUsers).pipe(
            take(1),
            mergeMap(users => {
              const student = users.find(u => u.id === studentId);
              const studentName = student ? student.fullName : 'Unknown Student';
              const courseName = course ? course.name : 'Unknown Course';

              // Now log with actual names
              this.logger.logGrade('ADD_GRADE',
                `Teacher adding grade "${grade.title}" with value ${grade.value} for student "${studentName}" in course "${courseName}"`,
                {
                  courseId,
                  courseName,
                  studentId,
                  studentName,
                  gradeTitle: grade.title,
                  gradeValue: grade.value
                }
              );

              return this.courseService.addStudentGrade(courseId, studentId, grade).pipe(
                map((gradeId) => {
                  this.logger.logGrade('ADD_GRADE_SUCCESS',
                    `Successfully added grade "${grade.title}" with value ${grade.value} for student "${studentName}" in course "${courseName}"`,
                    {
                      courseId,
                      courseName,
                      studentId,
                      studentName,
                      gradeId,
                      gradeTitle: grade.title,
                      gradeValue: grade.value
                    }
                  );
                  NotificationComponent.show('success', 'Grade added successfully');
                  return CourseActions.addStudentGradeSuccess({
                    courseId,
                    studentId,
                    grade: { ...grade, id: gradeId }
                  });
                }),
                catchError((error) => {
                  this.logger.logGrade('ADD_GRADE_FAIL',
                    `Failed to add grade "${grade.title}" for student "${studentName}" in course "${courseName}": ${error.message}`,
                    {
                      courseId,
                      courseName,
                      studentId,
                      studentName,
                      gradeTitle: grade.title,
                      error: error.message
                    }
                  );
                  NotificationComponent.show('alert', `Failed to add grade: ${error.message}`);
                  return of(CourseActions.addStudentGradeFail({ error: error.message }));
                })
              );
            })
          );
        })
      );
    })
  )
);

// For student attendance logging
updateStudentAttendance$ = createEffect(() =>
  this.actions$.pipe(
    ofType(CourseActions.updateStudentAttendance),
    mergeMap(({ courseId, studentId, sessionId, present }) => {
      // Get course and student names first
      return this.courseService.getCourse(courseId).pipe(
        mergeMap(course => {
          return this.store.select(UserSelectors.selectAllUsers).pipe(
            take(1),
            mergeMap(users => {
              const student = users.find(u => u.id === studentId);
              const studentName = student ? student.fullName : 'Unknown Student';
              const courseName = course ? course.name : 'Unknown Course';

              // Find session info
              const session = course?.sessions?.find(s => s.id === sessionId);
              const sessionDate = session ? new Date(session.date).toLocaleDateString() : 'Unknown Date';
              const sessionTime = session ? `${session.startTime}-${session.endTime}` : 'Unknown Time';

              // Log with descriptive information
              this.logger.logAttendance('UPDATE_ATTENDANCE',
                `${present ? 'Marking' : 'Removing'} attendance for student "${studentName}" in course "${courseName}" for session on ${sessionDate} at ${sessionTime}`,
                {
                  courseId,
                  courseName,
                  studentId,
                  studentName,
                  sessionId,
                  sessionDate,
                  sessionTime,
                  status: present ? 'present' : 'absent'
                }
              );

              return this.courseService.updateStudentAttendance(courseId, studentId, sessionId, present).pipe(
                map(() => {
                  this.logger.logAttendance('UPDATE_ATTENDANCE_SUCCESS',
                    `Successfully ${present ? 'marked present' : 'marked absent'} student "${studentName}" in course "${courseName}" for session on ${sessionDate}`,
                    {
                      courseId,
                      courseName,
                      studentId,
                      studentName,
                      sessionId,
                      sessionDate,
                      sessionTime,
                      status: present ? 'present' : 'absent'
                    }
                  );
                  NotificationComponent.show('success', 'Attendance updated successfully');
                  return CourseActions.updateStudentAttendanceSuccess({
                    courseId,
                    studentId,
                    sessionId,
                    present
                  });
                }),
                catchError((error) => {
                  this.logger.logAttendance('UPDATE_ATTENDANCE_FAIL',
                    `Failed to update attendance for student "${studentName}" in course "${courseName}": ${error.message}`,
                    {
                      courseId,
                      courseName,
                      studentId,
                      studentName,
                      sessionId,
                      sessionDate,
                      sessionTime,
                      error: error.message
                    }
                  );
                  NotificationComponent.show('alert', `Failed to update attendance: ${error.message}`);
                  return of(CourseActions.updateStudentAttendanceFail({ error: error.message }));
                })
              );
            })
          );
        })
      );
    })
  )
);

// For student enrollment logging
enrollStudent$ = createEffect(() =>
  this.actions$.pipe(
    ofType(CourseActions.enrollStudent),
    mergeMap(({ courseId, studentId }) => {
      // Get course and student names first
      return this.courseService.getCourse(courseId).pipe(
        mergeMap(course => {
          return this.store.select(UserSelectors.selectAllUsers).pipe(
            take(1),
            mergeMap(users => {
              const student = users.find(u => u.id === studentId);
              const studentName = student ? student.fullName : 'Unknown Student';
              const courseName = course ? course.name : 'Unknown Course';

              this.logger.logStudent('ENROLL_STUDENT',
                `Enrolling student "${studentName}" in course "${courseName}"`,
                {
                  courseId,
                  courseName,
                  studentId,
                  studentName
                }
              );

              return this.courseService.enrollStudent(courseId, studentId).pipe(
                map(() => {
                  this.logger.logStudent('ENROLL_STUDENT_SUCCESS',
                    `Successfully enrolled student "${studentName}" in course "${courseName}"`,
                    {
                      courseId,
                      courseName,
                      studentId,
                      studentName
                    }
                  );
                  NotificationComponent.show('success', 'Enrolled in course successfully');
                  return CourseActions.enrollStudentSuccess({ courseId, studentId });
                }),
                catchError((error) => {
                  this.logger.logStudent('ENROLL_STUDENT_FAIL',
                    `Failed to enroll student "${studentName}" in course "${courseName}": ${error.message}`,
                    {
                      courseId,
                      courseName,
                      studentId,
                      studentName,
                      error: error.message
                    }
                  );
                  NotificationComponent.show('alert', `Failed to enroll in course: ${error.message}`);
                  return of(CourseActions.enrollStudentFail({ error: error.message }));
                })
              );
            })
          );
        })
      );
    })
  )
);

  // addCourse$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(CourseActions.addCourse),
  //     mergeMap(({ course }) =>
  //       this.courseService
  //         .addCourse({ ...course})
  //         .pipe(
  //           map((courseId) => {
  //               NotificationComponent.show('success', 'Course added successfully');
  //               return CourseActions.addCourseSuccess({
  //                 course: {
  //                   ...course,
  //                 } as Course
  //               });
  //             }),
  //           catchError((err) =>{
  //             NotificationComponent.show('alert', `Failed to add course: ${err.message}`);
  //             return of(CourseActions.addCourseFail({ error: err.message }));
  //           })
  //       )
  //     )
  //   )
  // );

  // deleteCourse$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(CourseActions.deleteCourse),
  //     mergeMap(({ courseId }) =>
  //       this.courseService.deleteCourse(courseId).pipe(
  //         map(() => {
  //           NotificationComponent.show('success', 'Course deleted successfully');
  //           return CourseActions.deleteCourseSuccess({ courseId });
  //         }),
  //         catchError((error) => {
  //           NotificationComponent.show('alert', `Failed to delete course: ${error.message}`);
  //           return of(CourseActions.deleteCourseFail({ error: error.message }));
  //         })
  //       )
  //     )
  //   )
  // );

  // updateCourse$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(CourseActions.updateCourse),
  //     mergeMap(({ course }) =>
  //       this.courseService.updateCourse(course).pipe(
  //         map(() => {
  //           NotificationComponent.show('success', 'Course updated successfully');
  //           return CourseActions.updateCourseSuccess({ course });
  //         }),
  //         catchError((err) => {
  //           NotificationComponent.show('alert', `Failed to update course: ${err.message}`);
  //           return of(CourseActions.updateCourseFail({ error: err.message }));
  //         })
  //       )
  //     )
  //   )
  // );

  // enrollStudent$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(CourseActions.enrollStudent),
  //     mergeMap(({ courseId, studentId }) =>
  //       this.courseService.enrollStudent(courseId, studentId).pipe(
  //         map(() => {
  //           NotificationComponent.show('success', 'Enrolled in course successfully');
  //           return CourseActions.enrollStudentSuccess({ courseId, studentId });
  //         }),
  //         catchError((error) => {
  //           NotificationComponent.show('alert', `Failed to enroll in course: ${error.message}`);
  //           return of(CourseActions.enrollStudentFail({ error: error.message }));
  //         })
  //       )
  //     )
  //   )
  // );

  // unenrollStudent$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(CourseActions.unenrollStudent),
  //     mergeMap(({ courseId, studentId }) =>
  //       this.courseService.unenrollStudent(courseId, studentId).pipe(
  //         map(() => {
  //           NotificationComponent.show('success', 'Unenrolled from course successfully');
  //           return CourseActions.unenrollStudentSuccess({ courseId, studentId });
  //         }),
  //         catchError((error) => {
  //           NotificationComponent.show('alert', `Failed to unenroll from course: ${error.message}`);
  //           return of(CourseActions.unenrollStudentFail({ error: error.message }));
  //         })
  //       )
  //     )
  //   )
  // );

  // addStudentGrade$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(CourseActions.addStudentGrade),
  //     mergeMap(({ courseId, studentId, grade }) =>
  //       this.courseService.addStudentGrade(courseId, studentId, grade).pipe(
  //         map((gradeId) => {
  //           NotificationComponent.show('success', 'Grade added successfully');
  //           return CourseActions.addStudentGradeSuccess({
  //             courseId,
  //             studentId,
  //             grade: { ...grade, id: gradeId }
  //           });
  //         }),
  //         catchError((error) => {
  //           NotificationComponent.show('alert', `Failed to add grade: ${error.message}`);
  //           return of(CourseActions.addStudentGradeFail({ error: error.message }));
  //         })
  //       )
  //     )
  //   )
  // );

  // updateStudentAttendance$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(CourseActions.updateStudentAttendance),
  //     mergeMap(({ courseId, studentId, sessionId, present }) =>
  //       this.courseService.updateStudentAttendance(courseId, studentId, sessionId, present).pipe(
  //         map(() => {
  //           NotificationComponent.show('success', 'Attendance updated successfully');
  //           return CourseActions.updateStudentAttendanceSuccess({
  //             courseId,
  //             studentId,
  //             sessionId,
  //             present
  //           });
  //         }),
  //         catchError((error) => {
  //           NotificationComponent.show('alert', `Failed to update attendance: ${error.message}`);
  //           return of(CourseActions.updateStudentAttendanceFail({ error: error.message }));
  //         })
  //       )
  //     )
  //   )
  // );

  // markCourseForScheduling$ = createEffect(() => {
  //   return this.actions$.pipe(
  //     ofType(CourseActions.markCourseForScheduling),
  //     mergeMap(({ courseId }) =>
  //       this.http.post<any>('https://school-api-server.vercel.app/api/mark-course-pending/', { courseId }).pipe(
  //         map(() => CourseActions.markCourseForSchedulingSuccess({ courseId })),
  //         catchError(error => {
  //           console.error('Error marking course for scheduling:', error);
  //           return of(CourseActions.markCourseForSchedulingFailure({ error }));
  //         }),
  //         tap(() => {
  //           this.spinnerService.hide();
  //           NotificationComponent.show("success", "Course successfully marked for scheduling")
  //         })
  //       )
  //     )
  //   );
  // });

  // checkScheduleStatus$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(CourseActions.checkScheduleStatus),
  //     mergeMap(({ courseId }) =>
  //       this.courseService.checkScheduleStatus(courseId).pipe(
  //         map((isScheduled) => CourseActions.checkScheduleStatusSuccess({ courseId, isScheduled })),
  //         catchError((error) => of(CourseActions.checkScheduleStatusFail({ error: error.message })))
  //       )
  //     )
  //   )
  // );
}
