import { computed, Injectable, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  sendEmailVerification
} from '@angular/fire/auth';

import {
  Firestore,
  doc,
  setDoc,
  getDoc,
} from '@angular/fire/firestore';

import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSignal = signal<any | null>(null);
  readonly user = computed(() => this.currentUserSignal());

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  async register(fullName: string, email: string, password: string, role: string) {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);

    const ref = doc(this.firestore, 'users', cred.user.uid);
    await setDoc(ref, { email, fullName, role });

    await sendEmailVerification(cred.user);

    alert('Confirmation email sent. Please verify your email before logging in.');
    this.router.navigate(['/']);
  }

  async login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);

    if (!cred.user.emailVerified) {
      await signOut(this.auth);
      throw new Error('Please verify your email before logging in.');
    }

    const profileRef = doc(this.firestore, 'users', cred.user.uid);
    const profileSnap = await getDoc(profileRef);
    const profile = profileSnap.data();

    if (!profile || !profile['role']) {
      throw new Error('User role is missing.');
    }

    const user = { ...cred.user, ...(profile || {}) };
    this.setCurrentUser(user);

    return { role: profile['role'] };
  }

  logout() {
    signOut(this.auth).then(() => {
      this.setCurrentUser(null);
    });
  }

  setCurrentUser(user: any) {
    this.currentUserSignal.set(user);
  }

  getCurrentUser(): any {
    return this.currentUserSignal();
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSignal();
  }

  getUserRole(): string | null {
    return this.currentUserSignal()?.role ?? null;
  }

}
