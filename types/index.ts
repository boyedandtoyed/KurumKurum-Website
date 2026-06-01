export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category_id: string;
  category?: Category;
  weight_grams: number;
  weight_label: string;
  unit_type: string;
  price: number;
  description: string;
  image_url: string;
  in_stock: boolean;
  stock_quantity: number;
  is_featured?: boolean;
  created_at: string;
  slug?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_name: string | null;
  shipping_address: ShippingAddress;
  status: "pending" | "processing" | "shipped" | "delivered";
  tracking_number: string | null;
  total_amount: number;
  total_weight_grams: number;
  stripe_payment_id: string | null;
  created_at: string;
}

export interface ShippingAddress {
  full_name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  product_snapshot: Partial<Product>;
}

export interface ProfileAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  address: ProfileAddress | null;
  is_admin: boolean;
  created_at: string;
}
