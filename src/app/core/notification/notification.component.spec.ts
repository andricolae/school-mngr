import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationComponent } from './notification.component';

describe('NotificationComponent', () => {
  let component: NotificationComponent;
  let fixture: ComponentFixture<NotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.visible()).toBe(false);
    expect(component.message()).toBe('');
    expect(component.type()).toBe('notification');
  });

  describe('static show method', () => {
    it('should display alert notification', fakeAsync(() => {
      NotificationComponent.show('alert', 'Test alert message', 1000);

      fixture.detectChanges();

      expect(component.visible()).toBe(true);
      expect(component.message()).toBe('Test alert message');
      expect(component.type()).toBe('alert');

      tick(1000);
      expect(component.visible()).toBe(false);
    }));

    it('should display success notification', fakeAsync(() => {
      NotificationComponent.show('success', 'Success message', 500);

      fixture.detectChanges();

      expect(component.visible()).toBe(true);
      expect(component.message()).toBe('Success message');
      expect(component.type()).toBe('success');

      tick(500);
      expect(component.visible()).toBe(false);
    }));

    it('should display notification with default duration', fakeAsync(() => {
      NotificationComponent.show('notification', 'Default duration message');

      fixture.detectChanges();

      expect(component.visible()).toBe(true);
      expect(component.message()).toBe('Default duration message');
      expect(component.type()).toBe('notification');

      tick(4000);
      expect(component.visible()).toBe(false);
    }));
  });

  describe('UI rendering', () => {
    it('should not render when not visible', () => {
      component.visible.set(false);
      fixture.detectChanges();

      const notificationElement = fixture.nativeElement.querySelector('div');
      expect(notificationElement).toBeNull();
    });

    it('should render with correct CSS classes for alert type', () => {
      component.visible.set(true);
      component.type.set('alert');
      component.message.set('Alert message');
      fixture.detectChanges();

      const notificationElement = fixture.nativeElement.querySelector('div');
      expect(notificationElement).toBeTruthy();
      expect(notificationElement.classList).toContain('bg-red-500');
      expect(notificationElement.classList).toContain('border-red-700');
    });

    it('should render with correct CSS classes for success type', () => {
      component.visible.set(true);
      component.type.set('success');
      component.message.set('Success message');
      fixture.detectChanges();

      const notificationElement = fixture.nativeElement.querySelector('div');
      expect(notificationElement).toBeTruthy();
      expect(notificationElement.classList).toContain('bg-green-500');
      expect(notificationElement.classList).toContain('border-green-700');
    });

    it('should render with correct CSS classes for notification type', () => {
      component.visible.set(true);
      component.type.set('notification');
      component.message.set('Info message');
      fixture.detectChanges();

      const notificationElement = fixture.nativeElement.querySelector('div');
      expect(notificationElement).toBeTruthy();
      expect(notificationElement.classList).toContain('bg-orange-500');
      expect(notificationElement.classList).toContain('border-orange-700');
    });

    it('should display the correct message text', () => {
      const testMessage = 'This is a test notification';
      component.visible.set(true);
      component.message.set(testMessage);
      fixture.detectChanges();

      const messageElement = fixture.nativeElement.querySelector('p');
      expect(messageElement.textContent).toBe(testMessage);
    });
  });

  describe('Multiple notifications', () => {
    it('should handle rapid consecutive notifications', fakeAsync(() => {
      NotificationComponent.show('alert', 'First message', 1000);
      tick(100);

      NotificationComponent.show('success', 'Second message', 1000);
      fixture.detectChanges();

      expect(component.message()).toBe('Second message');
      expect(component.type()).toBe('success');

      tick(1000);
      expect(component.visible()).toBe(false);
    }));
  });
});
