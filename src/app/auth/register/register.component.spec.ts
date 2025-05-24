import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';
import { SpinnerService } from '../../core/services/spinner.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { NotificationComponent } from '../../core/notification/notification.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let spinnerServiceMock: jasmine.SpyObj<SpinnerService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['signup'], {
      user: new BehaviorSubject(null)
    });
    const spinnerServiceSpy = jasmine.createSpyObj('SpinnerService', ['show', 'hide']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, FormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: SpinnerService, useValue: spinnerServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    authServiceMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    spinnerServiceMock = TestBed.inject(SpinnerService) as jasmine.SpyObj<SpinnerService>;
    routerMock = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    spyOn(NotificationComponent, 'show');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.email = 'test@test.com';
      component.password = 'password123';
      component.confirmPassword = 'password123';
      component.name = 'Test User';
      component.role = 'Student';
    });

    it('should validate form with correct data', () => {
      component.validateForm();
      expect(component.isFormValid).toBe(true);
    });

    it('should invalidate form with invalid email', () => {
      component.email = 'invalid-email';
      component.validateForm();

      expect(component.isFormValid).toBe(false);
      expect(NotificationComponent.show).toHaveBeenCalledWith('alert', 'Email must be valid');
    });

    it('should invalidate form with short password', () => {
      component.password = '12345';
      component.confirmPassword = '12345';
      component.validateForm();

      expect(component.isFormValid).toBe(false);
      expect(NotificationComponent.show).toHaveBeenCalledWith('alert', 'Password must be at least 6 characters');
    });

    it('should invalidate form when passwords do not match', () => {
      component.confirmPassword = 'different-password';
      component.validateForm();

      expect(component.isFormValid).toBe(false);
      expect(NotificationComponent.show).toHaveBeenCalledWith('alert', 'Passwords must match!');
    });

    it('should invalidate form with invalid name', () => {
      component.name = 'Test123';
      component.validateForm();

      expect(component.isFormValid).toBe(false);
      expect(NotificationComponent.show).toHaveBeenCalledWith('alert', 'Name must only contain letters and spaces!');
    });

    it('should invalidate form without role selection', () => {
      component.role = '';
      component.validateForm();

      expect(component.isFormValid).toBe(false);
      expect(NotificationComponent.show).toHaveBeenCalledWith('alert', 'Please select a role!');
    });
  });

  describe('Form Submission', () => {
    let mockForm: any;

    beforeEach(() => {
      mockForm = {
        reset: jasmine.createSpy('reset'),
        valid: true,
        invalid: false,
        value: {},
        form: {
          valid: true
        }
      };

      component.email = 'test@test.com';
      component.password = 'password123';
      component.confirmPassword = 'password123';
      component.name = 'Test User';
      component.role = 'Student';
      component.isFormValid = true;
    });

    it('should register successfully', () => {
      const mockAuthResponse: any = {
        idToken: 'test-token',
        email: 'test@test.com',
        refreshToken: 'refresh-token',
        expiresIn: '3600',
        localId: 'user-id'
      };

      authServiceMock.signup.and.returnValue(of(mockAuthResponse));

      component.onSubmit(mockForm);

      expect(spinnerServiceMock.show).toHaveBeenCalled();
      expect(authServiceMock.signup).toHaveBeenCalledWith(
        'test@test.com',
        'password123',
        'Test User',
        'Student'
      );
      expect(spinnerServiceMock.hide).toHaveBeenCalled();
      expect(mockForm.reset).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
      expect(NotificationComponent.show).toHaveBeenCalledWith('success', 'Account created! Please log in.');
    });

    it('should handle registration error', () => {
      const errorMessage = 'Registration failed';
      authServiceMock.signup.and.returnValue(throwError(() => ({ message: errorMessage })));

      component.onSubmit(mockForm);

      expect(spinnerServiceMock.show).toHaveBeenCalled();
      expect(authServiceMock.signup).toHaveBeenCalled();
      expect(NotificationComponent.show).toHaveBeenCalledWith('alert', 'Failed to register: + ${err.message}');
    });

    it('should not submit if form is invalid', () => {
      component.isFormValid = false;

      component.onSubmit(mockForm);

      expect(NotificationComponent.show).toHaveBeenCalledWith('alert', 'Fields must be valid before submitting!');
      expect(authServiceMock.signup).not.toHaveBeenCalled();
    });

    it('should not submit if passwords do not match', () => {
      component.confirmPassword = 'different-password';

      component.onSubmit(mockForm);

      expect(NotificationComponent.show).toHaveBeenCalledWith('alert', 'Passwords do not match!');
      expect(authServiceMock.signup).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to login page', () => {
      component.navigateTo('/login');
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('Component Initialization', () => {
    it('should subscribe to user observable on init', () => {
      const mockUser = {
        email: 'test@test.com',
        id: 'test-id',
        role: 'Student',
        token: 'test-token',
        _token: 'test-token',
        _tokenExpirationDate: new Date()
      } as any;

      (authServiceMock.user as BehaviorSubject<any>).next(mockUser);

      component.ngOnInit();

      expect(component.isAuthenticated).toBe(true);
    });

    it('should not be authenticated when no user', () => {
      (authServiceMock.user as BehaviorSubject<any>).next(null);

      component.ngOnInit();

      expect(component.isAuthenticated).toBe(false);
    });
  });
});
