import { createReducer, on } from '@ngrx/store';
import * as UserActions from './user.actions';
import { User } from '../../core/user.model';

export interface UsersState {
    users: User[];
    loading: boolean;
    error: string | null;
}

const initialState: UsersState = {
    users: [],
    loading: false,
    error: null
};

export const usersReducer = createReducer(
    initialState,
    on(UserActions.loadUsers, state => ({ ...state, loading: true })),

    on(UserActions.loadUsersSuccess, (state, { users }) => ({
        ...state,
        users,
        loading: false
    })),

    on(UserActions.loadUsersFail, (state, { error }) => ({
        ...state,
        error,
        loading: false
    })),

    on(UserActions.deleteUserSuccess, (state, { userId }) => ({
        ...state,
        users: state.users.filter(c => c.id !== userId)
    })),

    on(UserActions.updateUserSuccess, (state, { user }) => ({
        ...state,
        users: state.users.map(c => c.id === user.id ? user : c)
      })),
);
