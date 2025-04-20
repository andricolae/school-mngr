import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { bootstrapApplication, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch } from '@angular/common/http';
import { firebaseConfig } from '../environment';
import { provideZoneChangeDetection } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { CoursesEffects } from './app/state/courses/course.effects';
import { coursesReducer } from './app/state/courses/course.reducer';
import { UsersEffects } from './app/state/users/user.effects';
import { usersReducer } from './app/state/users/user.reducer';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { isDevMode } from '@angular/core';
import { logReducer } from './app/state/logs/log.reducer';
import { LogEffects } from './app/state/logs/log.effects';
import { AgGridModule } from 'ag-grid-angular';
import { LoggingInterceptor } from './app/core/logging.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    AgGridModule,
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideClientHydration(withEventReplay()),
    provideStore({ courses: coursesReducer, users: usersReducer, logs: logReducer}),
    provideEffects([
      CoursesEffects,
      UsersEffects,
      LogEffects
    ]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
      traceLimit: 75,
      connectInZone: true
    }),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoggingInterceptor,
      multi: true
    }
  ],
});
