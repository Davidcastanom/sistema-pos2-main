-- =========================================================================
-- SISTEMA POS TIENDA MIXTA LA ESQUINITA
-- Esquema de Base de Datos y Consultas para Costos Fijos y Punto de Equilibrio
-- Compatible con PostgreSQL y SQLite
-- =========================================================================

-- 1. Tabla para almacenar la Configuración de Costos Fijos Mensuales del Negocio
CREATE TABLE IF NOT EXISTS fixed_monthly_costs (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'current_costs',
    rent NUMERIC(12, 0) NOT NULL DEFAULT 350000,          -- Arriendo del local (COP)
    utilities NUMERIC(12, 0) NOT NULL DEFAULT 120000,     -- Servicios (Luz, Agua, Gas)
    payroll NUMERIC(12, 0) NOT NULL DEFAULT 200000,       -- Empleado / Jornal / Ayudante
    services NUMERIC(12, 0) NOT NULL DEFAULT 50000,       -- Internet, Datáfono, Teléfono
    other NUMERIC(12, 0) NOT NULL DEFAULT 80000,          -- Imprevistos y otros gastos
    custom_notes TEXT DEFAULT 'Gastos fijos base de la tienda',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserción de valores iniciales si no existen
INSERT INTO fixed_monthly_costs (id, rent, utilities, payroll, services, other, custom_notes)
VALUES ('current_costs', 350000, 120000, 200000, 50000, 80000, 'Gastos fijos base de la tienda')
ON CONFLICT (id) DO NOTHING;

-- 2. Tabla de Productos con Costo de Compra y Precio de Venta
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    barcode VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price NUMERIC(12, 0) NOT NULL,                        -- Precio de venta al público (COP)
    cost_price NUMERIC(12, 0) DEFAULT 0,                  -- Costo de adquisición / compra (COP)
    stock INTEGER NOT NULL DEFAULT 0,                     -- Unidades disponibles
    min_stock INTEGER NOT NULL DEFAULT 5,                 -- Umbral mínimo para semáforo
    unit VARCHAR(50) DEFAULT 'unidades',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Transacciones / Ventas
CREATE TABLE IF NOT EXISTS sales_transactions (
    id VARCHAR(50) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal NUMERIC(12, 0) NOT NULL,
    discount NUMERIC(12, 0) DEFAULT 0,
    tax NUMERIC(12, 0) DEFAULT 0,
    total NUMERIC(12, 0) NOT NULL,                        -- Total cobrado en COP
    payment_method VARCHAR(50) NOT NULL,                  -- 'Efectivo', 'Nequi / Daviplata', etc.
    cashier_name VARCHAR(100) NOT NULL,
    customer_id VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS sales_items (
    id SERIAL PRIMARY KEY,
    sale_id VARCHAR(50) REFERENCES sales_transactions(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 0) NOT NULL,
    unit_cost NUMERIC(12, 0) NOT NULL,
    item_total NUMERIC(12, 0) NOT NULL
);

-- =========================================================================
-- CONSULTAS SQL DE NEGOCIO (REDONDEADAS Y SIN DECIMALES MOLESTOS)
-- =========================================================================

-- CONSULTA A: Obtener el Total de Gastos Fijos Mensuales
-- SELECT (rent + utilities + payroll + services + other) AS total_fixed_costs FROM fixed_monthly_costs WHERE id = 'current_costs';

-- CONSULTA B: Margen de Contribución Unitario y Porcentaje Promedio de Ganancia
-- Calcula el margen real sin decimales usando ROUND
/*
SELECT 
    ROUND(
        COALESCE(
            SUM(price - COALESCE(NULLIF(cost_price, 0), price * 0.75)) * 100.0 / NULLIF(SUM(price), 0), 
            25.0
        )
    ) AS average_profit_margin_pct
FROM products 
WHERE price > 0;
*/

-- CONSULTA C: Cálculo Completo del Punto de Equilibrio y Progreso del Mes
/*
WITH costs AS (
    SELECT 
        (rent + utilities + payroll + services + other) AS total_fixed_costs
    FROM fixed_monthly_costs
    WHERE id = 'current_costs'
),
margin AS (
    SELECT 
        GREATEST(5.0, LEAST(80.0, 
            COALESCE(
                SUM(price - COALESCE(NULLIF(cost_price, 0), price * 0.75)) * 100.0 / NULLIF(SUM(price), 0), 
                25.0
            )
        )) AS margin_pct
    FROM products 
    WHERE price > 0
),
monthly_sales AS (
    SELECT 
        COALESCE(SUM(total), 0) AS total_sales_this_month
    FROM sales_transactions
    WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
)
SELECT 
    costs.total_fixed_costs,
    ROUND(margin.margin_pct) AS average_margin_pct,
    -- Meta de Venta Mensual (Punto de Equilibrio en Dinero) redondeado a entero
    ROUND(costs.total_fixed_costs / (margin.margin_pct / 100.0)) AS break_even_monthly_sales,
    -- Meta Diaria sugerida (dividido en 30 días)
    ROUND((costs.total_fixed_costs / (margin.margin_pct / 100.0)) / 30.0) AS break_even_daily_sales,
    monthly_sales.total_sales_this_month,
    -- Porcentaje de avance redondeado a 1 decimal
    ROUND(
        (monthly_sales.total_sales_this_month * 100.0 / NULLIF((costs.total_fixed_costs / (margin.margin_pct / 100.0)), 0))::numeric, 
        1
    ) AS progress_pct
FROM costs, margin, monthly_sales;
*/

-- CONSULTA D: Los Campeones de la Tienda (Top 5 Productos con Mayor Rotación)
/*
SELECT 
    p.id,
    p.title,
    p.category,
    SUM(si.quantity) AS total_units_sold,
    ROUND(SUM(si.item_total)) AS total_revenue
FROM sales_items si
JOIN products p ON si.product_id = p.id
JOIN sales_transactions st ON si.sale_id = st.id
WHERE st.created_at >= CURRENT_DATE
GROUP BY p.id, p.title, p.category
ORDER BY total_units_sold DESC, total_revenue DESC
LIMIT 5;
*/
