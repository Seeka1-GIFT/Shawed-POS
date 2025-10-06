# PowerShell script to create Shawed-POS tables in PostgreSQL
# Run this script to create all necessary tables

$env:DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/Shawed-POS"

Write-Host "🗄️ Creating Shawed-POS tables in PostgreSQL..." -ForegroundColor Green

# Set PostgreSQL connection parameters
$env:PGPASSWORD = "postgres123"
$env:PGUSER = "postgres"
$env:PGHOST = "localhost"
$env:PGPORT = "5432"
$env:PGDATABASE = "Shawed-POS"

# Create tables using psql
$sqlCommands = @"
-- Drop existing tables if they exist (optional)
DROP TABLE IF EXISTS "SaleItem" CASCADE;
DROP TABLE IF EXISTS "Sale" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "Customer" CASCADE;
DROP TABLE IF EXISTS "Supplier" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Create Users table
CREATE TABLE "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'USER' NOT NULL,
    \"createdAt\" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    \"updatedAt\" TIMESTAMP(3) DEFAULT NOW() NOT NULL
);

-- Create Suppliers table
CREATE TABLE "Supplier" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    \"phone\" TEXT,
    \"address\" TEXT,
    \"email\" TEXT,
    \"balance\" DECIMAL(10,2) DEFAULT 0.0,
    \"createdAt\" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    \"updatedAt\" TIMESTAMP(3) DEFAULT NOW() NOT NULL
);

-- Create Customers table
CREATE TABLE "Customer" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    \"name\" TEXT NOT NULL,
    \"phone\" TEXT,
    \"address\" TEXT,
    \"email\" TEXT,
    \"balance\" DECIMAL(10,2) DEFAULT 0.0,
    \"createdAt\" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    \"updatedAt\" TIMESTAMP(3) DEFAULT NOW() NOT NULL
);

-- Create Products table
CREATE TABLE "Product" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    \"name\" TEXT NOT NULL,
    \"category\" TEXT NOT NULL,
    \"barcode\" TEXT UNIQUE,
    \"quantity\" INTEGER DEFAULT 0,
    \"buyPrice\" DECIMAL(10,2) NOT NULL DEFAULT 0,
    \"sellPrice\" DECIMAL(10,2) NOT NULL DEFAULT 0,
    \"expiryDate\" TIMESTAMP(3),
    \"supplierId\" TEXT,
    \"lowStockThreshold\" INTEGER DEFAULT 5,
    \"createdAt\" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    \"updatedAt\" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    
    FOREIGN KEY (\"supplierId\") REFERENCES \"Supplier\"(id) ON DELETE SET NULL
);

-- Create Sales table
CREATE TABLE "Sale" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    \"date\" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    \"total\" DECIMAL(10,2) NOT NULL,
    \"discount\" DECIMAL(10,2) DEFAULT 0.0,
    \"tax\" DECIMAL(10,2) DEFAULT 0.0,
    \"paymentMethod\" TEXT DEFAULT 'Cash',
    \"customerId\" TEXT,
    \"createdAt\" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    \"updatedAt\" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    
    FOREIGN KEY (\"customerId\") REFERENCES \"Customer\"(id) ON DELETE SET NULL
);

-- Create Sale Items table
CREATE TABLE "SaleItem" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    \"saleId\" TEXT NOT NULL,
    \"productId\" TEXT NOT NULL,
    \"quantity\" INTEGER NOT NULL,
    \"price\" DECIMAL(10,2) NOT NULL,
    \"total\" DECIMAL(10,2) NOT NULL,
    \"createdAt\" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    
    FOREIGN KEY (\"saleId\") REFERENCES \"Sale\"(id) ON DELETE CASCADE,
    FOREIGN KEY (\"productId\") REFERENCES \"Product\"(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX \"Product_barcode_idx\" ON \"Product\"(\"barcode\");
CREATE INDEX \"Product_category_idx\" ON \"Product\"(\"category\");
CREATE INDEX \"Product_supplierId_idx\" ON \"Product\"(\"supplierId\");
CREATE INDEX \"Customer_email_idx\" ON \"Customer\"(\"email\");
CREATE INDEX \"Sale_date_idx\" ON \"Sale\"(\"date\");
CREATE INDEX \"Sale_customerId_idx\" ON \"Sale\"(\"customerId\");
CREATE INDEX \"SaleItem_saleId_idx\" ON \"SaleItem\"(\"saleId\");

-- Insert sample data
-- Create admin user
INSERT INTO \"User\" (id, name, email, password, role) VALUES (
    'clx123admin001',
    'Admin User',
    'admin@shawedpos.com',
    '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'ADMIN'
);

-- Create suppliers
INSERT INTO \"Supplier\" (id, name, \"phone\", \"address\", \"email\") VALUES 
    ('supp-001', 'Fresh Foods Ltd', '+1234567890', '123 Supplier Street, City', 'contact@freshfoods.com'),
    ('supp-002', 'Beverage Distributors', '+0987654321', '456 Distribution Ave, Town', 'orders@beverages.com');

-- Create customers
INSERT INTO \"Customer\" (id, \"name\", \"phone\", \"address\", \"email\", \"balance\") VALUES 
    ('cust-001', 'John Doe', '+1234567890', '123 Main St, City', 'john.doe@example.com', 0.0),
    ('cust-002', 'Jane Smith', '+0987654321', '456 Oak Ave, Town', 'jane.smith@example.com', 25.50);

-- Create products
INSERT INTO \"Product\" (id, \"name\", \"category\", \"barcode\", \"quantity\", \"buyPrice\", \"sellPrice\", \"expiryDate\", \"supplierId\", \"lowStockThreshold\") VALUES 
    ('prod-001', 'Premium Soft Drink', 'Beverages', '037551000340', 50, 2.50, 4.99, '2025-12-31 00:00:00', 'supp-001', 10),
    ('prod-002', 'Healthy Energy Bars', 'Snacks', '123456789012', 25, 1.80, 3.50, '2025-08-31 00:00:00', 'supp-002', 5),
    ('prod-003', 'Organic Apple Juice', 'Beverages', '987654321098', 30, 3.20, 6.99, '2025-11-30 00:00:00', 'supp-001', 8);

-- Create a sample sale
INSERT INTO \"Sale\" (id, \"total\", \"discount\", \"tax\", \"paymentMethod\", \"customerId\", \"date\") VALUES 
    ('sale-001', 15.98, 2.00, 2.16, 'Cash', 'cust-001', NOW());

INSERT INTO \"SaleItem\" (\"saleId\", \"productId\", \"quantity\", \"price\", \"total\") VALUES 
    ('sale-001', 'prod-001', 2, 4.99, 9.98),
    ('sale-001', 'prod-002', 2, 3.50, 7.00);

-- Show created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('User', 'Supplier', 'Product', 'Customer', 'Sale', 'SaleItem')
ORDER BY table_name;
"@

try {
    # Execute the SQL commands
    Write-Host "📊 Executing database creation script..." -ForegroundColor Yellow
    $sqlCommands | psql "postgresql://postgres:postgres123@localhost:5432/Shawed-POS" 2>&1
    
    Write-Host "✅ Shawed-POS tables created successfully!" -ForegroundColor Green
    Write-Host "🎉 Database is ready with sample data!" -ForegroundColor Cyan
    Write-Host "📋 Tables created: User, Supplier, Product, Customer, Sale, SaleItem" -ForegroundColor Blue
    
} catch {
    Write-Host "❌ Error creating tables: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔧 Please check your PostgreSQL connection and credentials" -ForegroundColor Yellow
}



