import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(private router: Router, private auth: AuthService) {}

  async login() {
    try {
      const { role } = await this.auth.login(this.email, this.password);

      if (role === 'Admin') this.router.navigate(['/admin/dashboard']);
      else if (role === 'Teacher') this.router.navigate(['/teacher/dashboard']);
      else this.router.navigate(['/student/dashboard']);
    } catch (err: any) {
      alert('Login failed');
    }
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
