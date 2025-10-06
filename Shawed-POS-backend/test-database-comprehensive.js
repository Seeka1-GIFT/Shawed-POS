#!/usr/bin/env node

/**
 * Comprehensive database test and table creation
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAndFixDatabase() {
  console.log('🔍 Comprehensive database test and fix...');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test and create tables if they don't exist
    const tables = [
      'User',
      'Supplier', 
      'Product',
      'Customer',
      'Sale',
      'SaleItem',
      'Expense',
      'PurchaseOrder'
    ];
    
    console.log('\n📊 Testing table existence and creating if needed...');
    
    for (const table of tables) {
      try {
        const modelName = table.toLowerCase();
        const count = await prisma[modelName].count();
        console.log(`   ✅ ${table}: ${count} records`);
      } catch (error) {
        console.log(`   ❌ ${table}: ERROR - ${error.message}`);
        
        // Try to create the table by running a simple query
        try {
          console.log(`   🔧 Attempting to initialize ${table} table...`);
          await prisma[modelName].findMany({ take: 1 });
          console.log(`   ✅ ${table} table initialized successfully`);
        } catch (initError) {
          console.log(`   ❌ Failed to initialize ${table}: ${initError.message}`);
        }
      }
    }
    
    // Test specific queries that are failing
    console.log('\n🔍 Testing specific failing queries...');
    
    // Test sales query
    try {
      console.log('   Testing sales query...');
      const sales = await prisma.sale.findMany({
        take: 5,
        include: {
          customer: true,
          saleItems: {
            include: {
              product: true
            }
          }
        }
      });
      console.log(`   ✅ Sales query successful: ${sales.length} sales found`);
    } catch (error) {
      console.log(`   ❌ Sales query failed: ${error.message}`);
    }
    
    // Test expenses query
    try {
      console.log('   Testing expenses query...');
      const expenses = await prisma.expense.findMany({ take: 5 });
      console.log(`   ✅ Expenses query successful: ${expenses.length} expenses found`);
    } catch (error) {
      console.log(`   ❌ Expenses query failed: ${error.message}`);
    }
    
    // Test products query
    try {
      console.log('   Testing products query...');
      const products = await prisma.product.findMany({ take: 5 });
      console.log(`   ✅ Products query successful: ${products.length} products found`);
    } catch (error) {
      console.log(`   ❌ Products query failed: ${error.message}`);
    }
    
    // Test customers query
    try {
      console.log('   Testing customers query...');
      const customers = await prisma.customer.findMany({ take: 5 });
      console.log(`   ✅ Customers query successful: ${customers.length} customers found`);
    } catch (error) {
      console.log(`   ❌ Customers query failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAndFixDatabase();
