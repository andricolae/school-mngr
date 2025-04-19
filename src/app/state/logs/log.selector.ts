import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LogState } from './log.reducer';
import { LogCategory } from '../../core/user.model';

export const selectLogState = createFeatureSelector<LogState>('logs');

export const selectAllLogs = createSelector(
  selectLogState,
  state => state.logs
);

export const selectLogsLoading = createSelector(
  selectLogState,
  state => state.loading
);

export const selectLogsError = createSelector(
  selectLogState,
  state => state.error
);

export const selectLogsByCategory = (category: LogCategory) => createSelector(
  selectAllLogs,
  logs => logs.filter(log => log.category === category)
);

export const selectRecentLogs = (count: number) => createSelector(
  selectAllLogs,
  logs => logs.slice(0, count)
);
