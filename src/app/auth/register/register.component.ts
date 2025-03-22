import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  role = '';

  constructor(private auth: AuthService, private router: Router) {}

  async register() {
    if (this.password !== this.confirmPassword) return;
    await this.auth.register(this.name, this.email, this.password, this.role);
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
