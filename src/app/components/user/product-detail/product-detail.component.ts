// product-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductServiceService } from '../../../services/productService/product-service.service';
import { Product } from '../../../models/Product';
import { CartService } from '../../../services/cart/get-cart.service';
import { catchError, of } from 'rxjs';
import { HotToastService } from '@ngxpert/hot-toast';
import { WishlistService } from '../../../services/user/wishlist.service';
import { AuthService } from '../../../services/authService/auth.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  loading: boolean = true;
  error: string | null = null;
  quantity: number = 1;
  wishlistProductIds: Set<number> = new Set();
  backButtonText: string = 'Back to Products';

  placeholderProduct: string = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5YNRPU4910yPsW1yobc1J7of1kMM-pww1Qf5lkpKePvG1-3GeRFJPh0U9w0FLoeojueyp4HtPxcqWkGJOudVgEv3tpEnJQM9-Ia-eemENMJTFpTFm6WeZiiB2nBRDIwl9PeRGvsjEJTI/s1600/placeholder-image.jpg'
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private authService: AuthService,
    private productService: ProductServiceService,
    private toast:HotToastService
  ) { }
  relatedProducts: Product[] = [];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = +params['id'];
      this.loadProductDetails(productId);
    });
    this.setBackButtonText();

    if (this.authService.isLoggedIn()) {
      this.loadWishlist();
    }

    this.productService.getAllProducts().subscribe(products => {
      this.relatedProducts = products.filter(p => 
        p.category === this.product?.category && p.id !== this.product.id
      ).slice(0, 4); // Limit to 4 products
    });
  }

  private setBackButtonText(): void {
    // Get the referrer from query params or state
    const referrer = this.route.snapshot.queryParams['from'] || 
                    this.route.snapshot.queryParams['referrer'] ||
                    history.state?.from;

    switch (referrer) {
      case 'home':
        this.backButtonText = 'Back to Home';
        break;
      case 'wishlist':
        this.backButtonText = 'Back to Wishlist';
        break;
      case 'featured':
        this.backButtonText = 'Back to Featured';
        break;
      case 'recent':
        this.backButtonText = 'Back to Latest Drops';
        break;
      case 'cart':
        this.backButtonText = 'Back to Cart';
        break;
      default:
        this.backButtonText = 'Back to Products';
    }
  }

  viewProductDetails(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  loadProductDetails(productId: number): void {
    this.loading = true;
    this.productService.getProductById(productId).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
        console.log(product);
        
      },
      error: (err) => {
        console.error('Error loading product details:', err);
        this.error = 'Unable to load product details. Please try again later.';
        this.loading = false;
      }
    });
  }

  incrementQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.authService.isLoggedIn()) {
      this.toast.info("Please login to add item to cart!")
      return
    }

    if (this.product) {
      
      this.productService.addToCart(this.product, this.quantity).pipe(
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
        error: () => {}
      });
    }
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
      this.toast.info("Please login to use wishlist features!")
      return
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

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/products']);
    }
  }
  
}