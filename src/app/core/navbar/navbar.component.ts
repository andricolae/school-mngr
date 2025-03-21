import { Component } from '@angular/core';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {
    this.isTeacher = true;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  logout() {
  }
}
