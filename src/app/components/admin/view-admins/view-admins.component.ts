import { Component, OnInit } from '@angular/core';
import { AdminServiceService } from '../../../services/admin/admin-service.service';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-view-admins',
  standalone: false,
  templateUrl: './view-admins.component.html',
  styleUrl: './view-admins.component.css'
})
export class ViewAdminsComponent implements OnInit {
  
  admins: any[] = [];
  filteredAdmins: any[] = [];
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
    this.loadAdmins();
  }

  loadAdmins(): void {
    this.isLoading = true;
    this.adminService.getAdminUsers().subscribe({
      next: (data) => {
        // Filter out non-admin users, only keep admins
        this.admins = data
        this.filterAdmins();
        this.isLoading = false;
        console.log(this.admins);
      },
      error: (error) => {
        console.error('Error loading admins:', error);
        this.toast.error('Failed to load admins. Please try again.')
        this.isLoading = false;
      }
    });
  }

  filterAdmins(): void {
    let result = [...this.admins];
    
    // Apply search term filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(admin => 
        admin.name?.toLowerCase().includes(term) || 
        admin.email?.toLowerCase().includes(term) || 
        admin.username?.toLowerCase().includes(term)
      );
    }
    
    this.filteredAdmins = result;
    this.totalPages = Math.ceil(this.filteredAdmins.length / this.pageSize);
    
    // Adjust current page if needed
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
  }

  demoteToUser(admin: any): void {
    this.adminService.demoteToUser(admin.username).subscribe({
      next: () => {
        // this.toast.success(`Admin ${admin.name} has been demoted successfully.`)
        this.toast.success(`Admin has been demoted successfully!`)
        // Remove admin from the list
        this.admins = this.admins.filter(a => a.id !== admin.id);
        this.filterAdmins();
        
        
      },
      error: (error) => {
        console.error('Error demoting admin:', error);
        this.toast.error('Failed to demote admin. Please try again.')
        
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