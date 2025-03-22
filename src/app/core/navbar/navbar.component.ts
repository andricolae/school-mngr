import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  constructor(private router: Router) { }

  private auth = inject(AuthService);

  user = this.auth.user;

  isAuthenticated = computed(() => !!this.user());
  isAdmin = computed(() => this.user()?.role === 'Admin');
  isTeacher = computed(() => this.user()?.role === 'Teacher');
  isStudent = computed(() => this.user()?.role === 'Student');

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
