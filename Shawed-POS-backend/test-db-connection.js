const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test a simple query
    console.log('🔄 Testing sales query...');
    const sales = await prisma.sale.findMany({
      take: 5,
      include: {
        saleItems: true,
        customer: true
      }
    });
    console.log(`✅ Found ${sales.length} sales in database`);
    
    console.log('🔄 Testing expenses query...');
    const expenses = await prisma.expense.findMany({
      take: 5
    });
    console.log(`✅ Found ${expenses.length} expenses in database`);
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database disconnected');
  }
}

testConnection();
