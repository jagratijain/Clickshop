import { Component, OnInit } from '@angular/core';
import { CartItem } from '../../../models/CartItems';
import { Router } from '@angular/router';
import { CartService } from '../../../services/cart/get-cart.service';
import { RazorpayService } from '../../../services/user/razorpay.service';
import { HotToastService } from '@ngxpert/hot-toast';
import confetti from 'canvas-confetti';
import { ProfileService } from '../../../services/user/profile.service';

@Component({
  selector: 'app-cart-items',
  standalone: false,
  templateUrl: './cart-items.component.html',
  styleUrl: './cart-items.component.css'
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  user: any = null;
  isLoading: boolean = true;
  cartTotal: number = 0;
  shippingCost: number = 99;
  discountCode: string = '';
  discountApplied: boolean = false;
  discountRate: number = 0;
  discountAmount: number = 0;
  processingOrder: boolean = false;
  customerInfo: any = {};


  placeholderProduct: string = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5YNRPU4910yPsW1yobc1J7of1kMM-pww1Qf5lkpKePvG1-3GeRFJPh0U9w0FLoeojueyp4HtPxcqWkGJOudVgEv3tpEnJQM9-Ia-eemENMJTFpTFm6WeZiiB2nBRDIwl9PeRGvsjEJTI/s1600/placeholder-image.jpg'

  constructor(
    private cartService: CartService,
    private router: Router,
    private razorpayService: RazorpayService,
    private toast: HotToastService,
    private userService: ProfileService,

  ) { }

  ngOnInit(): void {
    this.fetchCartItems();
    this.loadUserProfile();

  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.userService.getUserProfile().subscribe({
      next: (userData) => {
        this.user = userData;
        this.isLoading = false;
        console.log(this.user);

      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.isLoading = false;
      }
    });
  }

  fetchCartItems(): void {
    this.isLoading = true;
    this.cartService.getCartItemsWithProductDetails().subscribe({
      next: (items) => {
        this.cartItems = items.map(item => ({
          ...item,
          subtotal: item.totalPrice,
          price: item.totalPrice / item.quantity
        }));
        // if (this.cartItems.length > 0) {
        //   this.fireConfetti();
        // }
        this.calculateTotal();
        this.isLoading = false;
        console.log(this.cartItems);

      },
      error: (err) => {
        console.error('Failed to fetch cart items:', err);
        this.isLoading = false;
      }
    });
  }

  calculateTotal(): void {
    this.cartTotal = this.cartItems.reduce((total, item) => total + (item.subtotal || 0), 0);
  }

  updateQuantity(item: CartItem, change: number): void {
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) return;

    this.cartService.updateQuantity(item.cartId, newQuantity).subscribe({
      next: () => {
        item.quantity = newQuantity;
        item.subtotal = item.price * newQuantity;
        this.cartService.refreshCartCount()
        this.calculateTotal();
      },
      error: (err) => console.error('Error updating quantity:', err)
    });
  }

  removeItem(cartId: number): void {

    this.cartService.removeItem(cartId).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter(item => item.cartId !== cartId);
        this.cartService.refreshCartCount()
        this.calculateTotal();

        alert('Item removed from cart!')
      },
      error: (err) => console.error('Error removing item:', err)


    });
  }

  applyDiscount(): void {
    if (!this.discountCode) {
      this.toast.error('Please enter a valid discount code!');
      return;
    }

    if (this.discountCode === 'SAVE10') {
      this.discountAmount = this.cartTotal * 0.1;
      this.discountRate = 0.1;
      this.discountApplied = true;
    } else if (this.discountCode === 'WELCOME20') {
      this.discountAmount = this.cartTotal * 0.2;
      this.discountRate = 0.2;
      this.discountApplied = true;
    } else {
      alert('Invalid discount code');
    }
  }

  viewProductDetails(productId: number): void {
    this.router.navigate(['/product', productId], {
      queryParams: { from: 'cart' }
    }).then(() => {
      window.scrollTo(0, 0);
    });
  }

  processCheckout(): void {
    if (this.cartItems.length === 0) {
      this.toast.error('Your cart is empty');
      return;
    }

    // Check if user has required information
    if (!this.user || !this.user.address || !this.user.phone) {
      // Show a modal or redirect to profile completion page
      this.toast.error('Please update your address and contact information before checkout');

      setTimeout(() => {
        this.router.navigate(['/profile'], {
          queryParams: {
            returnUrl: '/cart',
            requiresUpdate: true
          }
        });
      }, 3000)
      return;
    }

    this.processingOrder = true;

    const orderData = {
      items: this.cartItems,
      subtotal: this.cartTotal,
      shipping: this.shippingCost,
      discount: (this.cartTotal + this.shippingCost) * this.discountRate,
      discountRate: this.discountRate,
      total: this.cartTotal + this.shippingCost - this.discountAmount
    };

    // Create an order in the backend first
    this.cartService.createOrder(orderData).subscribe({
      next: (orderResponse) => {
        console.log(orderResponse);
        this.initiatePayment(orderData, orderResponse);
        console.log(orderData);


      },
      error: (err) => {
        console.error('Error creating order:', err);
        this.processingOrder = false;
        this.toast.error('Unable to process your order. Please try again.');
      }
    });
  }

  initiatePayment(orderData: any, originalData: any): void {
    console.log("orderData");
    console.log(orderData);
    console.log("originalData");
    console.log(originalData);

    const options = {
      key: 'rzp_test_nszEMOVRLAZUFz',
      amount: Math.round(originalData.amount), // Amount in paisa
      currency: 'INR',
      name: 'ClickShop',
      discount: this.discountAmount,
      description: 'Purchase from ClickShop',
      order_id: originalData.razorpayOrderId,
      prefill: {
        name: originalData.user.name,
        email: originalData.user.email,
        contact: originalData.user.phone
      },
      notes: {
        address: 'Jagrati Jain'
      },
      theme: {
        color: '#4f46e5'
      },
      handler: (response: any) => {
        this.handlePaymentSuccess(response, orderData, originalData);
      }
    };

    // Load and open Razorpay
    this.loadRazorpayScript().then(() => {
      this.razorpayService.initPayment(options)
        .catch((error) => {
          console.error('Payment failed:', error);
          this.processingOrder = false;
          this.toast.error('Payment failed. Please try again.');
        });
    });
  }


  handlePaymentSuccess(response: any, orderData: any, originalData: any): void {
    // To verify payment

    const paymentData = {
      razorpayPaymentId: response.razorpay_payment_id,
      razorpayOrderId: response.razorpay_order_id,
      razorpaySignature: response.razorpay_signature,
      orderId: orderData.orderId
    };

    console.log(orderData);

    this.razorpayService.verifyPayment(paymentData).subscribe({
      next: (verificationResponse) => {

        this.cartService.saveOrder({
          ...orderData,
          paymentId: response.razorpay_payment_id,
          paymentStatus: 'COMPLETED',
          discount: this.discountAmount,
          discountRate: this.discountRate
        }, originalData).subscribe({
          next: (finalOrderResponse) => {
            this.cartService.clearCart().subscribe(() => {
              this.processingOrder = false;
              this.toast.success('Payment successful! Order placed.');
              this.fireConfetti();
              this.router.navigate(['/orders'], {
                state: { orderDetails: finalOrderResponse }
              });
            });
          },
          error: (err) => {
            console.error('Error saving order after payment:', err);
            this.processingOrder = false;
            this.toast.error('Your payment was successful but we had trouble saving your order. Please contact support with your payment ID: ' + response.razorpay_payment_id);
          }
        });
      },
      error: (err) => {
        console.error('Payment verification failed:', err);
        this.processingOrder = false;
        this.toast.error('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
      }
    });
  }

  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => {
        this.toast.error('Failed to load payment gateway. Please try again.');
        this.processingOrder = false;
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  private fireConfetti() {
    const count = 600; // Increased particle count

    function fireFromLeftCorner(particleRatio: number, opts: any) {
      confetti({
        origin: {
          x: 0.1, // Left side
          y: 0.9, // Bottom
        },
        angle: 60, // Angle upward and right
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    function fireFromRightCorner(particleRatio: number, opts: any) {
      confetti({
        origin: {
          x: 0.9, // Right side
          y: 0.9, // Bottom
        },
        angle: 120, // Angle upward and left
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    // Fire from left corner
    fireFromLeftCorner(0.25, { spread: 30, startVelocity: 55 });
    fireFromLeftCorner(0.2, { spread: 60, decay: 0.94 });
    fireFromLeftCorner(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });

    // Fire from right corner
    fireFromRightCorner(0.25, { spread: 30, startVelocity: 55 });
    fireFromRightCorner(0.2, { spread: 60, decay: 0.94 });
    fireFromRightCorner(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });

    // Additional bursts with colors from both corners
    // setTimeout(() => {
    //   fireFromLeftCorner(0.2, { 
    //     colors: ['#ff0000', '#00ff00', '#ffff00'],
    //     startVelocity: 45,
    //     decay: 0.92
    //   });

    //   fireFromRightCorner(0.2, { 
    //     colors: ['#0000ff', '#ff00ff', '#00ffff'],
    //     startVelocity: 45,
    //     decay: 0.92
    //   });
    // }, 300);


  }

  getFormattedPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'INR' }).format(price);
  }


}
