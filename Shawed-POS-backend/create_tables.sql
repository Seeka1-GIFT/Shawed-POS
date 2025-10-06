-- Shawed-POS Database Tables Creation Script
-- Run this in your PostgreSQL Shawed-POS database

-- Create Users table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT DEFAULT 'USER' NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL
);

-- Create Suppliers table
CREATE TABLE IF NOT EXISTS "Supplier" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "email" TEXT,
    "balance" DECIMAL(10,2) DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL
);

-- Create Products table
CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "barcode" TEXT UNIQUE,
    "quantity" INTEGER DEFAULT 0,
    "buyPrice" DECIMAL(10,2) NOT NULL,
    "sellPrice" DECIMAL(10,2) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "supplierId" TEXT,
    "lowStockThreshold" INTEGER DEFAULT 5,
    "createdAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL
);

-- Create Customers table
CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "email" TEXT,
    "balance" DECIMAL(10,2) DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL
);

-- Create Sales table
CREATE TABLE IF NOT EXISTS "Sale" (
    "id" TEXT PRIMARY KEY,
    "date" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) DEFAULT 0.0,
    "tax" DECIMAL(10,2) DEFAULT 0.0,
    "paymentMethod" TEXT DEFAULT 'Cash',
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL
);

-- Create Sale Items table
CREATE TABLE IF NOT EXISTS "SaleItem" (
    "id" TEXT PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    
    FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
);

-- Create foreign key constraint mapping columns to snake_case for Product model
ALTER TABLE "Product" ALTER COLUMN "buyPrice" SET DEFAULT 0;
ALTER TABLE "Product" ALTER COLUMN "sellPrice" SET DEFAULT 0;
ALTER TABLE "Product" ADD CONSTRAINT "Product_buyPrice_check" CHECK ("buyPrice" >= 0);
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellPrice_check" CHECK ("sellPrice" >= 0);

-- Create foreign key constraint mapping columns to snake_case for Sale model
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_total_check" CHECK ("total" >= 0);
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_discount_check" CHECK ("discount" >= 0);
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_tax_check" CHECK ("tax" >= 0);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS "Product_barcode_idx" ON "Product"("barcode");
CREATE INDEX IF NOT EXISTS "Product_category_idx" ON "Product"("category");
CREATE INDEX IF NOT EXISTS "Product_supplierId_idx" ON "Product"("supplierId");
CREATE INDEX IF NOT EXISTS "Customer_email_idx" ON "Customer"("email");
CREATE INDEX IF NOT EXISTS "Customer_phone_idx" ON "Customer"("phone");
CREATE INDEX IF NOT EXISTS "Sale_date_idx" ON "Sale"("date");
CREATE INDEX IF NOT EXISTS "Sale_customerId_idx" ON "Sale"("customerId");
CREATE INDEX IF NOT EXISTS "SaleItem_saleId_idx" ON "SaleItem"("saleId");
CREATE INDEX IF NOT EXISTS "SaleItem_productId_idx" ON "SaleItem"("productId");

-- Display created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('User', 'Supplier', 'Product', 'Customer', 'Sale', 'SaleItem')
ORDER BY table_name;



