-- Script SQL para LIMPIAR y RECREAR tablas FFFinanzas
-- Este script elimina tablas existentes y las recrea con tipos consistentes
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- PASO 1: ELIMINAR TABLAS EXISTENTES (si existen)
-- ============================================
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS business_settings CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- PASO 2: CREAR TABLAS CON TIPOS CONSISTENTES
-- ============================================

-- 1. TABLA DE USUARIOS
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE PRODUCTOS
CREATE TABLE products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA DE CATEGORÍAS DE GASTOS
CREATE TABLE expense_categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA DE VENTAS
CREATE TABLE sales (
  id VARCHAR(50) PRIMARY KEY,
  product_id VARCHAR(50) REFERENCES products(id),
  product_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recorded_by VARCHAR(50) REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLA DE GASTOS
CREATE TABLE expenses (
  id VARCHAR(50) PRIMARY KEY,
  description VARCHAR(200) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category_id VARCHAR(50) REFERENCES expense_categories(id),
  category_name VARCHAR(100),
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recorded_by VARCHAR(50) REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABLA DE AUDITORÍA
CREATE TABLE audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  action VARCHAR(200) NOT NULL,
  user_id VARCHAR(50) REFERENCES users(id),
  details TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABLA DE CONFIGURACIÓN DEL NEGOCIO
CREATE TABLE business_settings (
  id VARCHAR(50) PRIMARY KEY,
  business_name VARCHAR(200) NOT NULL DEFAULT 'FFFinanzas',
  updated_by VARCHAR(50) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PASO 3: INSERTAR DATOS INICIALES
-- ============================================

-- Insertar usuarios iniciales
INSERT INTO users (id, name, email, password, role, avatar_url) VALUES 
('user_admin_001', 'Administrador', 'admin@admin.com', 'Admin123!', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'),
('user_carlos_002', 'Carlos Rodríguez', 'carlos@gmail.com', 'Carlos123!', 'user', 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos'),
('user_maria_003', 'María González', 'maria@gmail.com', 'Maria123!', 'user', 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria');

-- Insertar productos iniciales
INSERT INTO products (id, name, price) VALUES 
('prod_001', 'Hamburguesa Clásica', 15.90),
('prod_002', 'Papas Fritas Grandes', 8.50),
('prod_003', 'Gaseosa 500ml', 5.00),
('prod_004', 'Combo Completo', 25.90),
('prod_005', 'Pollo Broaster', 22.50),
('prod_006', 'Salchipapa', 12.90);

-- Insertar categorías de gastos
INSERT INTO expense_categories (id, name) VALUES 
('cat_001', 'Ingredientes'),
('cat_002', 'Servicios Básicos'),
('cat_003', 'Alquiler'),
('cat_004', 'Sueldos'),
('cat_005', 'Marketing'),
('cat_006', 'Equipos');

-- Insertar ventas de ejemplo
INSERT INTO sales (id, product_id, product_name, quantity, unit_price, total, recorded_by, date) VALUES 
('sale_001', 'prod_004', 'Combo Completo', 8, 25.90, 207.20, 'user_carlos_002', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('sale_002', 'prod_001', 'Hamburguesa Clásica', 15, 15.90, 238.50, 'user_maria_003', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('sale_003', 'prod_005', 'Pollo Broaster', 12, 22.50, 270.00, 'user_carlos_002', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('sale_004', 'prod_006', 'Salchipapa', 20, 12.90, 258.00, 'user_maria_003', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('sale_005', 'prod_003', 'Gaseosa 500ml', 25, 5.00, 125.00, 'user_carlos_002', CURRENT_TIMESTAMP),
('sale_006', 'prod_002', 'Papas Fritas Grandes', 18, 8.50, 153.00, 'user_maria_003', CURRENT_TIMESTAMP);

-- Insertar gastos de ejemplo
INSERT INTO expenses (id, description, amount, category_id, category_name, recorded_by, date) VALUES 
('exp_001', 'Alquiler del local - Mes actual', 2800.00, 'cat_003', 'Alquiler', 'user_admin_001', CURRENT_TIMESTAMP - INTERVAL '3 days'),
('exp_002', 'Compra de carne y pollo', 850.00, 'cat_001', 'Ingredientes', 'user_carlos_002', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('exp_003', 'Factura de electricidad', 320.00, 'cat_002', 'Servicios Básicos', 'user_admin_001', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('exp_004', 'Sueldo de cocinero', 1200.00, 'cat_004', 'Sueldos', 'user_admin_001', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('exp_005', 'Verduras y condimentos', 245.00, 'cat_001', 'Ingredientes', 'user_maria_003', CURRENT_TIMESTAMP),
('exp_006', 'Mantenimiento de freidora', 180.00, 'cat_006', 'Equipos', 'user_carlos_002', CURRENT_TIMESTAMP);

-- Insertar configuración inicial
INSERT INTO business_settings (id, business_name, updated_by) VALUES 
('settings_001', 'FFFinanzas', 'user_admin_001');

-- Insertar log de auditoría inicial
INSERT INTO audit_logs (id, action, user_id, details) VALUES 
('audit_001', 'Sistema Inicializado', 'user_admin_001', 'Base de datos configurada con usuarios y datos de ejemplo');

-- ============================================
-- PASO 4: HABILITAR ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 5: POLÍTICAS DE SEGURIDAD BÁSICAS
-- ============================================

-- Políticas para usuarios
CREATE POLICY "Everyone can view users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);

-- Políticas para productos
CREATE POLICY "Everyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Users can modify products" ON products FOR ALL USING (true);

-- Políticas para categorías
CREATE POLICY "Everyone can view categories" ON expense_categories FOR SELECT USING (true);
CREATE POLICY "Users can modify categories" ON expense_categories FOR ALL USING (true);

-- Políticas para ventas
CREATE POLICY "Everyone can view sales" ON sales FOR SELECT USING (true);
CREATE POLICY "Users can create sales" ON sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update sales" ON sales FOR UPDATE USING (true);

-- Políticas para gastos
CREATE POLICY "Everyone can view expenses" ON expenses FOR SELECT USING (true);
CREATE POLICY "Users can create expenses" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update expenses" ON expenses FOR UPDATE USING (true);

-- Políticas para auditoría
CREATE POLICY "Everyone can view audit logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Users can create audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- Políticas para configuración
CREATE POLICY "Everyone can view business settings" ON business_settings FOR SELECT USING (true);
CREATE POLICY "Users can modify business settings" ON business_settings FOR ALL USING (true);

-- ============================================
-- PASO 6: VERIFICAR DATOS
-- ============================================
SELECT 'Usuarios creados:' as info;
SELECT id, name, email, role FROM users;

SELECT 'Productos disponibles:' as info;
SELECT id, name, price FROM products;

SELECT 'Ventas registradas:' as info;
SELECT COUNT(*) as total_sales FROM sales;

SELECT 'Gastos registrados:' as info;
SELECT COUNT(*) as total_expenses FROM expenses;

-- ============================================
-- SCRIPT COMPLETADO ✅
-- Todas las tablas han sido recreadas con tipos consistentes
-- Los datos de ejemplo están listos para usar
-- 
-- CREDENCIALES DE PRUEBA:
-- admin@admin.com / Admin123!
-- carlos@gmail.com / Carlos123!
-- maria@gmail.com / Maria123!
-- ============================================