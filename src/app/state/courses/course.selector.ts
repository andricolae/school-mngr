import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CoursesState } from './course.reducer';

export const selectCoursesState = createFeatureSelector<CoursesState>('courses');

export const selectAllCourses = createSelector(
  selectCoursesState,
  (state) => state.courses
);

export const selectCoursesLoading = createSelector(
  selectCoursesState,
  (state) => state.loading
);

export const selectCoursesError = createSelector(
  selectCoursesState,
  (state) => state.error
);

export const selectIsLoading = createSelector(
    selectCoursesState,
  (state) => state.loading
);
