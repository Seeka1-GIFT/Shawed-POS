const { PrismaClient } = require('@prisma/client');

async function testExpensesTable() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing expenses table...');
    
    // Test 1: Check if table exists
    console.log('\n1. Testing table existence...');
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'expenses' 
      ORDER BY ordinal_position;
    `;
    console.log('✅ Table structure:', tableInfo);
    
    // Test 2: Try to create an expense
    console.log('\n2. Testing expense creation...');
    const testExpense = await prisma.expense.create({
      data: {
        description: 'Test Expense',
        category: 'Test Category',
        amount: 10.50,
        date: new Date()
      }
    });
    console.log('✅ Expense created:', testExpense);
    
    // Test 3: Try to read expenses
    console.log('\n3. Testing expense retrieval...');
    const expenses = await prisma.expense.findMany();
    console.log('✅ Expenses found:', expenses.length);
    console.log('Sample expense:', expenses[0]);
    
    // Test 4: Clean up test data
    console.log('\n4. Cleaning up test data...');
    await prisma.expense.delete({
      where: { id: testExpense.id }
    });
    console.log('✅ Test expense deleted');
    
    console.log('\n🎉 All tests passed! Expenses table is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
  }
}

testExpensesTable();
