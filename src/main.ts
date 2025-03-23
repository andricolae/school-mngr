import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { bootstrapApplication } from '@angular/platform-browser';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { firebaseConfig } from '../environment';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
  ],
});
