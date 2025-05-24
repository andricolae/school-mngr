import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { from, of } from 'rxjs';
import * as LogActions from './log.actions';
import { Firestore, collection, collectionData, limit, orderBy, query } from '@angular/fire/firestore';

@Injectable()
export class LogEffects {
  constructor(
    private actions$: Actions,
    private firestore: Firestore
  ) {}

  loadLogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LogActions.loadLogs),
      switchMap(() => {
        const logsCollection = collection(this.firestore, 'school-mngr-logs');

        const logsQuery = query(
          logsCollection,
          orderBy('timestamp', 'desc'),
          limit(500)
        );

        return from(collectionData(logsQuery, { idField: 'id' })).pipe(
          map(logs => LogActions.loadLogsSuccess({ logs: logs as any })),
          catchError(error => of(LogActions.loadLogsFail({ error: error.message })))
        );
      })
    )
  );

  logToConsole$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LogActions.addLog),
      tap(({ log }) => {
        console.log(`[${log.category}] ${log.action}: ${log.message}`);
      })
    ),
    { dispatch: false }
  );
}
