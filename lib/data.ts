import type { Category, DashboardStat, Product, SupplierOrder } from "@/lib/types";

export const categories: Category[] = [
  {
    id: "honey",
    name: "Natural Honey",
    slug: "natural-honey",
    description: "Single-origin forest honey with medicinal richness.",
    badge: "Wild harvest",
  },
  {
    id: "spices",
    name: "Spices",
    slug: "spices",
    description: "Single-origin pepper, turmeric and cardamom.",
    badge: "Farm fresh",
  },
  {
    id: "wellness",
    name: "Wellness",
    slug: "wellness",
    description: "Nutrient-rich pantry staples for mindful living.",
    badge: "Purity first",
  },
  {
    id: "gifts",
    name: "Gift Boxes",
    slug: "gift-boxes",
    description: "Curated gifting sets for heritage celebrations.",
    badge: "Rare finds",
  },
];

export const products: Product[] = [
  {
    id: "p-100",
    name: "Natural Honey",
    slug: "natural-honey",
    sku: "RV-HNY-001",
    description:
      "Cold-extracted, raw forest honey sourced from native beekeepers and packed to preserve taste, aroma and natural enzymes.",
    category: "Natural Honey",
    origin: "India",
    region: "Western Ghats",
    image: "/royal-vanam-assets/page-03.png",
    weights: ["100g", "250g", "500g", "1kg"],
    mrp: 720,
    retailPrice: 580,
    wholesalePrice: 470,
    discount: 20,
    stock: 220,
    minOrderQty: 12,
    available: true,
    packaging: "Glass jar with food-safe seal.",
    certificates: ["FSSAI", "Organic Traceability"],
    tags: ["Raw", "Single origin", "Ayurvedic"],
  },
  {
    id: "p-101",
    name: "Black Pepper",
    slug: "black-pepper",
    sku: "RV-BPE-002",
    description:
      "Premium Malabar black pepper with bold aroma, a warm bite and deep piney richness from lush pepper gardens.",
    category: "Spices",
    origin: "India",
    region: "Kerala",
    image: "/royal-vanam-assets/page-04.png",
    weights: ["100g", "250g", "500g", "1kg"],
    mrp: 420,
    retailPrice: 335,
    wholesalePrice: 260,
    discount: 20,
    stock: 310,
    minOrderQty: 20,
    available: true,
    packaging: "Food-grade resealable pouch.",
    certificates: ["APEDA", "Traceable origin"],
    tags: ["Malabar", "Premium", "Bold aroma"],
  },
  {
    id: "p-102",
    name: "White Pepper",
    slug: "white-pepper",
    sku: "RV-WPE-003",
    description:
      "Finely processed white pepper with a distinct mellow heat and an elegant finish suited to cream sauces and slow curries.",
    category: "Spices",
    origin: "India",
    region: "Tamil Nadu",
    image: "/royal-vanam-assets/page-05.png",
    weights: ["100g", "250g", "500g", "1kg"],
    mrp: 450,
    retailPrice: 360,
    wholesalePrice: 290,
    discount: 20,
    stock: 160,
    minOrderQty: 20,
    available: true,
    packaging: "Vacuum sealed pouch.",
    certificates: ["ISO Certified", "Quality tested"],
    tags: ["Mellow heat", "Fine grind"],
  },
  {
    id: "p-103",
    name: "Turmeric",
    slug: "turmeric",
    sku: "RV-TUR-004",
    description:
      "Bright, earthy turmeric with a deep golden shade and a clean bitterness from carefully sun-dried rhizomes.",
    category: "Spices",
    origin: "India",
    region: "Nashik",
    image: "/royal-vanam-assets/page-06.png",
    weights: ["100g", "250g", "500g", "1kg"],
    mrp: 390,
    retailPrice: 315,
    wholesalePrice: 245,
    discount: 19,
    stock: 290,
    minOrderQty: 25,
    available: true,
    packaging: "Resealable kraft pouch.",
    certificates: ["Botanical purity", "Aflatoxin tested"],
    tags: ["Golden", "Earthy", "Wellness"],
  },
  {
    id: "p-104",
    name: "Cardamom",
    slug: "cardamom",
    sku: "RV-CAR-005",
    description:
      "Fragrant green cardamom from hill farms, prized for its citrus aroma, sweet finish and culinary depth.",
    category: "Spices",
    origin: "India",
    region: "Idukki",
    image: "/royal-vanam-assets/cardamom-placeholder.svg",
    weights: ["100g", "250g", "500g", "1kg"],
    mrp: 610,
    retailPrice: 495,
    wholesalePrice: 395,
    discount: 19,
    stock: 180,
    minOrderQty: 15,
    available: true,
    packaging: "Airtight tin jar.",
    certificates: ["GI certified", "Aroma profile tested"],
    tags: ["Aromatic", "Premium", "Gourmet"],
  },
];

export const dashboardStats: DashboardStat[] = [
  { label: "Total Sales", value: "₹18.4L", change: "+12.4%", tone: "green" },
  { label: "Total Revenue", value: "₹21.7L", change: "+9.8%", tone: "gold" },
  { label: "Total Orders", value: "1,428", change: "+6.3%", tone: "slate" },
  { label: "Low Stock", value: "14", change: "-3 items", tone: "amber" },
];

export const supplierOrders: SupplierOrder[] = [
  {
    id: "SO-1001",
    orderId: "RV-1001",
    product: "Natural Honey",
    sku: "RV-HNY-001",
    weight: "500g",
    qty: 18,
    supplierPrice: 430,
    customer: "Aarav Menon",
    city: "Bengaluru",
    status: "New Assigned",
    dispatchDate: "2026-11-16",
  },
  {
    id: "SO-1002",
    orderId: "RV-1002",
    product: "Black Pepper",
    sku: "RV-BPE-002",
    weight: "1kg",
    qty: 10,
    supplierPrice: 260,
    customer: "Nisha Rao",
    city: "Hyderabad",
    status: "Accepted",
    dispatchDate: "2026-11-17",
  },
];

export const testimonials = [
  {
    name: "Aditi Sharma",
    role: "Home chef",
    quote:
      "The quality feels artisanal and traceable. Every spice tastes like it came straight from a family farm.",
  },
  {
    name: "Rohan Nair",
    role: "Retail buyer",
    quote:
      "The packaging and taste are premium, but the trust factor is what keeps us coming back to Royal Vanam.",
  },
  {
    name: "Mitali Iyer",
    role: "Wellness enthusiast",
    quote:
      "A rare mix of heritage, purity and modern reliability. The honey has unmatched depth and aroma.",
  },
];

export const faqs = [
  {
    question: "Do you offer wholesale pricing?",
    answer:
      "Yes. Approved wholesale buyers receive tiered pricing and minimum order quantities based on product and region.",
  },
  {
    question: "How do you maintain purity and quality?",
    answer:
      "Each batch is traceable to its origin, subject to quality checks, and packaged under controlled hygiene standards.",
  },
  {
    question: "Can I track my order?",
    answer:
      "Yes. Every dispatched order includes courier details and a tracking ID available on the order tracking page.",
  },
  {
    question: "Do you ship across India?",
    answer:
      "Yes. We ship across India with both standard and express methods depending on your destination pun.",
  },
];

export const orderSteps = [
  "Pending Payment",
  "Confirmed",
  "Awaiting Supplier",
  "Supplier Assigned",
  "Supplier Accepted",
  "Processing",
  "Packed",
  "Dispatched",
  "Out for Delivery",
  "Delivered",
];
