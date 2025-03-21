import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AdminDashComponent } from './dashboard/admin-dash/admin-dash.component';
import { TeacherDashComponent } from './dashboard/teacher-dash/teacher-dash.component';
import { StudentDashComponent } from './dashboard/student-dash/student-dash.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'admin/dashboard', component: AdminDashComponent },
  { path: 'teacher/dashboard', component: TeacherDashComponent },
  { path: 'student/dashboard', component: StudentDashComponent },
  { path: '**', redirectTo: '/login' }
];
