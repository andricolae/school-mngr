import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  email = '';
  password = '';
  confirmPassword = '';
  name = '';
  role = '';
  isAuthenticated = false;
  isResetting = false;

  constructor(
    private router: Router,
    private authService: AuthService) {}

  ngOnInit() {
    this.authService.user.subscribe(user => {
      this.isAuthenticated = !!user;
    })
  }

  onSubmit(form: NgForm) {
    if (!form.valid) {
      return;
    } else if (this.password !== this.confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    this.authService.signup(this.email, this.password, this.name, this.role).subscribe({
      next: () => {
        alert('Account created! Please log in.');
        form.reset();
        this.email = '';
        this.password = '';
        this.confirmPassword = '';
        this.name = '';
        this.role = '';
      },
      error: (err) => {
        alert('Failed to register: ' + err.message);
      }
    });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
