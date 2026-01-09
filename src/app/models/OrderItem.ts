import { Product } from "./Product";
import { User } from "./User";

export interface OrderItem {
  id: number;
  orderDate: string;
  quantity: number;
  price: number;
  productName?: string;
  orderStatus?: string;
  paymentMethod?: string;
  deliveryAddress?: string;
  product?: Product;
  formattedDate?: string | null;
  totalPrice?: number;
  userDetails?: User;
  paymentStatus?: string;
  paymentId?: string;
  discount: number;
  shipping: number;
  subtotal: number;
  


  }