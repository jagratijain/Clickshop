import { HttpClient, HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import * as XLSX from 'xlsx'; 
import { AdminServiceService } from '../../../services/admin/admin-service.service';

@Component({
  selector: 'app-reports',
  standalone: false,
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent {

  selectedCategory = 'default';
  fromDate: string | null = null;
  toDate: string | null = null;

  reportData: any[] = [];
  flattenedData: any[] = [];
  displayedColumns: string[] = ['image', 'name', 'category', 'quantity', 'price', 'total', 'orderStatus', 'orderDate', 'paymentId'];

  constructor(
    private http: HttpClient,
    private adminService: AdminServiceService,

  ) {}

  // Fetch report data based on selected category
  fetchReport() {
    this.reportData = [];
    this.flattenedData = [];

    if (!this.fromDate || !this.toDate) {
      return;
    }

    if (this.selectedCategory === 'orders') {
      this.adminService.getOrdersBetweenDates(this.fromDate, this.toDate).subscribe(
        res => {
          this.reportData = res;
          this.flattenedData = this.flattenReportData(this.reportData);
        },
        err => {
          console.error('Error fetching report:', err);
        }
      );
    } else if (this.selectedCategory === 'products') {
      this.adminService.getProductsBetweenDates(this.fromDate, this.toDate).subscribe(
        res => {
          this.reportData = res;
          console.log(this.reportData);
          this.flattenedData = this.reportData;
        },
        err => {
          console.error('Error fetching product report:', err);
        }
      );
    }
  }


  // To flatten order data
  flattenReportData(reportData: any[]): any[] {
    return reportData.map(item => ({
      orderId: item.id,
      // orderDate: item.orderDate,
      formattedDate: item.formattedDate,
      orderStatus: item.orderStatus,
      paymentId: item.paymentId,
      paymentStatus: item.paymentStatus,
      productName: item.product?.name || '',
      quantity: item.quantity,
      shipping: item.shipping,
      subtotal: item.subtotal,
      totalPrice: item.totalPrice,
      discount: item.discount,
    }));
  }
  resetFilters() {
    this.selectedCategory = 'default';
    this.fromDate = null;
    this.toDate = null;
    this.reportData = [];
  }
  // Export report data to Excel
  exportToExcel() {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.flattenedData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    
    // Generate Excel file and prompt user to download
    XLSX.writeFile(wb, `report_${this.selectedCategory}_${new Date().toISOString()}.xlsx`);
  }
}
