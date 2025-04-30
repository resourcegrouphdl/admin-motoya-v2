import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideRouter } from '@angular/router';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideClientHydration } from '@angular/platform-browser';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

const firebaseConfig = {
  apiKey: 'AIzaSyDSm_NM4QShVmIhd_5SpJT2WG9tz4h6LLQ',
  authDomain: 'motoya-form.firebaseapp.com',
  projectId: 'motoya-form',
  storageBucket: 'motoya-form.appspot.com',
  messagingSenderId: '26647667439',
  appId: '1:26647667439:web:388dce55f64aac6115f11a',
  measurementId: 'G-9WCRJ5KVH6',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(),
    // Inicialización de Firebase
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'motoya-form',
        appId: '1:26647667439:web:388dce55f64aac6115f11a',
        storageBucket: 'motoya-form.appspot.com',
        apiKey: 'AIzaSyDSm_NM4QShVmIhd_5SpJT2WG9tz4h6LLQ',
        authDomain: 'motoya-form.firebaseapp.com',
        messagingSenderId: '26647667439',
        measurementId: 'G-9WCRJ5KVH6',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()), provideAnimationsAsync(),
  ],
};
