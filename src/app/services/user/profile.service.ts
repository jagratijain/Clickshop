import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../models/User';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/users`;

  private token = localStorage.getItem('authToken');

  constructor(private http: HttpClient) {}

  getUserProfile(): Observable<User> {
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();

    return this.http.get<User>(`${this.apiUrl}/profile`, { headers, withCredentials: true });
  }

  updateProfile(userData: any): Observable<any> {
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();

    return this.http.put<any>(`${this.apiUrl}/updateprofile`, userData, {
      headers,
      withCredentials: true
    });
  }
  

  changePassword(oldPassword: string, newPassword: string): Observable<string> {
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();

    let params = new HttpParams()
      .set('oldPassword', oldPassword)
      .set('newPassword', newPassword);
    
    return this.http.put<string>(`${this.apiUrl}/changepassword`, null, { params,headers, withCredentials: true 
    });
  }
}
