export type Role = 'ADMIN' | 'STORE_MANAGER' | 'SALES_ATTENDANT'

export interface User {
  id: number
  name: string
  username: string
  email: string
  role: Role
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  minStock: number
  supplierId?: number | null
  supplier?: Supplier | null
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: number
  name: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  address: string | null
  active: boolean
  createdAt: string
  updatedAt: string
  productCount?: number
}

export interface SaleItem {
  id: number
  saleId: number
  productId: number
  productName: string
  quantity: number
  price: number
  total: number
}

export interface Sale {
  id: number
  receiptNumber: string
  subtotal: number
  tax: number
  total: number
  userId: number
  user?: User
  items: SaleItem[]
  createdAt: string
}

export interface CartItem {
  productId: number
  productName: string
  price: number
  quantity: number
}

export interface DashboardStats {
  todaysSales: number
  totalProducts: number
  inventoryValue: number
  lowStockCount: number
  outOfStockCount: number
}

export interface SalesTrendPoint {
  date: string
  total: number
}

export interface LowStockItem {
  id: number
  name: string
  category: string
  stock: number
  minStock: number
}

export interface FastMovingProduct {
  id: number
  name: string
  price: number
  category: string
  totalSold: number
  stock: number
}

export interface DeadStockItem {
  id: number
  name: string
  category: string
  stock: number
  value: number
}

export interface OutOfStockItem {
  id: number
  name: string
  category: string
}

export interface CategoryDistribution {
  category: string
  count: number
}

export interface RecentSaleSummary {
  id: number
  receiptNumber: string
  total: number
  createdAt: string
  itemCount: number
}

export interface DashboardData {
  stats: DashboardStats
  salesTrend: SalesTrendPoint[]
  lowStockItems: LowStockItem[]
  fastMoving: FastMovingProduct[]
  deadStock: DeadStockItem[]
  outOfStockItems: OutOfStockItem[]
  categoryDistribution: CategoryDistribution[]
  recentSales: RecentSaleSummary[]
}

export interface Notification {
  id: number
  title: string
  message: string
  type: 'LOW_STOCK' | 'SALE' | 'SYSTEM'
  targetRole: Role | null
  read: boolean
  createdAt: string
}

export interface SalesReport {
  totalRevenue: number
  totalSales: number
  totalItemsSold: number
  averageSaleValue: number
  taxCollected: number
  recentSales: RecentSaleSummary[]
  dailySales: SalesTrendPoint[]
}

export interface ProductReportItem {
  id: number
  name: string
  category: string
  supplierName: string | null
  price: number
  stock: number
  minStock: number
  inventoryValue: number
  totalSold: number
  stockStatus: 'Healthy' | 'Low Stock' | 'Out of Stock'
}

export interface ProductReport {
  totalProducts: number
  totalInventoryValue: number
  lowStockCount: number
  outOfStockCount: number
  categoryCount: number
  products: ProductReportItem[]
  categoryDistribution: CategoryDistribution[]
}

export interface ReportsData {
  canViewSalesReport: boolean
  salesReport?: SalesReport
  productReport: ProductReport
}
