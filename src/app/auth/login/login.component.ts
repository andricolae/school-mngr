import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
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
  isAuthenticated = false;

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
    }

    this.authService.login(this.email, this.password).pipe().subscribe({
      next: response => {
        console.log('User logged in!', response);
        this.router.navigate(['/home']);
      }
    });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  resetPassword() {
    if (!this.email) {
      alert("Please enter your email before resetting the password to your account!")
      return;
    }

    this.authService.resetPassword(this.email).pipe().subscribe(
      () => {
        alert("If your email has been registered, a password reset link has been sent to you!");
      },
      (error) => {
        console.error(error);
        alert("Unable to send reset email");
      }
    );
  }
}
