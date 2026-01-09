// models/product.model.ts
export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    stockQuantity: number;
    rating?: number;
    stock:number,
    featured?: boolean;
    inStock: boolean;
    onSale?:boolean
    createdAt?: any
  }