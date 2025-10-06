#!/usr/bin/env node

/**
 * Test database tables and connection
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🔍 Testing database connection and tables...');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test each table
    const tables = [
      { name: 'User', query: prisma.user.count() },
      { name: 'Product', query: prisma.product.count() },
      { name: 'Customer', query: prisma.customer.count() },
      { name: 'Sale', query: prisma.sale.count() },
      { name: 'SaleItem', query: prisma.saleItem.count() },
      { name: 'Expense', query: prisma.expense.count() },
      { name: 'Supplier', query: prisma.supplier.count() },
      { name: 'PurchaseOrder', query: prisma.purchaseOrder.count() }
    ];
    
    console.log('\n📊 Table counts:');
    for (const table of tables) {
      try {
        const count = await table.query;
        console.log(`   ${table.name}: ${count} records`);
      } catch (error) {
        console.log(`   ❌ ${table.name}: ERROR - ${error.message}`);
      }
    }
    
    // Test a simple sales query
    console.log('\n🔍 Testing sales query...');
    try {
      const sales = await prisma.sale.findMany({
        take: 1,
        include: {
          customer: true,
          saleItems: {
            include: {
              product: true
            }
          }
        }
      });
      console.log(`✅ Sales query successful: ${sales.length} sales found`);
    } catch (error) {
      console.log(`❌ Sales query failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
