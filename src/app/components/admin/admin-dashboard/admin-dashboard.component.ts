
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/authService/auth.service';
import { AdminServiceService } from '../../../services/admin/admin-service.service';



@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  userCount: number = 0;
  productCount: number = 0;
  orderCount: number = 0;
  totalRevenue: number = 0;
  recentOrders: any[] = [];
  isLoading: boolean = true;

  constructor(private adminService: AdminServiceService) { }

  ngOnInit(): void {
    this.fetchDashboardData();
  }

  fetchDashboardData(): void {
    this.isLoading = true;
    
    // Get dashboard stats
    this.adminService.getDashboardStats().subscribe({
      next: (data: any) => {
        this.userCount = data.userCount || 0;
        this.productCount = data.productCount || 0;
        this.orderCount = data.orderCount || 0;
        this.totalRevenue = data.totalRevenue || 0;
        this.isLoading = false;
        console.log(data);
        
      },
      error: (error) => {
        console.error('Error fetching dashboard stats:', error);
        this.isLoading = false;
      }
    });
    
    
    // Get recent orders
    this.adminService.getRecentOrders().subscribe({
      next: (data: any) => {
        this.recentOrders = data || [];
        console.log(this.recentOrders);
        
      },
      error: (error) => {
        console.error('Error fetching recent orders:', error);
      }
    });
  }
}
