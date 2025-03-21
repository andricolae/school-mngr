import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-mgmt',
  imports: [FormsModule],
  templateUrl: './user-mgmt.component.html',
  styleUrl: './user-mgmt.component.css'
})
export class UserMgmtComponent {
  users = [
    { id: 1, name: 'Alice Johnson', role: 'Teacher' },
    { id: 2, name: 'Brian Smith', role: 'Student' },
    { id: 3, name: 'Carlos Rivera', role: 'Student' },
    { id: 4, name: 'Diana Lee', role: 'Teacher' },
    { id: 5, name: 'Emily Wang', role: 'Student' },
    { id: 6, name: 'Frank Thompson', role: 'Teacher' },
    { id: 7, name: 'Grace Kim', role: 'Student' },
    { id: 8, name: 'Henry Patel', role: 'Student' },
    { id: 9, name: 'Isla Moore', role: 'Teacher' },
    { id: 10, name: 'Jack Nguyen', role: 'Student' },
  ];

  newUser = { name: '', role: '', schoolId: '' };

  addUser() {
    if (this.newUser.name && this.newUser.role && this.newUser.schoolId) {
      this.users.push({
        id: this.users.length + 1,
        name: this.newUser.name,
        role: this.newUser.role,
      });
      this.newUser = { name: '', role: '', schoolId: '' };
    }
  }

  deleteUser(id: number) {
    this.users = this.users.filter(user => user.id !== id);
  }
}
