import { coursesReducer, CoursesState } from './course.reducer';
import * as CourseActions from './course.actions';
import { Course } from '../../core/user.model';

describe('CoursesReducer', () => {
  const initialState: CoursesState = {
    courses: [],
    loading: false,
    error: null
  };

  const mockCourse: Course = {
    id: '1',
    name: 'Test Course',
    teacher: 'Test Teacher',
    schedule: 'Mon 10:00',
    sessions: [],
    enrolledStudents: [],
    studentGrades: {},
    studentAttendance: {}
  };

  const mockCourses: Course[] = [
    mockCourse,
    {
      id: '2',
      name: 'Another Course',
      teacher: 'Another Teacher',
      schedule: 'Tue 14:00',
      sessions: [],
      enrolledStudents: [],
      studentGrades: {},
      studentAttendance: {}
    }
  ];

  it('should return the initial state', () => {
    const action = { type: 'Unknown' } as any;
    const state = coursesReducer(undefined, action);

    expect(state).toEqual(initialState);
  });

  describe('Load Courses', () => {
    it('should set loading to true on loadCourses', () => {
      const action = CourseActions.loadCourses();
      const state = coursesReducer(initialState, action);

      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should populate courses on loadCoursesSuccess', () => {
      const action = CourseActions.loadCoursesSuccess({ courses: mockCourses });
      const state = coursesReducer(initialState, action);

      expect(state.courses).toEqual(mockCourses);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should set error on loadCoursesFail', () => {
      const error = 'Failed to load courses';
      const action = CourseActions.loadCoursesFail({ error });
      const state = coursesReducer(initialState, action);

      expect(state.error).toBe(error);
      expect(state.loading).toBe(false);
    });
  });

  describe('Add Course', () => {
    it('should set loading to true on addCourse', () => {
      const action = CourseActions.addCourse({ course: mockCourse });
      const state = coursesReducer(initialState, action);

      expect(state.loading).toBe(true);
    });

    it('should add course on addCourseSuccess', () => {
      const stateWithCourses: CoursesState = {
        ...initialState,
        courses: [mockCourses[0]]
      };

      const newCourse = mockCourses[1];
      const action = CourseActions.addCourseSuccess({ course: newCourse });
      const state = coursesReducer(stateWithCourses, action);

      expect(state.courses.length).toBe(2);
      expect(state.courses).toContain(newCourse);
      expect(state.loading).toBe(false);
    });
  });

  describe('Update Course', () => {
    it('should update course on updateCourseSuccess', () => {
      const stateWithCourses: CoursesState = {
        ...initialState,
        courses: mockCourses
      };

      const updatedCourse = {
        ...mockCourse,
        name: 'Updated Course Name'
      };

      const action = CourseActions.updateCourseSuccess({ course: updatedCourse });
      const state = coursesReducer(stateWithCourses, action);

      expect(state.courses.find(c => c.id === '1')?.name).toBe('Updated Course Name');
      expect(state.courses.length).toBe(2);
    });
  });

  describe('Delete Course', () => {
    it('should remove course on deleteCourseSuccess', () => {
      const stateWithCourses: CoursesState = {
        ...initialState,
        courses: mockCourses
      };

      const action = CourseActions.deleteCourseSuccess({ courseId: '1' });
      const state = coursesReducer(stateWithCourses, action);

      expect(state.courses.length).toBe(1);
      expect(state.courses.find(c => c.id === '1')).toBeUndefined();
    });
  });

  describe('Student Enrollment', () => {
    it('should enroll student on enrollStudentSuccess', () => {
      const stateWithCourses: CoursesState = {
        ...initialState,
        courses: [mockCourse]
      };

      const studentId = 'student123';
      const action = CourseActions.enrollStudentSuccess({
        courseId: '1',
        studentId
      });
      const state = coursesReducer(stateWithCourses, action);

      expect(state.courses[0].enrolledStudents).toContain(studentId);
    });

    it('should not duplicate student enrollment', () => {
      const courseWithStudent = {
        ...mockCourse,
        enrolledStudents: ['student123']
      };

      const stateWithCourses: CoursesState = {
        ...initialState,
        courses: [courseWithStudent]
      };

      const action = CourseActions.enrollStudentSuccess({
        courseId: '1',
        studentId: 'student123'
      });
      const state = coursesReducer(stateWithCourses, action);

      expect(state.courses[0].enrolledStudents?.length).toBe(1);
    });

    it('should unenroll student and remove related data on unenrollStudentSuccess', () => {
      const courseWithStudentData = {
        ...mockCourse,
        enrolledStudents: ['student123', 'student456'],
        studentGrades: {
          'student123': [{ id: '1', title: 'Test', value: 8, date: '2025-01-01' }],
          'student456': [{ id: '2', title: 'Test', value: 9, date: '2025-01-01' }]
        },
        studentAttendance: {
          'student123': { 'session1': true },
          'student456': { 'session1': false }
        }
      };

      const stateWithCourses: CoursesState = {
        ...initialState,
        courses: [courseWithStudentData]
      };

      const action = CourseActions.unenrollStudentSuccess({
        courseId: '1',
        studentId: 'student123'
      });
      const state = coursesReducer(stateWithCourses, action);

      const updatedCourse = state.courses[0];
      expect(updatedCourse.enrolledStudents).not.toContain('student123');
      expect(updatedCourse.enrolledStudents).toContain('student456');
      expect(updatedCourse.studentGrades?.['student123']).toBeUndefined();
      expect(updatedCourse.studentGrades?.['student456']).toBeDefined();
      expect(updatedCourse.studentAttendance?.['student123']).toBeUndefined();
      expect(updatedCourse.studentAttendance?.['student456']).toBeDefined();
    });
  });

  describe('Student Grades', () => {
    it('should add student grade on addStudentGradeSuccess', () => {
      const courseWithStudent = {
        ...mockCourse,
        enrolledStudents: ['student123']
      };

      const stateWithCourses: CoursesState = {
        ...initialState,
        courses: [courseWithStudent]
      };

      const grade = {
        id: 'grade1',
        title: 'Midterm',
        value: 8.5,
        date: '2025-01-20'
      };

      const action = CourseActions.addStudentGradeSuccess({
        courseId: '1',
        studentId: 'student123',
        grade
      });
      const state = coursesReducer(stateWithCourses, action);

      const updatedCourse = state.courses[0];
      expect(updatedCourse.studentGrades?.['student123']).toBeDefined();
      expect(updatedCourse.studentGrades?.['student123'][0]).toEqual(grade);
    });
  });

  describe('Schedule Status', () => {
    it('should mark course for scheduling on markCourseForSchedulingSuccess', () => {
      const stateWithCourses: CoursesState = {
        ...initialState,
        courses: [mockCourse]
      };

      const action = CourseActions.markCourseForSchedulingSuccess({ courseId: '1' });
      const state = coursesReducer(stateWithCourses, action);

      expect(state.courses[0].pendingSchedule).toBe(true);
    });

    it('should update schedule status on checkScheduleStatusSuccess', () => {
      const courseWithPendingSchedule = {
        ...mockCourse,
        pendingSchedule: true
      };

      const stateWithCourses: CoursesState = {
        ...initialState,
        courses: [courseWithPendingSchedule]
      };

      const action = CourseActions.checkScheduleStatusSuccess({
        courseId: '1',
        isScheduled: true
      });
      const state = coursesReducer(stateWithCourses, action);

      expect(state.courses[0].pendingSchedule).toBe(false);
    });
  });
});
