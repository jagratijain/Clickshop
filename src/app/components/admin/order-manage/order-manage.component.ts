import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AdminServiceService } from '../../../services/admin/admin-service.service';
import { HttpErrorResponse } from '@angular/common/http';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-order-manage',
  standalone: false,
  templateUrl: './order-manage.component.html',
  styleUrl: './order-manage.component.css'
})
export class OrderManageComponent {
  orders: any[] = [];
  filteredOrders: any[] = [];
  displayedOrders: any[] = [];
  isLoading: boolean = true;
  searchTerm: string = '';
  statusFilter: string = 'all';
  sortBy: string = 'date_desc';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  
  // Status update modal
  showStatusModal: boolean = false;
  orderToUpdate: any = null;
  newStatus: string = '';
  isUpdating: boolean = false;
  
  // Cancel order modal
  showCancelModal: boolean = false;
  orderToCancel: any = null;
  isCancelling: boolean = false;
  
  // Make Math available to template
  Math = Math;

  constructor(
    private router: Router,
    private orderService: AdminServiceService,
    private toast:HotToastService
  ) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.orderService.getAllOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.filterOrders();
        this.isLoading = false;
        console.log(data);
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.toast.error('Failed to load orders. Please try again.')
        this.isLoading = false;
      }
    });
  }

  filterOrders(): void {
    let result = [...this.orders];
    
    // Apply search term filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(order => 
        order.orderId.toString().includes(term) || 
        (order.user?.name && order.user.name.toLowerCase().includes(term)) ||
        (order.user?.email && order.user.email.toLowerCase().includes(term)) ||
        (order.product?.name && order.product.name.toLowerCase().includes(term))
      );
    }
    
    // Apply status filter
    if (this.statusFilter !== 'all') {
      result = result.filter(order => order.orderStatus === this.statusFilter);
    }
    
    // Apply sorting
    result = this.sortOrders(result, this.sortBy);
    
    this.filteredOrders = result;
    this.totalPages = Math.ceil(this.filteredOrders.length / this.pageSize);
    
    // Adjust current page if needed
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    
    this.updateDisplayedOrders();
  }
  calculateOrderTotal(order: any): number {
    return order.subtotal - order.discount + order.shipping;
  }
  sortOrders(orders: any[], sortBy: string): any[] {
    switch (sortBy) {
      case 'date_desc':
        return [...orders].sort((a, b) => 
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        );
      case 'date_asc':
        return [...orders].sort((a, b) => 
          new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
        );
      case 'total_desc':
        return [...orders].sort((a, b) => b.totalPrice - a.totalPrice);
      case 'total_asc':
        return [...orders].sort((a, b) => a.totalPrice - b.totalPrice);
      default:
        return orders;
    }
  }
  

  updateDisplayedOrders(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedOrders = this.filteredOrders.slice(startIndex, endIndex);
  }

  viewOrderDetails(order: any): void {
    this.router.navigate(['/admin/vieworders', order.id]);
  }

  openStatusModal(order: any): void {
    this.orderToUpdate = order;
    console.log(this.orderToUpdate);
    
    this.newStatus = '';
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.orderToUpdate = null;
    this.newStatus = '';
  }

  updateOrderStatus(): void {
    if (!this.orderToUpdate || !this.newStatus) return;
    
    this.isUpdating = true;
    
    this.orderService.updateOrderStatus(this.orderToUpdate.id, this.newStatus).subscribe({
      next: () => {
        // Update the order status in the local array
        const order = this.orders.find(o => o.id === this.orderToUpdate.id);
        if (order) {
          order.orderStatus = this.newStatus;
        }
        
        this.toast.success(`Order #${this.orderToUpdate.id} status updated to ${this.newStatus}`)
        this.isUpdating = false;
        this.closeStatusModal();
        
        // Refresh the displayed orders
        this.filterOrders();
        
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        this.toast.error(error.error?.message || 'Failed to update order status. Please try again.')
        this.isUpdating = false;
        this.closeStatusModal();
        
      }
    });
  }
  

  confirmCancel(order: any): void {
    this.orderToCancel = order;
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.orderToCancel = null;
  }

  cancelOrder(): void {
    if (!this.orderToCancel) return;
    
    this.isCancelling = true;
    console.log(this.orderToCancel);
    
    this.orderService.cancelOrder(this.orderToCancel.id).subscribe({
      next: () => {
        // Update the order status in the local array
        const order = this.orders.find(o => o.id === this.orderToCancel.id);
        
        if (order) {
          order.orderStatus = 'CANCELLED';
        }
        this.toast.warning(`Order #${this.orderToCancel.id} has been cancelled`)
        this.isCancelling = false;
        this.closeCancelModal();
        
        // Refresh the displayed orders
        this.filterOrders();
        
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error cancelling order:', error);
        this.isCancelling = false;
        this.toast.error(error.error?.error || 'Failed to cancel order. Please try again.')
        this.closeCancelModal();
        
      }
    });
  }  

  // Pagination methods
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedOrders();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedOrders();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedOrders();
    }
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      // Show all pages if there are 5 or fewer
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex pagination logic for more than 5 pages
      if (this.currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (this.currentPage >= this.totalPages - 2) {
        // Near the end
        for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        for (let i = this.currentPage - 2; i <= this.currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  }
}
