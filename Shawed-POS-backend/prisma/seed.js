/**
 * Database Seeder - Populates the database with sample data
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  console.log('👤 Creating admin user...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@shawedpos.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@shawedpos.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin user created: ${adminUser.email}`);

  // Create sample suppliers
  console.log('🏪 Creating suppliers...');
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { id: 'supplier-1' },
      update: {},
      create: {
        id: 'supplier-1',
        name: 'Fresh Foods Ltd',
        phone: '+1234567890',
        address: '123 Supplier Street, City',
        email: 'contact@freshfoods.com',
        balance: 0.0,
      },
    }),
    prisma.supplier.upsert({
      where: { id: 'supplier-2' },
      update: {},
      create: {
        id: 'supplier-2',
        name: 'Beverage Distributors',
        phone: '+0987654321',
        address: '456 Distribution Ave, Town',
        email: 'orders@beverages.com',
        balance: 0.0,
      },
    }),
  ]);
  console.log(`✅ Created ${suppliers.length} suppliers`);

  // Create sample products
  console.log('📦 Creating products...');
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'product-1' },
      update: {},
      create: {
        id: 'product-1',
        name: 'Premium Soft Drink',
        category: 'Beverages',
        barcode: '037551000340',
        quantity: 50,
        buyPrice: 2.50,
        sellPrice: 4.99,
        expiryDate: new Date('2025-12-31'),
        supplierId: 'supplier-1',
        lowStockThreshold: 10,
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-2' },
      update: {},
      create: {
        id: 'product-2',
        name: 'Healthy Energy Bars',
        quantity: 25,
        category: 'Snacks',
        barcode: '123456789012',
        buyPrice: 1.80,
        sellPrice: 3.50,
        expiryDate: new Date('2025-08-31'),
        supplierId: 'supplier-2',
        lowStockThreshold: 5,
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-3' },
      update: {},
      create: {
        id: 'product-3',
        name: 'Organic Apple Juice',
        category: 'Beverages',
        barcode: '987654321098',
        quantity: 30,
        buyPrice: 3.20,
        sellPrice: 6.99,
        expiryDate: new Date('2025-11-30'),
        supplierId: 'supplier-1',
        lowStockThreshold: 8,
      },
    }),
  ]);
  console.log(`✅ Created ${products.length} products`);

  // Create sample customers
  console.log('👥 Creating customers...');
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { id: 'customer-1' },
      update: {},
      create: {
        id: 'customer-1',
        name: 'John Doe',
        phone: '+1234567890',
        address: '123 Main St, City',
        email: 'john.doe@example.com',
        balance: 0.0,
      },
    }),
    prisma.customer.upsert({
      where: { id: 'customer-2' },
      update: {},
      create: {
        id: 'customer-2',
        name: 'Jane Smith',
        phone: '+0987654321',
        address: '456 Oak Ave, Town',
        email: 'jane.smith@example.com',
        balance: 25.50,
      },
    }),
  ]);
  console.log(`✅ Created ${customers.length} customers`);

  // Create sample sales
  console.log('💰 Creating sales...');
  const sale = await prisma.sale.upsert({
    where: { id: 'sale-1' },
    update: {},
    create: {
      id: 'sale-1',
      total: 15.98,
      discount: 2.00,
      tax: 2.16,
      paymentMethod: 'Cash',
      customerId: 'customer-1',
      saleItems: {
        create: [
          {
            productId: 'product-1',
            quantity: 2,
            price: 4.99,
            total: 9.98,
          },
          {
            productId: 'product-2',
            quantity: 2,
            price: 3.50,
            total: 7.00,
          },
        ],
      },
    },
  });
  console.log(`✅ Created sample sale: $${sale.total}`);

  // Create sample expenses
  console.log('📊 Creating expenses...');
  const expenses = await Promise.all([
    prisma.expense.upsert({
      where: { id: 'expense-1' },
      update: {},
      create: {
        id: 'expense-1',
        description: 'Monthly electricity bill',
        category: 'Utilities',
        amount: 150.00,
        date: new Date(),
      },
    }),
    prisma.expense.upsert({
      where: { id: 'expense-2' },
      update: {},
        create: {
          id: 'expense-2',
          description: 'Staff salaries',
          category: 'Salaries',
          amount: 800.00,
          date: new Date(),
        },
    }),
  ]);
  console.log(`✅ Created ${expenses.length} expenses`);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
