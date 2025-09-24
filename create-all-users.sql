--- Script completo para crear usuarios y datos en FFFinanzas
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de usuarios si no existe
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insertar usuarios principales
INSERT INTO users (name, email, password, role, avatar_url) VALUES 
('Administrador', 'admin@admin.com', 'Admin123!', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'),
('Carlos Rodríguez', 'carlos@gmail.com', 'Carlos123!', 'user', 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos'),
('María González', 'maria@gmail.com', 'Maria123!', 'user', 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = CURRENT_TIMESTAMP;

-- 3. Crear tabla de ventas si no existe
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_name VARCHAR(200) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  sale_date DATE NOT NULL,
  category VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Crear tabla de gastos si no existe
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  description VARCHAR(200) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  category VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Insertar datos de ejemplo para ventas
INSERT INTO sales (user_id, product_name, amount, quantity, sale_date, category, notes) VALUES
(2, 'Laptop Dell XPS 13', 1200.00, 1, '2024-01-15', 'Electrónicos', 'Venta al por mayor'),
(2, 'Mouse Logitech', 25.50, 5, '2024-01-16', 'Accesorios', 'Venta individual'),
(3, 'Teclado Mecánico', 80.00, 2, '2024-01-17', 'Accesorios', 'Venta directa'),
(2, 'Monitor 24"', 300.00, 3, '2024-01-18', 'Electrónicos', 'Pedido especial'),
(3, 'Webcam HD', 45.00, 4, '2024-01-19', 'Accesorios', 'Venta online');

-- 6. Insertar datos de ejemplo para gastos
INSERT INTO expenses (user_id, description, amount, expense_date, category, notes) VALUES
(2, 'Compra de inventario', 500.00, '2024-01-10', 'Inventario', 'Reposición mensual'),
(2, 'Publicidad Facebook', 120.00, '2024-01-12', 'Marketing', 'Campaña enero'),
(3, 'Gastos de envío', 35.50, '2024-01-14', 'Logística', 'Envíos varios'),
(2, 'Servicios web', 15.00, '2024-01-15', 'Tecnología', 'Hosting mensual'),
(3, 'Material de oficina', 85.00, '2024-01-16', 'Oficina', 'Papelería y suministros');

-- 7. Habilitar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 8. Crear políticas de seguridad básicas
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR role = 'admin');

CREATE POLICY "Users can view their own sales" ON sales
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own sales" ON sales
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own expenses" ON expenses
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- 9. Verificar datos insertados
SELECT 'Usuarios creados:' as info;
SELECT id, name, email, role FROM users;

SELECT 'Ventas registradas:' as info;
SELECT COUNT(*) as total_sales FROM sales;

SELECT 'Gastos registrados:' as info;
SELECT COUNT(*) as total_expenses FROM expenses;