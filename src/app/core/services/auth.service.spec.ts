import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { DbService } from './db.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let dbServiceMock: jasmine.SpyObj<DbService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const dbServiceSpy = jasmine.createSpyObj('DbService', ['saveUserProfile', 'getUserProfile', 'updateUserPassword']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: DbService, useValue: dbServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    dbServiceMock = TestBed.inject(DbService) as jasmine.SpyObj<DbService>;
    routerMock = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should successfully login a user', (done) => {
      const mockAuthResponse = {
        idToken: 'test-token',
        email: 'test@test.com',
        refreshToken: 'refresh-token',
        expiresIn: '3600',
        localId: 'user-id'
      };

      const mockUserProfile = {
        email: 'test@test.com',
        fullName: 'Test User',
        role: 'Student'
      };

      const mockEmailVerificationResponse = {
        users: [{ emailVerified: true }]
      };

      dbServiceMock.getUserProfile.and.returnValue(of(mockUserProfile));

      service.login('test@test.com', 'password123').subscribe({
        next: (user) => {
          expect(user.email).toBe('test@test.com');
          expect(user.role).toBe('Student');
          expect(localStorage.getItem('userData')).toBeTruthy();
          done();
        },
        error: done.fail
      });

      const loginReq = httpMock.expectOne(req => req.url.includes('signInWithPassword'));
      expect(loginReq.request.method).toBe('POST');
      loginReq.flush(mockAuthResponse);

      const verifyReq = httpMock.expectOne(req => req.url.includes('accounts:lookup'));
      verifyReq.flush(mockEmailVerificationResponse);
    });

    it('should handle login error', (done) => {
      service.login('test@test.com', 'wrongpassword').subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Invalid login credentials.');
          done();
        }
      });

      const req = httpMock.expectOne(req => req.url.includes('signInWithPassword'));
      req.flush({ error: { message: 'INVALID_LOGIN_CREDENTIALS' } }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('signup', () => {
    it('should successfully sign up a user', (done) => {
      const mockAuthResponse = {
        idToken: 'test-token',
        email: 'newuser@test.com',
        refreshToken: 'refresh-token',
        expiresIn: '3600',
        localId: 'new-user-id'
      };

      dbServiceMock.saveUserProfile.and.returnValue(of(undefined));

      service.signup('newuser@test.com', 'password123', 'New User', 'Student').subscribe({
        next: (response) => {
          expect(response).toBeTruthy();
          expect(dbServiceMock.saveUserProfile).toHaveBeenCalled();
          done();
        },
        error: done.fail
      });

      const signupReq = httpMock.expectOne(req => req.url.includes('signUp'));
      expect(signupReq.request.method).toBe('POST');
      signupReq.flush(mockAuthResponse);

      const verifyEmailReq = httpMock.expectOne(req => req.url.includes('sendOobCode'));
      verifyEmailReq.flush({});
    });
  });

  describe('logout', () => {
    it('should clear user data and navigate to auth', () => {
      localStorage.setItem('userData', JSON.stringify({ test: 'data' }));

      service.logout();

      expect(localStorage.getItem('userData')).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth']);
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', (done) => {
      service.resetPassword('test@test.com').subscribe({
        next: (response) => {
          expect(response).toBeTruthy();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(req => req.url.includes('sendOobCode'));
      expect(req.request.body.requestType).toBe('PASSWORD_RESET');
      expect(req.request.body.email).toBe('test@test.com');
      req.flush({ email: 'test@test.com' });
    });
  });
});
