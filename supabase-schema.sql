-- ============================================
-- SCRIPT SQL PARA SUPABASE - FFFinazas
-- Fast Food Finanzas Database Schema
-- Sistema para 2 Socios + 1 Administrador
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLA DE USUARIOS (3 perfiles específicos)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('socio', 'administrador')) DEFAULT 'socio',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. TABLA DE PRODUCTOS
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. TABLA DE CATEGORÍAS DE GASTOS
-- ============================================
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON expense_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. TABLA DE VENTAS
-- ============================================
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
    total DECIMAL(10,2) NOT NULL CHECK (total > 0),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. TABLA DE GASTOS
-- ============================================
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. TABLA DE CONFIGURACIÓN DEL SISTEMA
-- ============================================
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. TABLA DE AUDITORÍA (Historial de cambios)
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(255) NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'CONFIG')),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. TABLA DE SESIONES DE USUARIO
-- ============================================
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_time TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- 9. ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_sales_recorded_by ON sales(recorded_by);
CREATE INDEX idx_sales_month_year ON sales(EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date));

CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_recorded_by ON expenses(recorded_by);
CREATE INDEX idx_expenses_month_year ON expenses(EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date));

CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;

-- ============================================
-- 10. FUNCIONES PARA AUDITORÍA AUTOMÁTICA
-- ============================================
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    user_info RECORD;
BEGIN
    -- Solo auditar si hay un usuario en la sesión
    IF current_setting('app.current_user_id', true) IS NOT NULL THEN
        -- Obtener información del usuario
        SELECT name, role INTO user_info 
        FROM users 
        WHERE id = current_setting('app.current_user_id')::UUID;
        
        IF TG_OP = 'DELETE' THEN
            INSERT INTO audit_logs (
                table_name, operation, record_id, old_values, 
                user_id, user_name, user_role, description
            ) VALUES (
                TG_TABLE_NAME, TG_OP, OLD.id, to_jsonb(OLD),
                current_setting('app.current_user_id')::UUID,
                user_info.name, user_info.role,
                'Registro eliminado'
            );
            RETURN OLD;
        ELSIF TG_OP = 'UPDATE' THEN
            INSERT INTO audit_logs (
                table_name, operation, record_id, old_values, new_values,
                user_id, user_name, user_role, description
            ) VALUES (
                TG_TABLE_NAME, TG_OP, NEW.id, to_jsonb(OLD), to_jsonb(NEW),
                current_setting('app.current_user_id')::UUID,
                user_info.name, user_info.role,
                'Registro actualizado'
            );
            RETURN NEW;
        ELSIF TG_OP = 'INSERT' THEN
            INSERT INTO audit_logs (
                table_name, operation, record_id, new_values,
                user_id, user_name, user_role, description
            ) VALUES (
                TG_TABLE_NAME, TG_OP, NEW.id, to_jsonb(NEW),
                current_setting('app.current_user_id')::UUID,
                user_info.name, user_info.role,
                'Nuevo registro creado'
            );
            RETURN NEW;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de auditoría a las tablas principales
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_sales AFTER INSERT OR UPDATE OR DELETE ON sales
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_expenses AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_system_settings AFTER INSERT OR UPDATE OR DELETE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- ============================================
-- 11. DATOS INICIALES
-- ============================================

-- Insertar usuarios: 1 Administrador + 2 Socios
INSERT INTO users (id, name, email, role, avatar_url) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Jaime Tarazona', 'admin@fffinanzas.com', 'administrador', '/avatars/admin.png'),
('550e8400-e29b-41d4-a716-446655440002', 'Carlos Mendoza', 'socio1@fffinanzas.com', 'socio', '/avatars/socio1.png'),
('550e8400-e29b-41d4-a716-446655440003', 'María García', 'socio2@fffinanzas.com', 'socio', '/avatars/socio2.png');

