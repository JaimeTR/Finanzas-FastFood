import { supabase } from './supabase'
import type { User, Product, ExpenseCategory, DistributionType, Sale, Expense, AuditLog } from './types'

// Helper: convierte Date a ISO local sin 'Z' (YYYY-MM-DDTHH:mm:ss)
function toLocalISOStringNoZ(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hour = pad(d.getHours());
  const minute = pad(d.getMinutes());
  const second = pad(d.getSeconds());
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

// Helper: parsea timestamp de DB como hora local, ignorando 'Z' si existe
function parseDbTimestampToLocal(value: any): Date {
  if (!value) return new Date(NaN);
  const s = String(value).trim();
  // 1) Elimina 'Z' o un offset de zona horaria como +00:00 / -05:00 al final
  let cleaned = s.replace(/(Z|[+-]\d{2}:\d{2})$/, '');
  // 2) Postgres suele devolver "YYYY-MM-DD HH:mm:ss" (con espacio). Reemplazamos por 'T'
  cleaned = cleaned.replace(' ', 'T');
  // 3) Parseamos como hora local (sin sufijo de zona)
  const d = new Date(cleaned);
  return d;
}

// ============================================
// FUNCIONES DE TRANSFORMACIÓN
// ============================================
function transformSupabaseUser(user: any): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatar_url
  }
}

function transformSupabaseProduct(product: any): Product {
  return {
    id: product.id,
    name: product.name,
    price: parseFloat(product.price),
    createdAt: parseDbTimestampToLocal(product.created_at)
  }
}

function transformSupabaseExpenseCategory(category: any): ExpenseCategory {
  return {
    id: category.id,
    name: category.name,
    createdAt: parseDbTimestampToLocal(category.created_at)
  }
}

function transformSupabaseDistributionType(row: any): DistributionType {
  return {
    id: row.id,
    name: row.name,
    percentage: parseFloat(row.percentage),
    createdAt: parseDbTimestampToLocal(row.created_at)
  }
}

function transformSupabaseSale(sale: any): Sale {
  return {
    id: sale.id,
    productId: sale.product_id,
    productName: sale.product_name,
    quantity: sale.quantity,
    unitPrice: parseFloat(sale.unit_price),
    total: parseFloat(sale.total),
    date: parseDbTimestampToLocal(sale.date),
    recordedBy: sale.recorded_by,
    notes: sale.notes
  }
}

function transformSupabaseExpense(expense: any): Expense {
  return {
    id: expense.id,
    description: expense.description,
    amount: parseFloat(expense.amount),
    categoryId: expense.category_id,
    categoryName: expense.category_name,
    date: parseDbTimestampToLocal(expense.date),
    recordedBy: expense.recorded_by,
    notes: expense.notes
  }
}

function transformSupabaseAuditLog(log: any): AuditLog {
  return {
    id: log.id,
    action: log.action,
    userId: log.user_id,
    details: log.details,
    date: parseDbTimestampToLocal(log.date)
  }
}

// ============================================
// SERVICIOS DE USUARIOS
// ============================================
export const userService = {
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ? data.map(transformSupabaseUser) : []
  },

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return transformSupabaseUser(data)
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return transformSupabaseUser(data)
  },

  async authenticateUser(email: string, password: string): Promise<User | null> {
    try {
      console.log('Attempting login with:', email, password);
      
      // Buscar el usuario en la base de datos directamente
      const { data: result, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single()

      console.log('Database authentication result:', result);
      console.log('Database authentication error:', error);

      if (error || !result) {
        console.log('Authentication failed for:', email);
        return null;
      }

      return transformSupabaseUser(result)
    } catch (error) {
      console.error('Authentication error:', error)
      return null
    }
  },

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const id = 'user_' + Date.now();
    const { data, error } = await supabase
      // aflojar tipado para evitar conflicto con uniones generadas
      .from('users' as any)
      .insert({
        id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatarUrl
      } as any)
      .select()
      .single()

    if (error) throw error
    return transformSupabaseUser(data)
  },

  async updateUser(id: string, updates: Partial<Omit<User, 'id'>>): Promise<User> {
    const { data, error } = await supabase
      .from('users' as any)
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.email && { email: updates.email }),
        ...(updates.role && { role: updates.role }),
        ...(updates.avatarUrl && { avatar_url: updates.avatarUrl })
      } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return transformSupabaseUser(data)
  }
  ,
  async updatePassword(id: string, newPassword: string): Promise<void> {
    const { error } = await supabase
      .from('users' as any)
      .update({ password: newPassword } as any)
      .eq('id', id)
    if (error) throw error
  }
}

