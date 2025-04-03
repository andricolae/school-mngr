import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { initialAuthState } from './auth.state';

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuthActions.loginSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    error: null
  })),

  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    user: null,
    loading: false,
    error
  })),

  on(AuthActions.signup, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuthActions.signupSuccess, (state) => ({
    ...state,
    loading: false,
    error: null
  })),

  on(AuthActions.signupFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  on(AuthActions.logout, () => ({
    ...initialAuthState
  })),

  on(AuthActions.resetPassword, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuthActions.resetPasswordSuccess, (state) => ({
    ...state,
    loading: false,
    error: null
  })),

  on(AuthActions.resetPasswordFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);
