/**
 * Simplified Node.js script to create Shawed-POS tables
 */

const { Pool } = require('pg');

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
    console.log('🗄️ Connecting to PostgreSQL...');
    
    // Create Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'USER' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');
    
    // Create Suppliers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        email TEXT,
        balance DECIMAL(10,2) DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Suppliers table created');
    
    // Create Customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        email TEXT,
        balance DECIMAL(10,2) DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Customers table created');
    
    // Create Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        barcode TEXT UNIQUE,
        quantity INTEGER DEFAULT 0,
        buy_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        sell_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        expiry_date TIMESTAMP,
        supplier_id TEXT,
        low_stock_threshold INTEGER DEFAULT 5,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Products table created');
    
    // Create Sales table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        sale_date TIMESTAMP DEFAULT NOW(),
        total DECIMAL(10,2) NOT NULL,
        discount DECIMAL(10,2) DEFAULT 0.0,
        tax DECIMAL(10,2) DEFAULT 0.0,
        payment_method TEXT DEFAULT 'Cash',
        customer_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Sales table created');
    
    // Create Sale Items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        sale_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Sale items table created');
    
    console.log('\n🎉 ALL SHAWED-POS TABLES CREATED SUCCESSFULLY!');
    console.log('📋 Tables created: users, suppliers, products, customers, sales, sale_items');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createTables();
