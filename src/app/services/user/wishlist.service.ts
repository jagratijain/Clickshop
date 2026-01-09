import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = `${environment.apiUrl}/wishlist`;
  
  private token = localStorage.getItem('authToken');

  constructor(private http: HttpClient) { }

  // Get all wishlist items for the logged-in user
  getWishlist(): Observable<any> {
    
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();
    return this.http.get(`${this.apiUrl}`, {
      headers,
      withCredentials: true
    });
  }

  // Add a product to wishlist
  addToWishlist(productId: number): Observable<any> {
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();

    return this.http.post(`${this.apiUrl}/add/${productId}`, {}, {
      headers,
      withCredentials: true
    });
  }

  // Remove a product from wishlist
  removeFromWishlist(productId: number): Observable<any> {
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();

    return this.http.delete(`${this.apiUrl}/remove/${productId}`, {
      headers,
      withCredentials: true
    });
  }

  // Check if a product is in the user's wishlist
  isProductInWishlist(productId: number): Observable<any> {
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();
    return this.http.get(`${this.apiUrl}/check/${productId}`, {
      headers,
      withCredentials: true
    });
  }

  clearWishlist(): Observable<any> {
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();
    return this.http.delete(`${this.apiUrl}/clear`, {
      headers,
      withCredentials: true
    });
  }

}
