export type Category = {
  id: string;
  name: string;
  description: string;
  slug: string;
  badge: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  category: string;
  origin: string;
  region: string;
  image: string;
  weights: string[];
  weightPrices?: Record<string, number>;
  weightStock?: Record<string, number>;
  mrp: number;
  retailPrice: number;
  wholesalePrice: number;
  discount: number;
  stock: number;
  minOrderQty: number;
  available: boolean;
  packaging: string;
  certificates: string[];
  tags: string[];
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  weight: string;
  qty: number;
  price: number;
  stock: number;
  image: string;
};

export type DashboardStat = {
  label: string;
  value: string;
  change: string;
  tone: "green" | "amber" | "slate" | "gold";
};

export type SupplierOrder = {
  id: string;
  orderId: string;
  product: string;
  sku: string;
  weight: string;
  qty: number;
  supplierPrice: number;
  customer: string;
  city: string;
  status: string;
  dispatchDate: string;
};
