import type { User, Product, ExpenseCategory, Sale, Expense, AuditLog } from './types';

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Usuario Admin',
    email: 'superadmin@example.com',
    role: 'superadmin',
    avatarUrl: '/avatars/01.png',
  },
  {
    id: '2',
    name: 'Usuario Socio',
    email: 'socio@example.com',
    role: 'socio',
    avatarUrl: '/avatars/02.png',
  },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Hamburguesa', price: 5.99 },
  { id: 'p2', name: 'Papas Fritas', price: 2.49 },
  { id: 'p3', name: 'Gaseosa', price: 1.99 },
  { id: 'p4', name: 'Combo', price: 9.99 },
];

export const MOCK_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'c1', name: 'Ingredientes' },
  { id: 'c2', name: 'Servicios' },
  { id: 'c3', name: 'Alquiler' },
  { id: 'c4', name: 'Salarios' },
];

const today = new Date();
export const MOCK_SALES: Sale[] = [
  { id: 's1', product: MOCK_PRODUCTS[3], quantity: 5, total: 49.95, date: new Date(today.setHours(9, 15)), recordedBy: 'Usuario Socio' },
  { id: 's2', product: MOCK_PRODUCTS[0], quantity: 10, total: 59.90, date: new Date(today.setHours(10, 30)), recordedBy: 'Usuario Socio' },
  { id: 's3', product: MOCK_PRODUCTS[1], quantity: 20, total: 49.80, date: new Date(today.setHours(12, 45)), recordedBy: 'Usuario Socio' },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: 'e1', description: 'Alquiler mensual de la tienda', amount: 1200, category: MOCK_EXPENSE_CATEGORIES[2], date: new Date(today.setDate(1)), recordedBy: 'Usuario Admin' },
  { id: 'e2', description: 'Factura de electricidad', amount: 250, category: MOCK_EXPENSE_CATEGORIES[1], date: new Date(today.setDate(5)), recordedBy: 'Usuario Admin' },
  { id: 'e3', description: 'Entrega de verduras frescas', amount: 150, category: MOCK_EXPENSE_CATEGORIES[0], date: new Date(today.setDate(10)), recordedBy: 'Usuario Admin' },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
    { id: 'l1', action: 'Sistema Inicializado', user: 'System', date: new Date(today.setDate(1)), details: 'Primer arranque de la aplicación' },
]
