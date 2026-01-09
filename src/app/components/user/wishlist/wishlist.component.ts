
import { Component, OnInit } from '@angular/core';
import { HotToastService } from '@ngxpert/hot-toast';
import { AuthService } from '../../../services/authService/auth.service';
import { WishlistService } from '../../../services/user/wishlist.service';
import { ProductServiceService } from '../../../services/productService/product-service.service';
import { CartService } from '../../../services/cart/get-cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-wishlist',
  standalone: false,
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent implements OnInit {
  wishlistItems: any[] = [];
  isLoading: boolean = true;

  constructor(
    private wishlistService: WishlistService,
    private authService: AuthService,
    private toastr:HotToastService,
    private productService: ProductServiceService,
    private cartService: CartService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    // if (!this.authService.isLoggedIn()) {
    //   this.router.navigate(['/login']);
    //   return;
    // }
    this.loadWishlist();
  }

  loadWishlist() {
    this.isLoading = true;
    this.wishlistService.getWishlist().subscribe(
      (data) => {
        this.wishlistItems = data;
        this.isLoading = false;
        console.log(this.wishlistItems);
        
      },
      (error) => {
        console.error('Error fetching wishlist:', error);
        this.toastr.error('Failed to load wishlist');
        this.isLoading = false;
      }
    );
  }

  viewProductDetails(productId: number): void {
    this.router.navigate(['/product', productId], {
      queryParams: { from: 'wishlist' }
    }).then(() => {
      window.scrollTo(0, 0);
    });
    ;
  }

  removeFromWishlist(productId: number) {
    this.wishlistService.removeFromWishlist(productId).subscribe(
      () => {
        this.wishlistItems = this.wishlistItems.filter(item => item.product.id !== productId);
        this.toastr.success('Product removed from wishlist');
      },
      (error) => {
        console.error('Error removing from wishlist:', error);
        this.toastr.error('Failed to remove product from wishlist');
      }
    );
  }

  addToCart(product: any) {
    this.productService.addToCart(product, 1).subscribe(
      () => {
        this.toastr.success('Product added to cart');
        this.cartService.refreshCartCount();
      },
      (error) => {
        console.error('Error adding to cart:', error);
        this.toastr.error('Failed to add product to cart');
      }
    );
  }

  clearWishlist() {
    // Optional: Add a confirmation dialog here
    if (confirm('Are you sure you want to clear your entire wishlist?')) {
      this.wishlistService.clearWishlist().subscribe(
        () => {
          this.wishlistItems = [];
          this.toastr.success('Wishlist cleared successfully');
        },
        (error) => {
          console.error('Error clearing wishlist:', error);
          this.toastr.error('Failed to clear wishlist');
        }
      );
    }
  }

  placeholderProduct: string = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5YNRPU4910yPsW1yobc1J7of1kMM-pww1Qf5lkpKePvG1-3GeRFJPh0U9w0FLoeojueyp4HtPxcqWkGJOudVgEv3tpEnJQM9-Ia-eemENMJTFpTFm6WeZiiB2nBRDIwl9PeRGvsjEJTI/s1600/placeholder-image.jpg'
}
