import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as UserActions from './user.actions';
import * as UserSelectors from './user.selector';
import { catchError, map, mergeMap, of, take, tap } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { LoggingService } from '../../core/services/logging.service';
import { NotificationComponent } from '../../core/notification/notification.component';

@Injectable()
export class UsersEffects {
  constructor(
    private actions$: Actions,
    private dbService: UserService,
    private router: Router,
    private logger: LoggingService,
    private store: Store
  ) {}

  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.loadUsers),
      tap(() => this.logger.logAdmin('LOAD_USERS', 'Loading all users')),
      mergeMap(() =>
        this.dbService.getUsers().pipe(
          map((users) => {
            this.logger.logAdmin('LOAD_USERS_SUCCESS', `Successfully loaded ${users.length} users`);
            return UserActions.loadUsersSuccess({ users });
          }),
          catchError((err) => {
            this.logger.logAdmin('LOAD_USERS_FAIL', `Failed to load users: ${err.message}`, { error: err.message });
            return of(UserActions.loadUsersFail({ error: err.message }));
          })
        )
      )
    )
  );

  deleteUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.deleteUser),
      mergeMap(({ userId }) => {
        return this.store.select(UserSelectors.selectAllUsers).pipe(
          take(1),
          mergeMap(users => {
            const user = users.find(u => u.id === userId);
            const userName = user ? user.fullName : 'Unknown User';
            const userEmail = user ? user.email : 'Unknown Email';
            const userRole = user ? user.role : 'Unknown Role';

            this.logger.logAdmin('DELETE_USER',
              `Deleting user "${userName}" (${userEmail}) with role "${userRole}"`,
              {
                userId,
                userName,
                userEmail,
                userRole
              }
            );

            return this.dbService.deleteUser(userId).pipe(
              map(() => {
                this.logger.logAdmin('DELETE_USER_SUCCESS',
                  `Successfully deleted user "${userName}" (${userEmail}) with role "${userRole}"`,
                  {
                    userId,
                    userName,
                    userEmail,
                    userRole
                  }
                );
                NotificationComponent.show('success', 'User deleted successfully');
                return UserActions.deleteUserSuccess({ userId });
              }),
              catchError((err) => {
                this.logger.logAdmin('DELETE_USER_FAIL',
                  `Failed to delete user "${userName}" (${userEmail}): ${err.message}`,
                  {
                    userId,
                    userName,
                    userEmail,
                    userRole,
                    error: err.message
                  }
                );
                NotificationComponent.show('alert', `Failed to delete user: ${err.message}`);
                return of(UserActions.deleteUserFail({ error: err.message }));
              })
            );
          })
        );
      })
    )
  );

  updateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.updateUser),
      tap(({ user }) => this.logger.logAdmin('UPDATE_USER',
        `Updating user "${user.fullName}" (${user.email}) with role "${user.role}"`,
        {
          userId: user.id,
          userName: user.fullName,
          userEmail: user.email,
          userRole: user.role
        }
      )),
      mergeMap(({ user }) =>
        this.dbService.updateUser(user).pipe(
          map(() => {
            this.logger.logAdmin('UPDATE_USER_SUCCESS',
              `Successfully updated user "${user.fullName}" (${user.email}) with role "${user.role}"`,
              {
                userId: user.id,
                userName: user.fullName,
                userEmail: user.email,
                userRole: user.role
              }
            );
            NotificationComponent.show('success', 'User updated successfully');
            return UserActions.updateUserSuccess({ user });
          }),
          catchError((err) => {
            this.logger.logAdmin('UPDATE_USER_FAIL',
              `Failed to update user "${user.fullName}" (${user.email}): ${err.message}`,
              {
                userId: user.id,
                userName: user.fullName,
                userEmail: user.email,
                userRole: user.role,
                error: err.message
              }
            );
            NotificationComponent.show('alert', `Failed to update user: ${err.message}`);
            return of(UserActions.updateUserFail({ error: err.message }));
          })
        )
      )
    )
  );

  // loadUsers$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(UserActions.loadUsers),
  //     mergeMap(() =>
  //       this.dbService.getUsers().pipe(
  //         map((users) => UserActions.loadUsersSuccess({ users })),
  //         catchError((err) =>
  //           of(UserActions.loadUsersFail({ error: err.message }))
  //         )
  //       )
  //     )
  //   )
  // );

  // deleteUser$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(UserActions.deleteUser),
  //     mergeMap(({ userId }) =>
  //       this.dbService.deleteUser(userId).pipe(
  //         map(() => UserActions.deleteUserSuccess({ userId })),
  //         tap(() => console.log(`Deleted user with id: ${userId}`)),
  //         catchError((err) =>
  //           of(UserActions.deleteUserFail({ error: err.message }))
  //         )
  //       )
  //     )
  //   )
  // );

  // updateUser$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(UserActions.updateUser),
  //     mergeMap(({ user }) =>
  //       this.dbService.updateUser(user).pipe(
  //         map(() => UserActions.updateUserSuccess({ user })),
  //         catchError((err) =>
  //           of(UserActions.updateUserFail({ error: err.message }))
  //         )
  //       )
  //     )
  //   )
  // );
}
