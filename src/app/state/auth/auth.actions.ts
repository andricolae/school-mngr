import { createAction, props } from '@ngrx/store';
import { User } from '../../core/user.model';

export const login = createAction(
  '[Auth] Login',
  props<{ email: string; password: string }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

export const signup = createAction(
  '[Auth] Signup',
  props<{ email: string; password: string; name: string; role: string }>()
);

export const signupSuccess = createAction(
  '[Auth] Signup Success'
);

export const signupFailure = createAction(
  '[Auth] Signup Failure',
  props<{ error: string }>()
);

export const logout = createAction('[Auth] Logout');

export const autoLogin = createAction('[Auth] Auto Login');

export const resetPassword = createAction(
  '[Auth] Reset Password',
  props<{ email: string }>()
);

export const resetPasswordSuccess = createAction(
  '[Auth] Reset Password Success'
);

export const resetPasswordFailure = createAction(
  '[Auth] Reset Password Failure',
  props<{ error: string }>()
);
