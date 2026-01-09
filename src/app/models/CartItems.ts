import { Product } from "./Product";

export interface CartItem {
    id: number;
  productId: number;
  product: Product;
  productName: string;
  price: number;
  quantity: number;
  imageUrl: string;
  subtotal?: number;
  totalPrice:number;
  cartId:number;
  }