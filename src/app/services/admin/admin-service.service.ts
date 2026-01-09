import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminServiceService {
  
  private apiUrl = `${environment.apiUrl}/admin`;
  private apiUrl_Product = `${environment.apiUrl}/product`;
  private apiUrl_Orders = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) { }

  // Dashboard stats
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard-stats`, {
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error getting dashboard stats:', error);
        // Return empty stats in case of an array
        return of({
          userCount: 0,
          productCount: 0,
          orderCount: 0,
          totalRevenue: 0
        });
      })
    );
  }

  

  // Recent orders
  getRecentOrders(limit: number = 5): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/recent-orders`, {
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error getting recent orders:', error);
        // Return dummy for error handling
        return of([
          { id: 1, date: new Date(), total: 0, status: 'NA' },
        ]);
      })
    );
  }

  // User management
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/viewusers`, {
      withCredentials: true
    });
  }

  getAdminUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/viewadmins`, {
      withCredentials: true
    });
  }

  promoteToAdmin(userName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/promote`, { userName }, {
      withCredentials: true
    });
  }

  activateUser(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateUser(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/deactivate`, {});
  }

  demoteToUser(userName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/demote`, { userName }, {
      withCredentials: true
    });
  }

  // Product management
  getAllProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/viewproducts`, {
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error fetching products:', error);
        // Return empty array in case of error
        return of([]);
      })
    );
  }

  /**
   * Get a single product by ID
   */
  getProductById(productId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl_Product}/${productId}`, {
      withCredentials: true
    });
  }

  /**
   * Add a new product
   */
  addProduct(productData: any): Observable<any> {
    return this.http.post(`${this.apiUrl_Product}/add`, productData, {
      withCredentials: true,
      responseType: 'text'
    });
  }

  /**
   * Update an existing product
   */
  updateProduct(productId: number, productData: any): Observable<any> {
    return this.http.put(`${this.apiUrl_Product}/update/${productId}`, productData, {
      withCredentials: true,
      responseType: 'text'
    });
  }

  /**
   * Delete a product
   */
  deleteProduct(productId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl_Product}/delete/${productId}`, {
      withCredentials: true,
      responseType: 'text'
    });
  }

  /**
   * Upload product image
   */
  uploadProductImage(productId: number, imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.http.post<any>(`${this.apiUrl_Product}/admin/products/${productId}/image`, formData, {
      withCredentials: true
    });
  }


  // Order management
  getAllOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl_Orders}/all`, {
      withCredentials: true
    });
  }

  getOrderById(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl_Orders}/${orderId}`, {
      withCredentials: true
    });
  }

  updateOrderStatus(orderId: number, status: string): Observable<any> {
    console.log(status);
    console.log(orderId);

    return this.http.put(`${this.apiUrl_Orders}/${orderId}/status`, { status }, {
      withCredentials: true
    });
  }

  cancelOrder(orderId: number): Observable<any> {
    return this.http.put(`${this.apiUrl_Orders}/${orderId}/cancel`, {}, {
      withCredentials: true
    });
  }

  /**
   * Get orders by status
   */
  getOrdersByStatus(status: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl_Orders}/status/${status}`, {
      withCredentials: true
    });
  }

  // Reports
  getOrdersBetweenDates(startDate: string, endDate: string): Observable<any[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any[]>(`${this.apiUrl_Orders}/between`, { params });
  }

  getProductsBetweenDates(startDate: string, endDate: string): Observable<any[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any[]>(`${this.apiUrl_Product}/between`, { params });
  }
}
