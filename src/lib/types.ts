export type Role = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  createdAt?: Date;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  date: Date;
  recordedBy: string;
  notes?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  createdAt?: Date;
}

// Tipos de distribución de beneficios
export interface DistributionType {
  id: string;
  name: string;
  percentage: number; // 0-100
  createdAt?: Date;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  date: Date;
  recordedBy: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  details: string;
  date: Date;
}

export interface SystemSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  description?: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  loginTime: Date;
  logoutTime?: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

// Tipos para reportes y estadísticas
export interface DailyFinancialSummary {
  date: Date;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  salesCount: number;
  expensesCount: number;
}

export interface TopSellingProduct {
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  timesSold: number;
  avgSaleAmount: number;
}

export interface UserActivitySummary {
  name: string;
  role: Role;
  salesRegistered: number;
  expensesRegistered: number;
  totalSalesAmount: number;
  totalExpensesAmount: number;
  lastActivity: Date;
}

// Configuraciones específicas del negocio
export interface BusinessSettings {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  currency: string;
  taxRate: number;
  businessHours: {
    open: string;
    close: string;
  };
  profitDistribution: {
    socio1: number;
    socio2: number;
    administrador: number;
  };
}
