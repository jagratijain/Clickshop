import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CartItem } from '../../models/CartItems';
import { BehaviorSubject, catchError, forkJoin, map, Observable, switchMap, tap } from 'rxjs';
import { ProductServiceService } from '../productService/product-service.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();


  private apiUrl = environment.apiUrl;

  private token = localStorage.getItem('authToken');

  constructor(private http: HttpClient, private productservice: ProductServiceService) { }

  refreshCartCount(): void {
    this.getCartItems().subscribe(items => {
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      this.cartCountSubject.next(totalQuantity);
    });
  }

  getCartItems(): Observable<CartItem[]> {
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();

    return this.http.get<CartItem[]>(`${this.apiUrl}/users/cartitems`, { headers, withCredentials: true });
  }
  
  getCartItemsWithProductDetails(): Observable<any[]> {
    return this.getCartItems().pipe(
      // Map through the cart items
      switchMap((cartItems) => {
        // Fetch the product details for each cart item
        const productRequests = cartItems.map((item) =>
          this.productservice.getProductById(item.productId).pipe(
            // Combine the cart item with its product details
            map((product) => ({ ...item, product }))
          )
        );

        // Execute all the product fetch requests in parallel using forkJoin
        return forkJoin(productRequests);
      })
    );
  }


  updateQuantity(itemId: number, quantity: number): Observable<any> {
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();

    return this.http.put(`${this.apiUrl}/cart/update/${itemId}`, { quantity }, { headers, withCredentials: true });
  }

  removeItem(itemId: number): Observable<any> {
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();

    return this.http.delete(`${this.apiUrl}/cart/remove/${itemId}`, { headers, withCredentials: true });
  }

  clearCart(): Observable<any> {
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();

    return this.http.delete(`${this.apiUrl}/cart/clear`, { headers, withCredentials: true });
  }

  placeOrder(order: any): Observable<any> {
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();

    return this.http.post(`${this.apiUrl}/api/orders`, order, { headers, withCredentials: true });
  }
  createOrder(orderData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/payments/create-order`, orderData, {
      withCredentials: true
    }).pipe(
      switchMap(orderResponse => {
        const userId = orderResponse.userId;

        return this.http.get<any>(`${this.apiUrl}/users/${userId}`).pipe(
          map(user => {
            return {
              ...orderResponse,
              user
            };
          })
        );
      })
    );
  }


  // Save completed order after successful payment
  saveOrder(orderData: any, originalData: any): Observable<any> {

    console.log(orderData);
    console.log(originalData);

    const combinedOrderData = {
      ...originalData,
      discount: orderData.discount,
      shipping:orderData.shipping,
      paymentStatus:orderData.paymentStatus,
      paymentId:orderData.paymentId,
      total:orderData.total,
      subtotal:orderData.subtotal,
      discountRate:orderData.discountRate
    };


    return this.http.post(`${this.apiUrl}/orders/save`, combinedOrderData, {
      withCredentials: true
    }).pipe(
      tap((orderResponse: any) => {

        if (orderResponse && orderResponse.orderId) {

          // Reduce stock for each product
          if (originalData?.items && originalData.items.length > 0) {
            originalData.items.forEach((item: { productId: number, quantity: number }) => {
              this.http.post(`${this.apiUrl}/product/${item.productId}/reduce-stock`, {
                quantity: item.quantity
              }, {
                withCredentials: true
              }).subscribe({
                next: (stockResponse) => console.log(`Stock updated for product ${item.productId}`, stockResponse),
                error: (error) => console.error(`Failed to update stock for product ${item.productId}`, error)
              });
            });
          }

          // Prepare data for emails
          const emailPayload = {
            ...orderResponse,
            ...orderData,
            ...originalData,
            orderId: orderResponse.orderId
          };

          // Send customer email notification
          this.http.post(`${this.apiUrl}/email/send-customer-confirmation`, emailPayload, {
            withCredentials: true
          }).subscribe({
            next: (emailResponse) => console.log('Customer email notification sent successfully', emailResponse),
            error: (error) => console.error('Failed to send customer email notification', error)
          });

          // Send admin email notification
          this.http.post(`${this.apiUrl}/email/send-admin-notification`, emailPayload, {
            withCredentials: true
          }).subscribe({
            next: (emailResponse) => console.log('Admin email notification sent successfully', emailResponse),
            error: (error) => console.error('Failed to send admin email notification', error)
          });
        }
      }),
      catchError(error => {
        console.error('Error saving order:', error);
        throw error;
      })
    );
  }
}
