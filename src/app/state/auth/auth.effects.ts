// src/app/state/auth/auth.effects.ts
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, tap, exhaustMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import * as AuthActions from './auth.actions';
import { NotificationComponent } from '../../core/notification/notification.component';

@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private router: Router
  ) {}

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ email, password }) =>
        this.authService.login(email, password).pipe(
          map((response) => {
            return AuthActions.loginSuccess({ user: this.authService.user.getValue()! });
          }),
          catchError((error) => {
            NotificationComponent.show('alert', error.message || 'An error occurred during login');
            return of(AuthActions.loginFailure({ error: error.message }));
          })
        )
      )
    )
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(() => {
          this.router.navigate(['/home']);
        })
      ),
    { dispatch: false }
  );

  signup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.signup),
      exhaustMap(({ email, password, name, role }) =>
        this.authService.signup(email, password, name, role).pipe(
          map(() => {
            NotificationComponent.show('success', 'Account created! Please log in.');
            return AuthActions.signupSuccess();
          }),
          catchError((error) => {
            NotificationComponent.show('alert', 'Failed to register: ' + error.message);
            return of(AuthActions.signupFailure({ error: error.message }));
          })
        )
      )
    )
  );

  signupSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.signupSuccess),
        tap(() => {
          this.router.navigate(['/login']);
        })
      ),
    { dispatch: false }
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          this.authService.logout();
          this.router.navigate(['/login']);
        })
      ),
    { dispatch: false }
  );

  autoLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.autoLogin),
      map(() => {
        const user = this.authService.user.getValue();
        if (user) {
          return AuthActions.loginSuccess({ user });
        }
        return { type: '[Auth] Auto Login Failed' };
      })
    )
  );

  resetPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.resetPassword),
      exhaustMap(({ email }) =>
        this.authService.resetPassword(email).pipe(
          map(() => {
            NotificationComponent.show(
              'success',
              'If your email has been registered, a password reset link has been sent to you!'
            );
            return AuthActions.resetPasswordSuccess();
          }),
          catchError((error) => {
            NotificationComponent.show(
              'success',
              'If your email has been registered, a password reset link has been sent to you!'
            );
            return of(AuthActions.resetPasswordFailure({ error: error.message }));
          })
        )
      )
    )
  );
}