-- Insertar productos iniciales
INSERT INTO products (id, name, price, created_by) VALUES 
('550e8400-e29b-41d4-a716-446655440011', 'Hamburguesa Clásica', 15.90, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440012', 'Papas Fritas Grandes', 8.50, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440013', 'Gaseosa 500ml', 5.00, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440014', 'Combo Completo', 25.90, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440015', 'Pollo Broaster', 22.50, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440016', 'Salchipapa', 12.90, '550e8400-e29b-41d4-a716-446655440001');

-- Insertar categorías de gastos
INSERT INTO expense_categories (id, name, description, created_by) VALUES 
('550e8400-e29b-41d4-a716-446655440021', 'Ingredientes', 'Compra de ingredientes y materias primas', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440022', 'Servicios Básicos', 'Luz, agua, gas, internet, teléfono', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440023', 'Alquiler', 'Alquiler del local comercial', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440024', 'Sueldos', 'Pagos a empleados y personal', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440025', 'Marketing', 'Publicidad y promociones', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440026', 'Equipos', 'Compra y mantenimiento de equipos', '550e8400-e29b-41d4-a716-446655440001');

-- Insertar configuraciones del sistema
INSERT INTO system_settings (setting_key, setting_value, description, updated_by) VALUES 
('business_name', 'Fast Food Finanzas', 'Nombre del negocio', '550e8400-e29b-41d4-a716-446655440001'),
('business_address', 'Av. Principal 123, Lima, Perú', 'Dirección del negocio', '550e8400-e29b-41d4-a716-446655440001'),
('business_phone', '+51 999 888 777', 'Teléfono del negocio', '550e8400-e29b-41d4-a716-446655440001'),
('currency', 'PEN', 'Moneda del sistema', '550e8400-e29b-41d4-a716-446655440001'),
('tax_rate', '18.0', 'Tasa de IGV en porcentaje', '550e8400-e29b-41d4-a716-446655440001'),
('business_hours', '{"open": "08:00", "close": "22:00"}', 'Horario de atención', '550e8400-e29b-41d4-a716-446655440001'),
('profit_distribution', '{"socio1": 40, "socio2": 40, "administrador": 20}', 'Distribución de ganancias en porcentaje', '550e8400-e29b-41d4-a716-446655440001');

-- Insertar ventas de ejemplo (últimos días)
INSERT INTO sales (product_id, quantity, unit_price, total, recorded_by, date) VALUES 
('550e8400-e29b-41d4-a716-446655440014', 8, 25.90, 207.20, '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440011', 15, 15.90, 238.50, '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440015', 12, 22.50, 270.00, '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440016', 20, 12.90, 258.00, '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440013', 25, 5.00, 125.00, '550e8400-e29b-41d4-a716-446655440002', NOW()),
('550e8400-e29b-41d4-a716-446655440012', 18, 8.50, 153.00, '550e8400-e29b-41d4-a716-446655440003', NOW());

-- Insertar gastos de ejemplo
INSERT INTO expenses (description, amount, category_id, recorded_by, date) VALUES 
('Alquiler del local - Mes actual', 2800.00, '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '3 days'),
('Compra de carne y pollo', 850.00, '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '2 days'),
('Factura de electricidad', 320.00, '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '1 day'),
('Sueldo de cocinero', 1200.00, '550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '1 day'),
('Verduras y condimentos', 245.00, '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440003', NOW()),
('Mantenimiento de freidora', 180.00, '550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440002', NOW());

-- Insertar logs de auditoría iniciales
INSERT INTO audit_logs (table_name, operation, user_id, user_name, user_role, description) VALUES 
('system_settings', 'CONFIG', '550e8400-e29b-41d4-a716-446655440001', 'Jaime Tarazona', 'administrador', 'Sistema inicializado - Configuración inicial completada'),
('users', 'LOGIN', '550e8400-e29b-41d4-a716-446655440001', 'Jaime Tarazona', 'administrador', 'Primer inicio de sesión del administrador'),
('products', 'INSERT', '550e8400-e29b-41d4-a716-446655440001', 'Jaime Tarazona', 'administrador', 'Productos iniciales agregados al sistema');

-- ============================================
-- 12. POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================

-- Habilitar Row Level Security en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para USUARIOS
CREATE POLICY "Todos pueden ver usuarios activos" ON users FOR SELECT USING (is_active = true);
CREATE POLICY "Solo administrador puede modificar usuarios" ON users FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND role = 'administrador'
    )
);

-- Políticas para PRODUCTOS
CREATE POLICY "Todos pueden ver productos activos" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Solo administrador puede modificar productos" ON products FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND role = 'administrador'
    )
);
CREATE POLICY "Solo administrador puede actualizar productos" ON products FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND role = 'administrador'
    )
);

