import { createReducer, on } from '@ngrx/store';
import * as CourseActions from './course.actions';
import { Course } from '../../core/user.model';

export interface CoursesState {
    courses: Course[];
    loading: boolean;
    error: string | null;
}

const initialState: CoursesState = {
    courses: [],
    loading: false,
    error: null
};

export const coursesReducer = createReducer(
    initialState,
    on(CourseActions.loadCourses, state => ({ ...state, loading: true })),

    on(CourseActions.loadCoursesSuccess, (state, { courses }) => ({
        ...state,
        courses,
        loading: false
    })),

    on(CourseActions.loadCoursesFail, (state, { error }) => ({
        ...state,
        error,
        loading: false
    })),

    on(CourseActions.addCourseSuccess, (state, { course }) => ({
        ...state,
        courses: [...state.courses, course]
    })),

    on(CourseActions.deleteCourseSuccess, (state, { courseId }) => ({
        ...state,
        courses: state.courses.filter(c => c.id !== courseId)
    })),

    on(CourseActions.addCourse, CourseActions.addCourse, state => ({
        ...state,
        loading: true
    })),

    on(CourseActions.updateCourseSuccess, (state, { course }) => ({
        ...state,
        courses: state.courses.map(c => c.id === course.id ? course : c)
      })),

    on(
        CourseActions.addCourseSuccess,
        CourseActions.addCourseFail,
        (state) => ({
            ...state,
            loading: false
        })
    ),

);
