import { Component, OnInit } from '@angular/core';
import { ProductServiceService } from '../../../services/productService/product-service.service';
import { Product } from '../../../models/Product';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../services/cart/get-cart.service';
import { HotToastService } from '@ngxpert/hot-toast';
import { catchError, of } from 'rxjs';
import { WishlistService } from '../../../services/user/wishlist.service';
import { AuthService } from '../../../services/authService/auth.service';

@Component({
  selector: 'app-products',
  standalone: false,
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProduct: Product[] = [];
  loading: boolean = true;
  searchTerm: string = '';
  categories: string[] = [];
  selectedCategory: string = 'All';
  wishlistProductIds: Set<number> = new Set();
  isLoading: boolean = true;

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 8;
  totalPages: number = 1;
  paginatedProducts: Product[] = [];
  Math: any;

  constructor(
    private productService: ProductServiceService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private authService: AuthService,
    private router: Router,
    private toast: HotToastService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.loadCategories();

    if (this.authService.isLoggedIn()) {
      this.loadWishlist();
    }

    // Check for category parameter in URL
    this.route.queryParams.subscribe(params => {
      if (params['page']) {
        this.currentPage = +params['page'];
      } else {
        this.currentPage = 1;
      }

      if (params['category']) {
        this.selectedCategory = params['category'];
        this.loadProductsByCategory(this.selectedCategory);
      } else {
        this.loadProducts();
      }

      if (params['search']) {
        this.searchTerm = params['search'];
        this.applyFilters();
      }
    });
  }

  clearFilter():void{
    this.searchTerm = ''; 
    this.selectedCategory = 'All'
    this.router.navigate(['/products'], {
      queryParams: {} 
    });
  }

  loadCategories(): void {
    this.isLoading = true;
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.isLoading = false;
      }
    });
  }

  loadProductsByCategory(category: string): void {
    this.loading = true;
    this.selectedCategory = category;

    // Update URL with the selected category
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        category: category !== 'All' ? category : null,
        page: this.currentPage
      },
      queryParamsHandling: 'merge'
    });

    if (category === 'All') {
      this.loadProducts();
      return;
    }

    this.productService.getProductsByCategory(category).subscribe({
      next: (products) => {
        this.products = products;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error(`Error loading products for category ${category}:`, error);
        this.loading = false;
      }
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getAllProducts().subscribe({
      next: (data) => {
        this.products = data;
        // Extract unique categories
        const uniqueCategories = new Set<string>();
        this.products.forEach(product => {
          if (product.category) {
            uniqueCategories.add(product.category);
          }
        });
        this.categories = Array.from(uniqueCategories);
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching products:', error);
        this.loading = false;
      }
    });
  }



  filterProducts(): void {
    if (!this.searchTerm.trim()) {
      this.filteredProduct = [...this.products];
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredProduct = this.products.filter(product =>
      product.name.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term)
    );
  }

  applyFilters(): void {
    // Filter products by search term and category
    this.filteredProduct = this.products.filter(product => {
      const matchesSearch = !this.searchTerm.trim() ||
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCategory = this.selectedCategory === 'All' || product.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Calculate total pages
    this.totalPages = Math.ceil(this.filteredProduct.length / this.pageSize);

    // Ensure current page is within bounds
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
      this.updatePageUrl();
    }

    // Paginate the filtered products
    this.paginateProducts();
  }

  paginateProducts(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.filteredProduct.length);
    this.paginatedProducts = this.filteredProduct.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.updatePageUrl();
    this.paginateProducts();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updatePageUrl(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: this.currentPage,
        category: this.selectedCategory !== 'All' ? this.selectedCategory : null,
        search: this.searchTerm || null
      },
      queryParamsHandling: 'merge'
    });
  }

  getPageNumbers(): number[] {
    const totalPageCount = this.totalPages;
    const currentPage = this.currentPage;
    const visiblePages = 3;

    let startPage: number;
    let endPage: number;

    if (totalPageCount <= visiblePages) {
      // Show all pages
      startPage = 1;
      endPage = totalPageCount;
    } else {
      // Calculate start and end pages
      if (currentPage <= Math.ceil(visiblePages / 2)) {
        startPage = 1;
        endPage = visiblePages;
      } else if (currentPage + Math.floor(visiblePages / 2) >= totalPageCount) {
        startPage = totalPageCount - visiblePages + 1;
        endPage = totalPageCount;
      } else {
        startPage = currentPage - Math.floor(visiblePages / 2);
        endPage = currentPage + Math.ceil(visiblePages / 2) - 1;
      }
    }

    return Array.from({ length: (endPage - startPage + 1) }, (_, i) => startPage + i);
  }

  addToCart(product: Product): void {
    if (!this.authService.isLoggedIn()) {
      this.toast.info('Please login to add items to cart');
      return;
    }
    
    this.productService.addToCart(product).pipe(
      catchError((error) => {
        console.error('Error adding to cart:', error);

        if (error.status === 401 && error.error && error.error.message === 'Please login to add items to cart') {
          this.toast.info(error.error.message || 'Please login to add items to cart');
          return of({ _handled: true, originalError: error });
        }

        this.toast.error('Failed to add product to cart. Please try again.');
        return of({ _handled: true, originalError: error });
      })
    ).subscribe({
      next: (res) => {
        if (res && res._handled) {
          return;
        }

        // Success case
        if (res.message) {
          this.toast.success(res.message);
        }
        this.cartService.refreshCartCount();
      },
      error: () => { }
    });
  }

  loadWishlist(): void {
    this.wishlistService.getWishlist().subscribe(
      wishlistItems => {
        // Clear the set first
        this.wishlistProductIds.clear();

        // Add product IDs to the set
        wishlistItems.forEach((item: { product: { id: number } }) => {
          this.wishlistProductIds.add(item.product.id);
        });
      },
      error => {
        console.error('Error fetching wishlist:', error);
      }
    );
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistProductIds.has(productId);
  }

  toggleWishlist(event: Event, product: any): void {
    event.stopPropagation(); // Prevent event bubbling

    if (!this.authService.isLoggedIn()) {
      this.toast.info('Please login to use wishlist features');
      return;
    }

    if (this.isInWishlist(product.id)) {
      this.removeFromWishlist(product.id);
    } else {
      this.addToWishlist(product.id);
    }
  }

  addToWishlist(productId: number): void {
    this.wishlistService.addToWishlist(productId).subscribe(
      () => {
        this.wishlistProductIds.add(productId);
        this.toast.success('Product added to wishlist');
      },
      error => {
        console.error('Error adding to wishlist:', error);

        // Check if the error contains a login required message
        if (error.status === 401 || (error.error && error.error.message === 'Please login to add items to wishlist')) {
          this.toast.info('Please login to add items to wishlist');
        } else {
          this.toast.error('Failed to add product to wishlist');
        }
      }
    );
  }

  removeFromWishlist(productId: number): void {
    this.wishlistService.removeFromWishlist(productId).subscribe(
      () => {
        this.wishlistProductIds.delete(productId);
        this.toast.success('Product removed from wishlist');
      },
      error => {
        console.error('Error removing from wishlist:', error);
        this.toast.error('Failed to remove product from wishlist');
      }
    );
  }

  placeholderProduct: string = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5YNRPU4910yPsW1yobc1J7of1kMM-pww1Qf5lkpKePvG1-3GeRFJPh0U9w0FLoeojueyp4HtPxcqWkGJOudVgEv3tpEnJQM9-Ia-eemENMJTFpTFm6WeZiiB2nBRDIwl9PeRGvsjEJTI/s1600/placeholder-image.jpg'

  viewProductDetails(productId: number): void {
    this.router.navigate(['/product', productId]).then(() => {
      window.scrollTo(0, 0);
    });;
  }
}