-- Políticas para CATEGORÍAS
CREATE POLICY "Todos pueden ver categorías activas" ON expense_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Solo administrador puede modificar categorías" ON expense_categories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND role = 'administrador'
    )
);

-- Políticas para VENTAS
CREATE POLICY "Todos pueden ver ventas" ON sales FOR SELECT USING (true);
CREATE POLICY "Socios y admin pueden crear ventas" ON sales FOR INSERT WITH CHECK (
    recorded_by = auth.uid()::text
);
CREATE POLICY "Solo quien registró o admin puede modificar ventas" ON sales FOR UPDATE USING (
    recorded_by = auth.uid()::text OR 
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND role = 'administrador'
    )
);

-- Políticas para GASTOS
CREATE POLICY "Todos pueden ver gastos" ON expenses FOR SELECT USING (true);
CREATE POLICY "Socios y admin pueden crear gastos" ON expenses FOR INSERT WITH CHECK (
    recorded_by = auth.uid()::text
);
CREATE POLICY "Solo quien registró o admin puede modificar gastos" ON expenses FOR UPDATE USING (
    recorded_by = auth.uid()::text OR 
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND role = 'administrador'
    )
);

-- Políticas para CONFIGURACIÓN (Solo administrador)
CREATE POLICY "Solo administrador puede ver configuración" ON system_settings FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND role = 'administrador'
    )
);
CREATE POLICY "Solo administrador puede modificar configuración" ON system_settings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND role = 'administrador'
    )
);

-- Políticas para AUDITORÍA (Solo administrador)
CREATE POLICY "Solo administrador puede ver auditoría" ON audit_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND role = 'administrador'
    )
);

-- Políticas para SESIONES
CREATE POLICY "Usuarios pueden ver sus propias sesiones" ON user_sessions FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Solo administrador puede ver todas las sesiones" ON user_sessions FOR ALL USING (
    user_id = auth.uid()::text OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND role = 'administrador'
    )
);

-- ============================================
-- 13. VISTAS ÚTILES PARA REPORTES
-- ============================================

-- Vista de ventas con detalles completos
CREATE VIEW sales_detailed AS
SELECT 
    s.id,
    s.quantity,
    s.unit_price,
    s.total,
    s.date,
    s.notes,
    p.name as product_name,
    u.name as recorded_by_name,
    u.role as recorded_by_role,
    s.created_at
FROM sales s
JOIN products p ON s.product_id = p.id
JOIN users u ON s.recorded_by = u.id
ORDER BY s.date DESC;

-- Vista de gastos con detalles completos
CREATE VIEW expenses_detailed AS
SELECT 
    e.id,
    e.description,
    e.amount,
    e.date,
    e.notes,
    ec.name as category_name,
    u.name as recorded_by_name,
    u.role as recorded_by_role,
    e.created_at
FROM expenses e
JOIN expense_categories ec ON e.category_id = ec.id
JOIN users u ON e.recorded_by = u.id
ORDER BY e.date DESC;

-- Vista de resumen financiero diario
CREATE VIEW daily_financial_summary AS
SELECT 
    DATE(COALESCE(s.date, e.date)) as date,
    COALESCE(SUM(s.total), 0) as total_sales,
    COALESCE(SUM(e.amount), 0) as total_expenses,
    COALESCE(SUM(s.total), 0) - COALESCE(SUM(e.amount), 0) as net_profit,
    COUNT(DISTINCT s.id) as sales_count,
    COUNT(DISTINCT e.id) as expenses_count
FROM sales s
FULL OUTER JOIN expenses e ON DATE(s.date) = DATE(e.date)
WHERE DATE(COALESCE(s.date, e.date)) >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(COALESCE(s.date, e.date))
ORDER BY date DESC;

-- Vista de productos más vendidos
CREATE VIEW top_selling_products AS
SELECT 
    p.name,
    SUM(s.quantity) as total_quantity,
    SUM(s.total) as total_revenue,
    COUNT(s.id) as times_sold,
    AVG(s.total) as avg_sale_amount
FROM products p
JOIN sales s ON p.id = s.product_id
WHERE s.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, p.name
ORDER BY total_revenue DESC;