// ============================================
// STORAGE: Subida de avatar de usuario
// ============================================
export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  const extFromType = (mime: string) => {
    if (mime === 'image/jpeg') return 'jpg';
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    if (mime === 'image/gif') return 'gif';
    return 'bin';
  };
  const ext = extFromType(file.type);
  const path = `users/${userId}/avatar_${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { contentType: file.type, upsert: true });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

// ============================================
// SERVICIOS DE PRODUCTOS
// ============================================
export const productService = {
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name')

    if (error) throw error
    return data ? data.map(transformSupabaseProduct) : []
  },

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return transformSupabaseProduct(data)
  },

  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const id = 'prod_' + Date.now();
    const { data, error } = await supabase
      .from('products')
      .insert({
        id,
        name: product.name,
        price: product.price
      })
      .select()
      .single()

    if (error) throw error
    return transformSupabaseProduct(data)
  },

  async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.price && { price: updates.price })
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return transformSupabaseProduct(data)
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// ============================================
// SERVICIOS DE CATEGORÍAS DE GASTOS
// ============================================
export const expenseCategoryService = {
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name')

    if (error) throw error
    return data ? data.map(transformSupabaseExpenseCategory) : []
  },

  async createExpenseCategory(category: Omit<ExpenseCategory, 'id' | 'createdAt'>): Promise<ExpenseCategory> {
    const id = 'cat_' + Date.now();
    const { data, error } = await supabase
      .from('expense_categories')
      .insert({
        id,
        name: category.name
      })
      .select()
      .single()

    if (error) throw error
    return transformSupabaseExpenseCategory(data)
  }
  ,
  async updateExpenseCategory(id: string, updates: Partial<Omit<ExpenseCategory, 'id' | 'createdAt'>>): Promise<ExpenseCategory> {
    const { data, error } = await supabase
      .from('expense_categories')
      .update({
        ...(updates.name && { name: updates.name })
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return transformSupabaseExpenseCategory(data)
  }
  ,
  async deleteExpenseCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// ============================================
// SERVICIOS DE TIPOS DE DISTRIBUCIÓN
// ============================================
export const distributionTypeService = {
  async getDistributionTypes(): Promise<DistributionType[]> {
    const { data, error } = await supabase
      .from('distribution_types')
      .select('*')
      .order('name')

    if (error) throw error
    return data ? data.map(transformSupabaseDistributionType) : []
  },

  async createDistributionType(row: Omit<DistributionType, 'id' | 'createdAt'>): Promise<DistributionType> {
    const id = 'dist_' + Date.now();
    const { data, error } = await supabase
      .from('distribution_types')
      .insert({
        id,
        name: row.name,
        percentage: row.percentage
      })
      .select()
      .single()

    if (error) throw error
    return transformSupabaseDistributionType(data)
  },

  async updateDistributionType(id: string, updates: Partial<Omit<DistributionType, 'id' | 'createdAt'>>): Promise<DistributionType> {
    const { data, error } = await supabase
      .from('distribution_types')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(typeof updates.percentage === 'number' && { percentage: updates.percentage })
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return transformSupabaseDistributionType(data)
  },

  async deleteDistributionType(id: string): Promise<void> {
    const { error } = await supabase
      .from('distribution_types')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// ============================================
// SERVICIOS DE VENTAS
// ============================================
export const salesService = {
  async getSales(): Promise<Sale[]> {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false })

    if (error) throw error
    return data ? data.map(transformSupabaseSale) : []
  },

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .gte('date', toLocalISOStringNoZ(startDate))
      .lte('date', toLocalISOStringNoZ(endDate))
      .order('date', { ascending: false })

    if (error) throw error
    return data ? data.map(transformSupabaseSale) : []
  },

  async createSale(sale: Omit<Sale, 'id'>): Promise<Sale> {
    const id = 'sale_' + Date.now();
    const { data, error } = await supabase
      .from('sales')
      .insert({
        id,
        product_id: sale.productId,
        product_name: sale.productName,
        quantity: sale.quantity,
        unit_price: sale.unitPrice,
        total: sale.total,
        date: toLocalISOStringNoZ(sale.date),
        recorded_by: sale.recordedBy,
        notes: sale.notes
      })
      .select()
      .single()

    if (error) throw error
    return transformSupabaseSale(data)
  },

  async updateSale(id: string, updates: Partial<Omit<Sale, 'id'>>): Promise<Sale> {
    const { data, error } = await supabase
      .from('sales')
      .update({
        ...(updates.productId && { product_id: updates.productId }),
        ...(updates.productName && { product_name: updates.productName }),
        ...(updates.quantity && { quantity: updates.quantity }),
        ...(updates.unitPrice && { unit_price: updates.unitPrice }),
        ...(updates.total && { total: updates.total }),
        ...(updates.date && { date: toLocalISOStringNoZ(updates.date) }),
        ...(updates.recordedBy && { recorded_by: updates.recordedBy }),
        ...(updates.notes && { notes: updates.notes })
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return transformSupabaseSale(data)
  },

  async deleteSale(id: string): Promise<void> {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// ============================================
// SERVICIOS DE GASTOS
// ============================================
export const expensesService = {
  async getExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })

    if (error) throw error
    return data ? data.map(transformSupabaseExpense) : []
  },

  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', toLocalISOStringNoZ(startDate))
      .lte('date', toLocalISOStringNoZ(endDate))
      .order('date', { ascending: false })

    if (error) throw error
    return data ? data.map(transformSupabaseExpense) : []
  },

  async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    const id = 'exp_' + Date.now();
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        id,
        description: expense.description,
        amount: expense.amount,
        category_id: expense.categoryId,
        category_name: expense.categoryName,
        date: toLocalISOStringNoZ(expense.date),
        recorded_by: expense.recordedBy,
        notes: expense.notes
      })
      .select()
      .single()

    if (error) throw error
    return transformSupabaseExpense(data)
  },

  async updateExpense(id: string, updates: Partial<Omit<Expense, 'id'>>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        ...(updates.description && { description: updates.description }),
        ...(updates.amount && { amount: updates.amount }),
        ...(updates.categoryId && { category_id: updates.categoryId }),
        ...(updates.categoryName && { category_name: updates.categoryName }),
        ...(updates.date && { date: toLocalISOStringNoZ(updates.date) }),
        ...(updates.recordedBy && { recorded_by: updates.recordedBy }),
        ...(updates.notes && { notes: updates.notes })
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return transformSupabaseExpense(data)
  },

  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// ============================================
// SERVICIOS DE AUDITORÍA
// ============================================
export const auditLogService = {
  async getAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('date', { ascending: false })
      .limit(100)

    if (error) throw error
    return data ? data.map(transformSupabaseAuditLog) : []
  },

  async createAuditLog(log: Omit<AuditLog, 'id' | 'date'>): Promise<AuditLog> {
    const id = 'audit_' + Date.now();
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        id,
        action: log.action,
        user_id: log.userId,
        details: log.details
      })
      .select()
      .single()

    if (error) throw error
    return transformSupabaseAuditLog(data)
  }
}

// ============================================
// SERVICIOS DE CONFIGURACIÓN DEL NEGOCIO
// ============================================
export const businessSettingsService = {
  async getBusinessSettings(): Promise<{ businessName: string } | null> {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return { businessName: data.business_name }
  },

  async updateBusinessSettings(businessName: string, updatedBy: string): Promise<void> {
    const { error } = await supabase
      .from('business_settings')
      .upsert({
        id: 'settings_001',
        business_name: businessName,
        updated_by: updatedBy
      })

    if (error) throw error
  }
}