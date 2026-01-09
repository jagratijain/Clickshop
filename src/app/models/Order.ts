import { OrderItem } from "./OrderItem";
export interface Order {
  orderId: number;
  orderDate: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  deliveryAddress: string;
  items: OrderItem[];
  }