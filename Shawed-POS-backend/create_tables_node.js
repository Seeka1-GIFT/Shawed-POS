/**
 * Node.js script to create Shawed-POS tables in PostgreSQL
 * This connects directly to PostgreSQL and creates all necessary tables
 */

const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Shawed-POS',
  password: 'postgres123',
  port: 5432,
});

async function createTables() {
  const client = await pool.connect();
  
  try {
    console.log('🗄️ Connecting to PostgreSQL Shawed-POS database...');
    
    // Drop tables if they exist (optional - uncomment if you want to recreate)
    // await client.query('DROP TABLE IF EXISTS "SaleItem" CASCADE');
    // await client.query('DROP TABLE IF EXISTS "Sale" CASCADE');
    // await client.query('DROP TABLE IF EXISTS "Product" CASCADE');
    // await client.query('DROP TABLE IF EXISTS "Customer" CASCADE');
    // await client.query('DROP TABLE IF EXISTS "Supplier" CASCADE');
    // await client.query('DROP TABLE IF EXISTS "User" CASCADE');
    
    console.log('📊 Creating Tables...');
    
    // Create Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'USER' NOT NULL,
        "createdAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ User table created');
    
    // Create Suppliers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Supplier" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        "phone" TEXT,
        "address" TEXT,
        "email" TEXT,
        "balance" DECIMAL(10,2) DEFAULT 0.0,
        "createdAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP(৩) DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Supplier table created');
    
    // Create Customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Customer" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "phone" TEXT,
        "address" TEXT,
        "email" TEXT,
        "balance" DECIMAL(10,2) DEFAULT 0.0,
        "createdAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Customer table created');
    
    // Create Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Product" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "barcode" TEXT UNIQUE,
        "quantity" INTEGER DEFAULT 0,
        "buyPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "sellPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "expiryDate" TIMESTAMP(3),
        "supplierId" TEXT,
        "lowStockThreshold" INTEGER DEFAULT 5,
        "createdAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
        
        FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Product table created');
    
    // Create Sales table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Sale" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "date" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
        "total" DECIMAL(10,2) NOT NULL,
        "discount" DECIMAL(10,2) DEFAULT 0.0,
        "tax" DECIMAL(10,2) DEFAULT 0.0,
        "paymentMethod" TEXT DEFAULT 'Cash',
        "customerId" TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
        
        FOREIGN KEY ("customerId") REFERENCES "Customer"(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Sale table created');
    
    // Create Sale Items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "SaleItem" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "saleId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "total" DECIMAL(10,2) NOT NULL,
        "createdAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
        
        FOREIGN KEY ("saleId") REFERENCES "Sale"(id) ON DELETE CASCADE,
        FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ SaleItem table created');
    
    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS "idx_product_barcode" ON "Product"("barcode");');
    await client.query('CREATE INDEX IF NOT EXISTS "idx_product_category" ON "Product"("category");');
    await client.query('CREATE INDEX IF NOT EXISTS "idx_sale_date" ON "Sale"("date");');
    console.log('✅ Indexes created');
    
    // Insert sample data
    console.log('📦 Inserting sample data...');
    
    // Insert admin user (password: password123)
    await client.query(`
      INSERT INTO "User" (id, name, email, password, role) 
      VALUES ('admin-001', 'Admin User', 'admin@shawedpos.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN')
      ON CONFLICT (email) DO NOTHING
    `);
    
    // Insert suppliers
    await client.query(`
      INSERT INTO "Supplier" (id, name, "phone", "address", "email") VALUES 
        ('supp-001', 'Fresh Foods Ltd', '+1234567890', '123 Supplier Street, City', 'contact@freshfoods.com'),
        ('supp-002', 'Beverage Distributors', '+0987654321', '456 Distribution Ave, Town', 'orders@beverages.com')
      ON CONFLICT (id) DO NOTHING
    `);
    
    // Insert customers
    await client.query(`
      INSERT INTO "Customer" (id, "name", "phone", "address", "email", "balance") VALUES 
        ('cust-001', 'John Doe', '+1234567890', '123 Main St, City', 'john.doe@example.com', 0.0),
        ('cust-002', 'Jane Smith', '+0987654321', '456 Oak Ave, Town', 'jane.smith@example.com', 25.50)
      ON CONFLICT (id) DO NOTHING
    `);
    
    // Insert products
    await client.query(`
      INSERT INTO "Product" (id, "name", "category", "barcode", "quantity", "buyPrice", "sellPrice", "expiryDate", "supplierId", "lowStockThreshold") VALUES 
        ('prod-001', 'Premium Soft Drink', 'Beverages', '037551000340', 50, 2.50, 4.99, '2025-12-31 00:00:00', 'supp-001', 10),
        ('prod-002', 'Healthy Energy Bars', 'Snacks', '123456789012', 25, 1.80, 3.50, '2025-08-31 00:00:00', 'supp-002', 5),
        ('prod-003', 'Organic Apple Juice', 'Beverages', '987654321098', 30, 3.20, 6.99, '2025-11-30 00:00:00', 'supp-001', 8)
      ON CONFLICT (id) DO NOTHING
    `);
    
    // Insert sample sale
    await client.query(`
      INSERT INTO "Sale" (id, "total", "discount", "tax", "paymentMethod", "customerId", "date") VALUES 
        ('sale-001', 15.98, 2.00, 2.16, 'Cash', 'cust-001', NOW())
      ON CONFLICT (id) DO NOTHING
    `);
    
    await client.query(`
      INSERT INTO "SaleItem" ("saleId", "productId", "quantity", "price", "total") VALUES 
        ('sale-001', 'prod-001', 2, 4.99, 9.98),
        ('sale-001', 'prod-002', 2, 3.50, 7.00)
      ON CONFLICT (id) DO NOTHING
    `);
    
    console.log('✅ Sample data inserted');
    
    // List all created tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('User', 'Supplier', 'Product', 'Customer', 'Sale', 'SaleItem')
      ORDER BY table_name
    `);
    
    console.log('\n🎉 SHAWED-POS TABLES CREATED SUCCESSFULLY!');
    console.log('📋 Tables created:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    console.log('\n🚀 Your PostgreSQL database is ready!');
    console.log('👤 Admin login: admin@shawedpos.com / password123');
    console.log('📦 Sample data: 3 products, 2 customers, 1 sale');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
createTables()
  .then(() => {
    console.log('\n✅ Database setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Database setup failed:', error);
    process.exit(1);
  });
