#!/usr/bin/env node

/**
 * Script to create a new admin user
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('🔐 Creating new admin user...');
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create new admin user
    const adminUser = await prisma.user.create({
      data: {
        name: 'Main Admin',
        email: 'mainadmin@shawedpos.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    
    console.log('✅ New admin user created successfully!');
    console.log('📧 Email: mainadmin@shawedpos.com');
    console.log('🔑 Password: admin123');
    console.log('👤 User ID:', adminUser.id);
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  User with this email already exists');
      console.log('📧 Email: mainadmin@shawedpos.com');
      console.log('🔑 Password: admin123');
    } else {
      console.error('❌ Error creating admin user:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