-- Vista de actividad por usuario
CREATE VIEW user_activity_summary AS
SELECT 
    u.name,
    u.role,
    COUNT(DISTINCT s.id) as sales_registered,
    COUNT(DISTINCT e.id) as expenses_registered,
    COALESCE(SUM(s.total), 0) as total_sales_amount,
    COALESCE(SUM(e.amount), 0) as total_expenses_amount,
    MAX(GREATEST(s.created_at, e.created_at)) as last_activity
FROM users u
LEFT JOIN sales s ON u.id = s.recorded_by AND s.date >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN expenses e ON u.id = e.recorded_by AND e.date >= CURRENT_DATE - INTERVAL '30 days'
WHERE u.is_active = true
GROUP BY u.id, u.name, u.role
ORDER BY last_activity DESC;

-- ============================================
-- FINALIZACIÓN
-- ============================================
-- Este script crea una base de datos completa para FFFinazas
-- con 3 usuarios específicos (1 admin + 2 socios), seguridad
-- por roles, auditoría completa y vistas para reportes.
-- 
-- USUARIOS DE PRUEBA:
-- - admin@fffinanzas.com (Administrador: Jaime Tarazona)
-- - socio1@fffinanzas.com (Socio: Carlos Mendoza)  
-- - socio2@fffinanzas.com (Socio: María García)
-- Contraseña temporal para todos: "password"
-- ============================================

-- ============================================
-- 2. TABLA DE PRODUCTOS
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. TABLA DE CATEGORÍAS DE GASTOS
-- ============================================
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON expense_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. TABLA DE VENTAS
-- ============================================
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total DECIMAL(10,2) NOT NULL CHECK (total > 0),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. TABLA DE GASTOS
-- ============================================
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. TABLA DE AUDITORÍA
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. TABLA DE CONFIGURACIÓN DEL NEGOCIO
-- ============================================
CREATE TABLE business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(255) NOT NULL DEFAULT 'Finanzas FastFood',
    updated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_business_settings_updated_at BEFORE UPDATE ON business_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_sales_recorded_by ON sales(recorded_by);

CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_recorded_by ON expenses(recorded_by);

CREATE INDEX idx_audit_logs_date ON audit_logs(date);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- ============================================
-- 9. DATOS INICIALES (SEEDS)
-- ============================================

-- Insertar usuarios iniciales
INSERT INTO users (id, name, email, role, avatar_url) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Usuario Admin', 'superadmin@example.com', 'superadmin', '/avatars/01.png'),
('550e8400-e29b-41d4-a716-446655440002', 'Usuario Socio', 'socio@example.com', 'socio', '/avatars/02.png');

-- Insertar productos iniciales
INSERT INTO products (id, name, price) VALUES 
('550e8400-e29b-41d4-a716-446655440011', 'Hamburguesa', 5.99),
('550e8400-e29b-41d4-a716-446655440012', 'Papas Fritas', 2.49),
('550e8400-e29b-41d4-a716-446655440013', 'Gaseosa', 1.99),
('550e8400-e29b-41d4-a716-446655440014', 'Combo', 9.99);

-- Insertar categorías de gastos
INSERT INTO expense_categories (id, name) VALUES 
('550e8400-e29b-41d4-a716-446655440021', 'Ingredientes'),
('550e8400-e29b-41d4-a716-446655440022', 'Servicios'),
('550e8400-e29b-41d4-a716-446655440023', 'Alquiler'),
('550e8400-e29b-41d4-a716-446655440024', 'Salarios');

-- Insertar configuración inicial del negocio
INSERT INTO business_settings (business_name, updated_by) VALUES 
('Finanzas FastFood', '550e8400-e29b-41d4-a716-446655440001');

-- Insertar ventas de ejemplo
INSERT INTO sales (product_id, quantity, total, recorded_by) VALUES 
('550e8400-e29b-41d4-a716-446655440014', 5, 49.95, '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440011', 10, 59.90, '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440012', 20, 49.80, '550e8400-e29b-41d4-a716-446655440002');

-- Insertar gastos de ejemplo
INSERT INTO expenses (description, amount, category_id, recorded_by) VALUES 
('Alquiler mensual de la tienda', 1200.00, '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440001'),
('Factura de electricidad', 250.00, '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440001'),
('Entrega de verduras frescas', 150.00, '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440001');

