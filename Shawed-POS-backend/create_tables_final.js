/**
 * Final Node.js script to create Shawed-POS tables - No UUID dependency
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
    console.log('🗄️ Connecting to PostgreSQL Shawed-POS database...');
    
    // Create Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
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
        id TEXT PRIMARY KEY,
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
        id TEXT PRIMARY KEY,
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
        id TEXT PRIMARY KEY,
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
        id TEXT PRIMARY KEY,
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
        id TEXT PRIMARY KEY,
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
    
    // Insert sample data
    console.log('\n📦 Inserting sample data...');
    
    // Insert admin user (password: password123)
    await client.query(`
      INSERT INTO users (id, name, email, password, role) 
      VALUES ('admin-001', 'Admin User', 'admin@shawedpos.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN')
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('👤 Admin user created');
    
    // Insert suppliers
    await client.query(`
      INSERT INTO suppliers (id, name, phone, address, email) VALUES 
        ('supp-001', 'Fresh Foods Ltd', '+1234567890', '123 Supplier Street, City', 'contact@freshfoods.com'),
        ('supp-002', 'Beverage Distributors', '+0987654321', '456 Distribution Ave, Town', 'orders@beverages.com')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('🏪 Suppliers created');
    
    // Insert customers
    await client.query(`
      INSERT INTO customers (id, name, phone, address, email, balance) VALUES 
        ('cust-001', 'John Doe', '+1234567890', '123 Main St, City', 'john.doe@example.com', 0.0),
        ('cust-002', 'Jane Smith', '+0987654321', '456 Oak Ave, Town', 'jane.smith@example.com', 25.50)
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('👥 Customers created');
    
    // Insert products
    await client.query(`
      INSERT INTO products (id, name, category, barcode, quantity, buy_price, sell_price, expiry_date, supplier_id, low_stock_threshold) VALUES 
        ('prod-001', 'Premium Soft Drink', 'Beverages', '037551000340', 50, 2.50, 4.99, '2025-12-31 00:00:00', 'supp-001', 10),
        ('prod-002', 'Healthy Energy Bars', 'Snacks', '123456789012', 25, 1.80, 3.50, '2025-08-31 00:00:00', 'supp-002', 5),
        ('prod-003', 'Organic Apple Juice', 'Beverages', '987654321098', 30, 3.20, 6.99, '2025-11-30 00:00:00', 'supp-001', 8)
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('📦 Products created');
    
    // Insert sample sale
    await client.query(`
      INSERT INTO sales (id, total, discount, payment_method, customer_id) VALUES 
        ('sale-001', 15.98, 2.00, 'Cash', 'cust-001') ON CONFLICT (id) DO NOTHING
    `);
    
    await client.query(`
      INSERT INTO sale_items (id, sale_id, product_id, quantity, price, total) VALUES 
        ('item-001', 'sale-001', 'prod-001', 2, 4.99, 9.98),
        ('item-002', 'sale-001', 'prod-002', 2, 3.50, 7.00)
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('💰 Sample sale created');
    
    // List all created tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'suppliers', 'products', 'customers', 'sales', 'sale_items')
      ORDER BY table_name
    `);
    
    console.log('\n🎉 SHAWED-POS DATABASE TABLES CREATED SUCCESSFULLY!');
    console.log('📋 Tables in your PostgreSQL database:');
    result.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    // Count records
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const productCount = await client.query('SELECT COUNT(*) FROM products');
    const customerCount = await client.query('SELECT COUNT(*) FROM customers');
    
    console.log('\n📊 Sample Data:');
    console.log(`   👤 Users: ${userCount.rows[0].count}`);
    console.log(`   📦 Products: ${productCount.rows[0].count}`);
    console.log(`   👥 Customers: ${customerCount.rows[0].count}`);
    
    console.log('\n🚀 YOUR POSTGRESQL DATABASE IS READY!');
    console.log('👤 Admin login: admin@shawedpos.com / password123');
    console.log('📦 Sample inventory loaded with test products');
    console.log('💡 You can now refresh your pgAdmin to see the tables!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createTables();




