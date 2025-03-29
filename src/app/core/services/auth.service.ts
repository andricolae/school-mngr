import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, from, map, switchMap, tap } from 'rxjs';
import { User } from '../user.model';
import { firebaseConfig } from '../../../../environment';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface AuthResponseData {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiKey = firebaseConfig.apiKey;
  user = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient, private router: Router, private firestore: Firestore) {
    this.autoLogin();
  }

  getId() {
    return this.user.getValue()?.id;
  }

  signup(email: string, password: string, fullName: string, role: string) {
    return this.http
      .post<AuthResponseData>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${this.apiKey}`,
        {
          email,
          password,
          returnSecureToken: true,
        }
      )
      .pipe(
        tap((response) => {
          this.sendVerificationEmail(response.idToken).subscribe(() =>
            console.log('Verification email sent!')
          );
        }),
        switchMap((response) => {
          const ref = doc(this.firestore, 'users', response.localId);
          return setDoc(ref, { email, fullName, role });
        })
      );
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponseData>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.apiKey}`,
        {
          email,
          password,
          returnSecureToken: true,
        }
      )
      .pipe(
        switchMap((response) => {
          return this.http
            .post<any>(
              `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${this.apiKey}`,
              { idToken: response.idToken }
            )
            .pipe(
              map((lookup) => {
                const emailVerified = lookup.users?.[0]?.emailVerified;
                if (!emailVerified) {
                  throw new Error('Please verify your email before logging in.');
                }
                return response;
              })
            );
        }),
        switchMap((response) => {
          const userId = response.localId;
          const ref = doc(this.firestore, 'users', userId);
          return from(getDoc(ref)).pipe(
            map((snap) => {
              const profile = snap.data();
              return { response, role: profile?.['role'] || 'Unknown' };
            })
          );
        }),

        tap(({ response, role }) => {
          this.handleAuthentication(
            response.email,

            response.localId,
            response.idToken,
            +response.expiresIn,
            role
          );

          this.router.navigate(['home']);
        })
      );
  }

  resetPassword(email: string) {
    return this.http.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${this.apiKey}`,
      {
        requestType: 'PASSWORD_RESET',
        email: email,
      }
    );
  }

  logout() {
    this.user.next(null);
    console.log('User logged out!');
    localStorage.removeItem('userData');
    this.router.navigate(['/login']);
  }

  sendVerificationEmail(idToken: string) {
    return this.http.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${this.apiKey}`,
      {
        requestType: 'VERIFY_EMAIL',
        idToken,
      }
    );
  }

  private handleAuthentication(
    email: string,
    userId: string,
    token: string,
    expiresIn: number,
    role: string
  ) {
    const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
    const user = new User(email, userId, token, expirationDate, role);
    this.user.next(user);
    localStorage.setItem('userData', JSON.stringify(user));
  }

  autoLogin() {
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      return;
    }

    const userDataString = localStorage.getItem('userData');
    if (!userDataString) return;

    const userData: {
      email: string;
      id: string;
      _token: string;
      _tokenExpirationDate: string;
      role: string
    } = JSON.parse(userDataString);

    const loadedUser = new User(
      userData.email,
      userData.id,
      userData._token,
      new Date(userData._tokenExpirationDate),
      userData.role
    );

    if (loadedUser.token) {
      this.user.next(loadedUser);
    }
  }

  fetchUserInfo(idToken: string) {
    return this.http.post<any>(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${this.apiKey}`,
      { idToken }
    );
  }
}
