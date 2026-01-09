import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../../../services/cart/get-cart.service';
import { AuthService } from '../../../services/authService/auth.service';
import { HotToastService } from '@ngxpert/hot-toast';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ProfileService } from '../../../services/user/profile.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  cartCount: number = 0;
  user: any = null
  selectedCategory: string = 'All';
  searchTerm: string = '';
  showSearch: boolean = false;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private userService: ProfileService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: HotToastService,
  ) { }

  ngOnInit(): void {
    // Only refresh cart count if user is logged in
    if (this.isLoggedIn()) {
      this.cartService.refreshCartCount();
      this.loadUserProfile();
    }


    this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });

    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategory = params['category'];
      } else {
        this.selectedCategory = '';
      }

      if (params['search']) {
        this.searchTerm = params['search'];
      }
    });
  }

  isActive(path: string): boolean {
    return this.router.url === path || this.router.url.startsWith(path);
  }

  toggleSearch(): void {
    this.showSearch = !this.showSearch;

    // Auto-focus on the search input when opened
    if (this.showSearch) {
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 0);
    }
  }

  submitSearch(event: Event): void {
    event.preventDefault();

    if (!this.searchTerm.trim()) {
      return;
    }

    // Navigate to products page with search query parameter
    this.router.navigate(['/products'], {
      queryParams: {
        search: this.searchTerm,
        category: this.selectedCategory || null
      },
      queryParamsHandling: 'merge'
    });

    // Close the search box after submitting
    this.showSearch = false;
    this.searchTerm = ''
  }

  onSearchKeyup(event: KeyboardEvent): void {
    // Close search on escape key
    if (event.key === 'Escape') {
      this.showSearch = false;
    }

    // Submit on enter key
    if (event.key === 'Enter') {
      this.submitSearch(event);
    }
  }


  loadUserProfile(): void {
    this.userService.getUserProfile().subscribe({
      next: (userData) => {
        this.user = userData;
        console.log(this.user);
      },

      error: (error) => {
        console.error('Error loading profile:', error);
      }
    });
  }

  isLoggedIn(): boolean {

    return this.authService.isLoggedIn();
  }

  login(): void {
    if (!this.isLoggedIn()) {
      this.toast.info('Please login first!');
      this.router.navigate(['/login']);
    }
  }
  
  signup(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/register']);
    }
  }

  @ViewChild('userDropdown') userDropdown!: ElementRef;
  isUserDropdownOpen = false;

  toggleUserDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.userDropdown.nativeElement.contains(event.target)) {
      this.isUserDropdownOpen = false;
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.toast.success('Logged out successfully');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Even if there's an error, navigate to login page
        this.router.navigate(['/login']);
      }
    });
    this.isUserDropdownOpen = false;
  }

  handleCartClick(event: Event): void {
    event.preventDefault();

    if (this.isLoggedIn()) {
      // User is logged in, navigate to cart
      console.log('User is logged in, navigating to cart');
      
      this.router.navigate(['/cart']);
    } else {
      // User is not logged in, show toast and navigate to login
      this.toast.info('Please login to access your cart');
      this.router.navigate(['/login']);
    }
  }

  handleWishlistClick(event: Event): void {
    event.preventDefault();

    if (this.isLoggedIn()) {
      // User is logged in, navigate to wishlist
      this.router.navigate(['/wishlist']);
    } else {
      // User is not logged in, show toast and navigate to login
      this.toast.info('Please login to access your wishlist');
      this.router.navigate(['/login']);
    }
  }
}