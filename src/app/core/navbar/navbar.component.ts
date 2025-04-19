import { LoggingService } from './../services/logging.service';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  isAuthenticated = false;
  isAdmin = false;
  isTeacher = false;
  isStudent = false;
  userRole: string | null = null;
  private userSub!: Subscription;

  constructor(private router: Router, private authService: AuthService, private loggingService: LoggingService) {}

  ngOnInit() {
    this.userSub = this.authService.user.subscribe(user => {
      this.isAuthenticated = !!user;
      this.userRole = user?.role ?? null;
    });
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
  }

  navigateToDashboard() {
    switch (this.userRole) {
      case 'Admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'Teacher':
        this.router.navigate(['/teacher/dashboard']);
        break;
      case 'Student':
        this.router.navigate(['/student/dashboard']);
        break;
      default:
        this.router.navigate(['/unauthorized']);
    }
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.loggingService.logNavigation('PAGE_NAVIGATION', `User navigated to ${route}`);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
