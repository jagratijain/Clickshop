import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminServiceService } from '../../../services/admin/admin-service.service';
import { HotToastService } from '@ngxpert/hot-toast';


@Component({
  selector: 'app-view-products',
  standalone: false,
  templateUrl: './view-products.component.html',
  styleUrl: './view-products.component.css'
})
export class ViewProductsComponent implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  displayedProducts: any[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';
  searchTerm: string = '';
  categoryFilter: string = 'all';
  categories: string[] = [];
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10; // Changed to 10 for table view
  totalPages: number = 1;
  
  // Delete modal
  showDeleteModal: boolean = false;
  productToDelete: any = null;

  // Make Math available to template
  Math = Math;

  constructor(
    private router: Router,
    private adminService: AdminServiceService,
    private toast:HotToastService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.adminService.getAllProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.extractCategories();
        this.filterProducts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.toast.error('Failed to load products. Please try again.')
        this.isLoading = false;
      }
    });
  }

  extractCategories(): void {
    // Extract unique categories from products
    const categorySet = new Set<string>();
    this.products.forEach(product => {
      if (product.category) {
        categorySet.add(product.category);
      }
    });
    this.categories = Array.from(categorySet).sort();
  }

  filterProducts(): void {
    let result = [...this.products];
    
    // Apply search term filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(product => 
        product.name?.toLowerCase().includes(term) || 
        product.description?.toLowerCase().includes(term) ||
        product.category?.toLowerCase().includes(term)
      );
    }
    
    // Apply category filter
    if (this.categoryFilter !== 'all') {
      result = result.filter(product => product.category === this.categoryFilter);
    }
    
    this.filteredProducts = result;
    this.totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
    
    // Adjust current page if needed
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    
    this.updateDisplayedProducts();
  }

  updateDisplayedProducts(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  editProduct(product: any): void {
    this.router.navigate(['/admin/viewproducts/edit', product.id]);
  }

  confirmDeleteProduct(product: any): void {
    this.productToDelete = product;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.productToDelete = null;
    this.showDeleteModal = false;
  }

  deleteProduct(): void {
    if (!this.productToDelete) return;
    
    this.adminService.deleteProduct(this.productToDelete.id).subscribe({
      next: () => {
        // Remove product from arrays
        this.products = this.products.filter(p => p.id !== this.productToDelete.id);
        this.filterProducts(); // This will also update displayedProducts
        
        this.toast.success(`Product "${this.productToDelete.name}" has been deleted successfully`)
        // Reset modal state
        this.showDeleteModal = false;
        this.productToDelete = null;
        
      },
      error: (error) => {
        console.error('Error deleting product:', error);
        this.toast.error('Failed to delete product. Please try again.')
        this.showDeleteModal = false;
        
      }
    });
  }

  // Pagination methods
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedProducts();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedProducts();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedProducts();
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
