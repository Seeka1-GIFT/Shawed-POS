const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testExpenseCreation() {
  try {
    console.log('🧪 Testing expense creation...');
    
    // Test data
    const testExpense = {
      description: 'Test Expense',
      category: 'Test Category',
      amount: 10.50,
      date: new Date()
    };
    
    console.log('📥 Test data:', testExpense);
    
    // Try to create expense
    const expense = await prisma.expense.create({
      data: testExpense
    });
    
    console.log('✅ Expense created successfully:', expense);
    
    // Clean up - delete the test expense
    await prisma.expense.delete({
      where: { id: expense.id }
    });
    
    console.log('🧹 Test expense deleted');
    
  } catch (error) {
    console.error('❌ Error creating expense:', error);
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

testExpenseCreation();
