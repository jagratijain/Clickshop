import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminServiceService } from '../../../services/admin/admin-service.service';
import { AuthService } from '../../../services/authService/auth.service';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-view-users',
  standalone: false,
  templateUrl: './view-users.component.html',
  styleUrl: './view-users.component.css'
})
export class ViewUsersComponent {
  
  users: any[] = [];
  filteredUsers: any[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';
  searchTerm: string = '';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  
  Math = Math; // Make Math available in the template

  constructor(
    private adminService: AdminServiceService,
    private toast:HotToastService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        // Filter out admin users, only keep regular users
        this.users = data.filter(user => user.role === 'USER');
        this.filterUsers();
        this.isLoading = false;
        console.log(this.users);
        
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.toast.error(`Failed to load users. Please try again.`)
        this.isLoading = false;
      }
    });
  }

  filterUsers(): void {
    let result = [...this.users];
    
    // Apply search term filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(user => 
        user.name?.toLowerCase().includes(term) || 
        user.email?.toLowerCase().includes(term) || 
        user.username?.toLowerCase().includes(term)
      );
    }
    
    this.filteredUsers = result;
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    
    // Adjust current page if needed
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
  }

  promoteToAdmin(user: any): void {
    this.adminService.promoteToAdmin(user.username).subscribe({
      next: () => {
        // this.toast.success(`User ${user.name} has been promoted to admin successfully!`)
        this.toast.success(`User has been promoted successfully!`)
        // Remove user from the list since they're now an admin
        this.users = this.users.filter(u => u.id !== user.id);
        this.filterUsers();
        
        
      },
      error: (error) => {
        console.error('Error promoting user:', error);
        this.toast.error('Failed to promote user. Please try again.')
        
      }
    });
  }
  
  activateUser(user: any): void {
    this.adminService.activateUser(user.id).subscribe({
      next: () => {
        user.status = 'ACTIVE';
        this.toast.success(`User ${user.name} has been activated!`)
      },
      error: err => {
        console.error('Activation failed', err);
      }
    });
  }

  deactivateUser(user: any): void {
    this.adminService.deactivateUser(user.id).subscribe({
      next: () => {
        user.status = 'INACTIVE';
        this.toast.success(`User ${user.name} has been deactivated!`)
      },
      error: err => {
        console.error('Deactivation failed', err);
      }
    });
  }

  // Pagination methods
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      // Show all pages if there are 5 or fewer
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex pagination logic for more than 5 pages
      if (this.currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (this.currentPage >= this.totalPages - 2) {
        // Near the end
        for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        for (let i = this.currentPage - 2; i <= this.currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  }
}
