import { createAction, props } from '@ngrx/store';
import { LogEntry } from '../../core/user.model';

export const addLog = createAction(
  '[Logs] Add Log',
  props<{ log: LogEntry }>()
);

export const loadLogs = createAction(
  '[Logs] Load Logs'
);

export const loadLogsSuccess = createAction(
  '[Logs] Load Logs Success',
  props<{ logs: LogEntry[] }>()
);

export const loadLogsFail = createAction(
  '[Logs] Load Logs Fail',
  props<{ error: string }>()
);

export const clearLogs = createAction(
  '[Logs] Clear Logs'
);
