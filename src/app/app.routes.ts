import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AdminDashComponent } from './dashboard/admin-dash/admin-dash.component';
import { TeacherDashComponent } from './dashboard/teacher-dash/teacher-dash.component';
import { StudentDashComponent } from './dashboard/student-dash/student-dash.component';
import { UnauthorizedComponent } from './core/unauthorized.component';
import { HomeComponent } from './core/home.component';
import { roleGuard } from './core/guards/role.guards';
import { LogViewerComponent } from './dashboard/admin-dash/log-viewer/log-viewer.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'admin/dashboard', component: AdminDashComponent, canActivate: [roleGuard(['Admin'])] },
  { path: 'admin/logs', component: LogViewerComponent, canActivate: [roleGuard(['Admin'])] },
  { path: 'teacher/dashboard', component: TeacherDashComponent, canActivate: [roleGuard(['Teacher'])] },
  { path: 'student/dashboard', component: StudentDashComponent, canActivate: [roleGuard(['Student'])] },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: 'home', component: HomeComponent },
  { path: '**', redirectTo: '/home' }
];
