import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  email = '';
  password = '';
  name = '';

  constructor(private router: Router) {}

  register() {
    console.log('Register clicked', { name: this.name, email: this.email, password: this.password });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
