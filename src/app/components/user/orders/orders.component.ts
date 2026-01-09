import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { OrderItem } from '../../../models/OrderItem';
import { Order } from '../../../models/Order';
import { OrdersService } from '../../../services/user/orders.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProfileService } from '../../../services/user/profile.service';
@Component({
  selector: 'app-orders',
  standalone: false,
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})

export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  user: any = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  expandedOrderId: number | null = null;
  isCancelling: number | null = null;
  successMessage: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private orderService: OrdersService,
    private userService: ProfileService
  ) { }

  ngOnInit(): void {
    this.fetchOrders();
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.userService.getUserProfile().subscribe({
      next: (userData) => {
        this.user = userData; 
        console.log(this.user);
        console.log(this.user?.phone);
      },
      
      error: (error) => {
        console.error('Error loading profile:', error);
      }
    });
  }


  fetchOrders(): void {
    this.isLoading = true;

    this.orderService.getOrderHistory().subscribe({
      next: (orderItems) => {
        const ordersMap = orderItems.reduce((map, item) => {
          if (!map.has(item.id)) {
            map.set(item.id, {
              orderId: item.id,
              orderDate: item.orderDate,
              totalAmount: 0,
              status: item.orderStatus || 'Ordered',
              paymentMethod: item.paymentMethod || 'Razorpay',
              deliveryAddress: item?.userDetails?.address || 'Not provided',
              items: []
            });
          }
          
          const order = map.get(item.id)!;
          const productName = item.product?.name || 'Unknown Product';
          const price = item.product?.price || 0;

          order.items.push({
            ...item,
            productName: productName,
            price: price
          });

          order.totalAmount += (price * item.quantity) || 0;
          return map;
        }, new Map<number, Order>());

        this.orders = Array.from(ordersMap.values())
          .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

        this.isLoading = false;
        console.log(this.orders);
      },
      error: (error) => {
        console.error('Error:', error);
        this.errorMessage = 'Failed to load orders';
        this.isLoading = false;
        if (error.status === 401 || error.status === 403) this.router.navigate(['/auth/login']);
      }
    });
  }

  toggleOrderDetails(orderId: number): void {
    if (this.expandedOrderId === orderId) {
      this.expandedOrderId = null;
    } else {
      this.expandedOrderId = orderId;
    }
  }

  getOrderStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getFormattedDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  calculateTotal(item: any): number {
    return item.subtotal - item.discount + item.shipping;
  }

  getFormattedPrice(price: any): string {
    if (isNaN(price) || price === null) return '0.00';
    if (price === undefined || price === null) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  }

  getInvoiceFormattedPrice(price: number): string {
    if (isNaN(price) || price === null) return '₹0.00';
    return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  downloadInvoice(order: Order): void {
    // Creating a new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set document properties
    doc.setProperties({
      title: `ClickShop Invoice #${order.orderId}`,
      subject: 'Order Invoice',
      author: 'ClickShop',
      keywords: 'invoice, order, ecommerce',
      creator: 'ClickShop Invoice System'
    });

    // Define colors
    const primaryColor = [79, 70, 229]; // Indigo
    const secondaryColor = [55, 65, 81]; // Gray
    const accentColor = [16, 185, 129]; // Green

    // Add brand logo
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('CLICKSHOP', 20, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Premium Shopping Experience', 20, 22);

    // Add "INVOICE" text with a stylish badge
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(140, 10, 50, 15, 2, 2, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('INVOICE', 165, 20, { align: 'center' });

    // Add invoice details section
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(15, 40, 195, 40);

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('INVOICE DETAILS', 15, 45);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Invoice Number:`, 15, 52);
    doc.text(`Order Date:`, 15, 58);
    doc.text(`Payment Status:`, 15, 64);
    doc.text(`Payment Method:`, 15, 70);
    doc.text(`Payment ID:`, 15, 76);

    // Add invoice values
    doc.setFont('helvetica', 'bold');
    doc.text(`INV-${order.orderId}`, 60, 52);
    doc.text(`${this.getFormattedDate(order.orderDate)}`, 60, 58);

    // Payment status with color coding
    const paymentStatus = order.items[0]?.paymentStatus || 'N/A';
    if (paymentStatus === 'COMPLETED') {
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    } else if (paymentStatus === 'FAILED') {
      doc.setTextColor(220, 38, 38); // Red
    } else {
      doc.setTextColor(234, 179, 8); // Yellow
    }
    doc.text(`${paymentStatus}`, 60, 64);

    // Reset color
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`${order.paymentMethod || 'N/A'}`, 60, 70);
    doc.text(`${order.items[0]?.paymentId || 'N/A'}`, 60, 76);

    // Add order status section - visual indicator
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(105, 45, 105, 76);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ORDER STATUS', 115, 45);

    // Order status tracker
    const statusOptions = ['ORDERED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const orderStatus = order.status || 'ORDERED';
    if (orderStatus === 'CANCELLED') {
      // Draw a red cancelled badge
      doc.setFillColor(254, 226, 226); // Light red background
      doc.roundedRect(115, 52, 70, 25, 2, 2, 'F');
      
      doc.setTextColor(220, 38, 38); // Red text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('CANCELLED', 150, 66, { align: 'center' });
      
      // Add cancellation date if available
      // if (order.cancelledDate) {
      //   doc.setFontSize(8);
      //   doc.text(`Cancelled on: ${this.getFormattedDate(order.cancelledDate)}`, 150, 70, { align: 'center' });
      // }
      
    
    } else {
      // Regular order status tracker for non-cancelled orders
      const statusIndex = statusOptions.indexOf(orderStatus);
    
      // Draw status circles
      const startY = 55;
      const circleSpacing = 8;
    
      statusOptions.forEach((status, index) => {
        const x = 120;
        const y = startY + (index * circleSpacing);
    
        // Draw connector line
        if (index > 0) {
          if (index <= statusIndex) {
            doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
          } else {
            doc.setDrawColor(220, 220, 220);
          }
          doc.setLineWidth(0.5);
          doc.line(x, y - circleSpacing + 1.5, x, y - 1.5);
        }
    
        // Draw circle
        if (index <= statusIndex) {
          doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        } else {
          doc.setFillColor(220, 220, 220);
        }
        doc.circle(x, y, 1.5, 'F');
    
        // Add status text
        doc.setFont('helvetica', index <= statusIndex ? 'bold' : 'normal');
        doc.setFontSize(8);
        if (index <= statusIndex) {
          doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        } else {
          doc.setTextColor(150, 150, 150);
        }
        doc.text(status, 125, y + 0.5);
      });
    }
    

    // Add billing information
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(15, 85, 195, 85);

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('BILL TO', 15, 92);

    const customerName = this.user?.name || 'N/A';
    const customerContact = this.user?.phone || 'N/A';
    console.log(customerContact);
    console.log(this.user?.phone);
    const customerEmail = this.user?.email || 'N/A';
    const customerAddress = this.user?.address || 'N/A';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(customerName, 15, 99);
    doc.text(customerEmail, 15, 105);
    doc.text(customerContact, 15, 111);
    doc.text(customerAddress, 15, 117, { maxWidth: 80 });

    // Add shipping information
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('SHIP TO', 115, 92);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(customerName, 115, 99);
    doc.text(customerAddress, 115, 105, { maxWidth: 80 });

    // Estimated delivery info
    const orderDate = new Date(order.orderDate);
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 3);

    doc.setFont('helvetica', 'bold');
    doc.text('Estimated Delivery:', 115, 117);
    doc.setFont('helvetica', 'normal');
    doc.text(deliveryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }), 160, 117);

    // Creating table for order items
    const tableColumn = [
      { header: 'Item', dataKey: 'item' },
      { header: 'Unit Price', dataKey: 'price' },
      { header: 'Quantity', dataKey: 'quantity' },
      { header: 'Discount', dataKey: 'discount' },
      { header: 'Total', dataKey: 'total' }
    ];

    const tableRows: any[] = [];

    // Adding order items to the table
    order.items.forEach(item => {
      const discount = item.discount || 0;
      const itemData = {
        item: item.productName,
        price: this.getInvoiceFormattedPrice(item.price),
        quantity: item.quantity,
        discount: this.getInvoiceFormattedPrice(discount),
        total: this.getInvoiceFormattedPrice((item.price * item.quantity) - discount)
      };
      tableRows.push(itemData);
    });

    // Integrating the table to the PDF
    autoTable(doc, {
      columns: tableColumn,
      body: tableRows,
      startY: 125,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 15, right: 15 },
      styles: {
        font: 'helvetica',
        fontSize: 9
      },
      didDrawPage: function (data) {
        // Add page number if multiple pages
        if (doc.getNumberOfPages() > 1) {
          doc.setFontSize(8);
          doc.text(`Page ${doc.getNumberOfPages()}`, 195, 285, { align: 'right' });
        }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Add summary section
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);

    // const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // const discount = order.items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const subtotal = order.items[0]?.subtotal || 0;
    const discount = order.items[0]?.discount || 0;
    const shipping = order.items[0]?.shipping || 0;
    const total = subtotal + shipping - discount;

    // Summary box
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(110, finalY, 80, 40, 2, 2, 'F');

    // Summary details
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    doc.text('Subtotal:', 120, finalY + 8);
    doc.text(this.getInvoiceFormattedPrice(subtotal), 180, finalY + 8, { align: 'right' });

    doc.text('Shipping:', 120, finalY + 16);
    doc.text(this.getInvoiceFormattedPrice(shipping), 180, finalY + 16, { align: 'right' });

    if (discount > 0) {
      doc.text('Discount:', 120, finalY + 24);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text(`-${this.getInvoiceFormattedPrice(discount)}`, 180, finalY + 24, { align: 'right' });
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    }

    // Add line before total
    doc.setDrawColor(220, 220, 220);
    doc.line(120, finalY + 28, 180, finalY + 28);

    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL:', 120, finalY + 35);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(this.getInvoiceFormattedPrice(total), 180, finalY + 35, { align: 'right' });

    // Add thank you note
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Thank you for shopping with us!', 15, finalY + 20);

    // Add footer
    const footerY = 270;
    doc.setFillColor(249, 250, 251);
    doc.rect(0, footerY, 210, 27, 'F');

    doc.setDrawColor(220, 220, 220);
    doc.line(15, footerY + 1, 195, footerY + 1);

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ClickShop', 15, footerY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Premium Online Shopping Experience', 15, footerY + 13);
    doc.text('Phone: +91 9898989898', 15, footerY + 18);


    // Saving the PDF
    doc.save(`ClickShop_Invoice_${order.orderId}.pdf`);
  }

  cancelOrder(orderId: number): void {
    // Show confirmation dialog
    if (confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      // Set loading state for the specific order
      this.isCancelling = orderId;

      // Call the order service to cancel the order
      this.orderService.cancelOrder(orderId).subscribe({
        next: (response) => {
          // Update the order status in the UI
          const orderIndex = this.orders.findIndex(order => order.orderId === orderId);
          if (orderIndex !== -1) {
            this.orders[orderIndex].items[0].orderStatus = 'CANCELLED';
            this.orders[orderIndex].status = 'CANCELLED';
          }

          // Show success message
          this.successMessage = 'Order cancelled successfully. Payment will be reversed within 48 hours.';
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);

          // Clear loading state
          this.isCancelling = null;
        },
        error: (error:any) => {
          // Show error message
          this.errorMessage = error.error?.message || 'Failed to cancel order. Please try again.';
          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);

          // Clear loading state
          this.isCancelling = null;
        }
      });
    }
  }

}