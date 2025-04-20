import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import * as AuthActions from './auth.actions';
import { AuthService } from '../../core/services/auth.service';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { LoggingService } from '../../core/services/logging.service';
import { NotificationComponent } from '../../core/notification/notification.component';

@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private router: Router,
    private logger: LoggingService
  ) {}

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginStart),
      tap(action => this.logger.logAuth('LOGIN_ATTEMPT', `Login attempt with email: ${action.email}`)),
      mergeMap((action) =>
        this.authService.login(action.email, action.password).pipe(
          tap(user => {
            this.logger.logAuth('LOGIN_SUCCESS', `User logged in successfully`, {
              userEmail: user.email,
              userId: user.id,
              userRole: user.role
            });
            console.log('Login user received with roles:', user);
          }),
          map((user) => AuthActions.loginSuccess({ user })),
          catchError((error) => {
            this.logger.logAuth('LOGIN_FAIL', `Login failed: ${error.message}`, { error: error.message });
            NotificationComponent.show('alert', `Login failed: ${error.message}`);
            return of(AuthActions.loginFail({ error: error.message }));
          })
        )
      )
    )
  );

  loginRedirect$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(() => {
          this.logger.logNavigation('REDIRECT_AFTER_LOGIN', 'Redirecting to home page after successful login');
          this.router.navigate(['/home']);
        })
      ),
    { dispatch: false }
  );

  signup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.signupStart),
      tap(action => this.logger.logAuth('SIGNUP_ATTEMPT', `Signup attempt with email: ${action.email}`, {
        userEmail: action.email,
        userName: action.name,
        userRole: action.role
      })),
      mergeMap((action) =>
        this.authService.signup(action.email, action.password, action.name, action.role).pipe(
          tap((res) => {
            this.logger.logAuth('SIGNUP_SUCCESS', `User signed up successfully`, {
              userEmail: action.email,
              userName: action.name,
              userRole: action.role
            });
            console.log('Signup effect received:', res);
          }),
          map(() => {
            NotificationComponent.show('success', 'Account created successfully! Please check your email for verification.');
            return AuthActions.signupSuccess({ message: 'Verification email sent! Please check your inbox.' });
          }),
          catchError((error) => {
            this.logger.logAuth('SIGNUP_FAIL', `Signup failed: ${error.message}`, {
              userEmail: action.email,
              error: error.message
            });
            console.error('Signup effect error:', error);
            NotificationComponent.show('alert', `Signup failed: ${error.message}`);
            return of(AuthActions.signupFail({ error: error.message }));
          })
        )
      )
    )
  );

  resetPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.resetPasswordStart),
      tap(action => this.logger.logAuth('PASSWORD_RESET_ATTEMPT', `Password reset attempt for email: ${action.email}`)),
      mergeMap(action =>
        this.authService.resetPassword(action.email).pipe(
          map(() => {
            this.logger.logAuth('PASSWORD_RESET_SUCCESS', `Password reset email sent successfully for email: ${action.email}`);
            NotificationComponent.show('success', 'If an account exists with this email, a reset link has been sent. Check your inbox!');
            return AuthActions.resetPasswordSuccess({ message: 'If an account exists with this email, a reset link has been sent. Check your inbox!' });
          }),
          catchError((error) => {
            this.logger.logAuth('PASSWORD_RESET_FAIL', `Password reset failed: ${error.message}`, { error: error.message });
            NotificationComponent.show('alert', `Password reset failed: ${error.message}`);
            return of(AuthActions.resetPasswordFail({ error: error.message }));
          })
        )
      )
    )
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          this.logger.logAuth('LOGOUT', 'User logged out');
          this.router.navigate(['/login']);
        })
      ),
    { dispatch: false }
  );

  // login$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(AuthActions.loginStart),
  //     mergeMap((action) =>
  //       this.authService.login(action.email, action.password).pipe(
  //         tap(user => console.log('Login user received with roles:', user)),
  //         map((user) => AuthActions.loginSuccess({ user })),
  //         catchError((error) => of(AuthActions.loginFail({ error: error.message })))
  //       )
  //     )
  //   )
  // );

  // loginRedirect$ = createEffect(
  //   () =>
  //     this.actions$.pipe(
  //       ofType(AuthActions.loginSuccess),
  //       tap(() => this.router.navigate(['/home']))
  //     ),
  //   { dispatch: false }
  // );

  // signup$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(AuthActions.signupStart),
  //     mergeMap((action) =>
  //       this.authService.signup(action.email, action.password, action.name, action.role).pipe(
  //         tap((res) => console.log('Signup effect received:', res)),
  //         map(() =>
  //           AuthActions.signupSuccess({ message: 'Verification email sent! Please check your inbox.' })
  //         ),
  //         catchError((error) => {
  //           console.error('Signup effect error:', error);
  //           return of(AuthActions.signupFail({ error: error.message }));
  //         })
  //       )
  //     )
  //   )
  // );

  // resetPassword$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(AuthActions.resetPasswordStart),
  //     mergeMap(action =>
  //       this.authService.resetPassword(action.email).pipe(
  //         map(() =>
  //           AuthActions.resetPasswordSuccess({ message: 'If an account exists with this email, a reset link has been sent. Check your inbox!' })
  //         ),
  //         catchError((error) => of(AuthActions.resetPasswordFail({ error: error.message })))
  //       )
  //     )
  //   )
  // );
}
