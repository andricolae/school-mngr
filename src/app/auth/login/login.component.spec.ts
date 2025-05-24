import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { SpinnerService } from '../../core/services/spinner.service';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { NotificationComponent } from '../../core/notification/notification.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let spinnerServiceMock: jasmine.SpyObj<SpinnerService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'resetPassword'], {
      user: new BehaviorSubject(null)
    });
    const spinnerServiceSpy = jasmine.createSpyObj('SpinnerService', ['show', 'hide']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, FormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: SpinnerService, useValue: spinnerServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authServiceMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    spinnerServiceMock = TestBed.inject(SpinnerService) as jasmine.SpyObj<SpinnerService>;
    routerMock = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Mock NotificationComponent.show
    spyOn(NotificationComponent, 'show');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onSubmit', () => {
    it('should login successfully', () => {
      const mockForm = {
        valid: true
      } as NgForm;

      component.email = 'test@test.com';
      component.password = 'password123';

      const mockUser = {
        email: 'test@test.com',
        id: 'test-id',
        role: 'Student',
        get token() { return 'test-token'; }
      } as any; // Using 'as any' to bypass strict type checking for the User class
      authServiceMock.login.and.returnValue(of(mockUser));

      component.onSubmit(mockForm);

      expect(spinnerServiceMock.show).toHaveBeenCalled();
      expect(authServiceMock.login).toHaveBeenCalledWith('test@test.com', 'password123');
      expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
      expect(spinnerServiceMock.hide).toHaveBeenCalled();
    });

    it('should show error notification on invalid form', () => {
      const mockForm = {
        valid: false
      } as NgForm;

      component.onSubmit(mockForm);

      expect(NotificationComponent.show).toHaveBeenCalledWith('alert', 'Email and Password must be valid!');
      expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('should handle login error', () => {
      const mockForm = {
        valid: true
      } as NgForm;

      component.email = 'test@test.com';
      component.password = 'wrongpassword';

      authServiceMock.login.and.returnValue(throwError(() => new Error('Login failed')));

      component.onSubmit(mockForm);

      expect(spinnerServiceMock.show).toHaveBeenCalled();
      expect(authServiceMock.login).toHaveBeenCalled();
      // În cazul de eroare, spinner-ul ar trebui să fie ascuns în subscribe error handler
    });
  });

  describe('validateForm', () => {
    it('should validate email and password correctly', () => {
      component.email = 'test@test.com';
      component.password = '123456';

      component.validateForm();

      expect(component.isFormValid).toBe(true);
    });

    it('should invalidate incorrect email', () => {
      component.email = 'invalidemail';
      component.password = '123456';

      component.validateForm();

      expect(component.isFormValid).toBe(false);
      expect(NotificationComponent.show).toHaveBeenCalledWith('alert', 'Email must be valid');
    });

    it('should invalidate short password', () => {
      component.email = 'test@test.com';
      component.password = '12345';

      component.validateForm();

      expect(component.isFormValid).toBe(false);
      expect(NotificationComponent.show).toHaveBeenCalledWith('alert', 'Password must be at least 6 characters');
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', () => {
      component.email = 'test@test.com';
      authServiceMock.resetPassword.and.returnValue(of({}));

      component.resetPassword();

      expect(spinnerServiceMock.show).toHaveBeenCalled();
      expect(authServiceMock.resetPassword).toHaveBeenCalledWith('test@test.com');
      expect(NotificationComponent.show).toHaveBeenCalledWith(
        'success',
        'If your email has been registered, a password reset link has been sent to you!'
      );
      expect(spinnerServiceMock.hide).toHaveBeenCalled();
    });

    it('should show error when email is empty', () => {
      component.email = '';

      component.resetPassword();

      expect(NotificationComponent.show).toHaveBeenCalledWith(
        'alert',
        'Please enter your email before resetting the password to your account!'
      );
      expect(authServiceMock.resetPassword).not.toHaveBeenCalled();
    });
  });

  describe('navigateTo', () => {
    it('should navigate to specified route', () => {
      component.navigateTo('/register');

      expect(routerMock.navigate).toHaveBeenCalledWith(['/register']);
    });
  });
});