-- Insertar log de auditoría inicial
INSERT INTO audit_logs (action, user_id, details) VALUES 
('Sistema Inicializado', '550e8400-e29b-41d4-a716-446655440001', 'Primer arranque de la aplicación con base de datos Supabase');

-- ============================================
-- 10. POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================

-- Habilitar Row Level Security en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios (solo pueden ver/editar su propio perfil o si son superadmin)
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Superadmins can do everything" ON users FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND role = 'superadmin'
    )
);

-- Políticas para productos (todos pueden ver, solo superadmin puede modificar)
CREATE POLICY "Everyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Only superadmin can modify products" ON products FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND role = 'superadmin'
    )
);

-- Políticas para categorías de gastos (igual que productos)
CREATE POLICY "Everyone can view expense categories" ON expense_categories FOR SELECT USING (true);
CREATE POLICY "Only superadmin can modify expense categories" ON expense_categories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND role = 'superadmin'
    )
);

-- Políticas para ventas (todos pueden ver y crear, solo el creador o superadmin puede modificar)
CREATE POLICY "Everyone can view sales" ON sales FOR SELECT USING (true);
CREATE POLICY "Users can create sales" ON sales FOR INSERT WITH CHECK (
    recorded_by = auth.uid()::text
);
CREATE POLICY "Users can update own sales or superadmin can update all" ON sales FOR UPDATE USING (
    recorded_by = auth.uid()::text OR 
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND role = 'superadmin'
    )
);

-- Políticas para gastos (igual que ventas)
CREATE POLICY "Everyone can view expenses" ON expenses FOR SELECT USING (true);
CREATE POLICY "Users can create expenses" ON expenses FOR INSERT WITH CHECK (
    recorded_by = auth.uid()::text
);
CREATE POLICY "Users can update own expenses or superadmin can update all" ON expenses FOR UPDATE USING (
    recorded_by = auth.uid()::text OR 
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND role = 'superadmin'
    )
);

-- Políticas para audit logs (todos pueden ver, solo sistema puede crear)
CREATE POLICY "Everyone can view audit logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Users can create audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- Políticas para configuración del negocio (todos pueden ver, solo superadmin puede modificar)
CREATE POLICY "Everyone can view business settings" ON business_settings FOR SELECT USING (true);
CREATE POLICY "Only superadmin can modify business settings" ON business_settings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND role = 'superadmin'
    )
);

-- ============================================
-- 11. VISTAS ÚTILES
-- ============================================

-- Vista para ventas con detalles del producto
CREATE VIEW sales_with_product AS
SELECT 
    s.id,
    s.quantity,
    s.total,
    s.date,
    s.created_at,
    s.updated_at,
    p.name as product_name,
    p.price as product_price,
    u.name as recorded_by_name
FROM sales s
JOIN products p ON s.product_id = p.id
JOIN users u ON s.recorded_by = u.id;

-- Vista para gastos con detalles de categoría
CREATE VIEW expenses_with_category AS
SELECT 
    e.id,
    e.description,
    e.amount,
    e.date,
    e.created_at,
    e.updated_at,
    ec.name as category_name,
    u.name as recorded_by_name
FROM expenses e
JOIN expense_categories ec ON e.category_id = ec.id
JOIN users u ON e.recorded_by = u.id;

-- Vista para resumen financiero diario
CREATE VIEW daily_financial_summary AS
SELECT 
    DATE(COALESCE(s.date, e.date)) as date,
    COALESCE(SUM(s.total), 0) as total_sales,
    COALESCE(SUM(e.amount), 0) as total_expenses,
    COALESCE(SUM(s.total), 0) - COALESCE(SUM(e.amount), 0) as net_profit
FROM sales s
FULL OUTER JOIN expenses e ON DATE(s.date) = DATE(e.date)
GROUP BY DATE(COALESCE(s.date, e.date))
ORDER BY date DESC;

-- ============================================
-- FINALIZACIÓN
-- ============================================
-- Este script crea una base de datos completa para FFFinazas
-- con seguridad, índices optimizados y datos iniciales.
-- 
-- Para ejecutar:
-- 1. Ve a tu proyecto en Supabase
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script
-- 5. Configura las variables de entorno en tu aplicación
-- ============================================