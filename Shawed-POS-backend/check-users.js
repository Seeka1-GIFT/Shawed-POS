#!/usr/bin/env node

/**
 * Script to check all users in the database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('👥 Checking all users in database...');
  
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log(`✅ Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
