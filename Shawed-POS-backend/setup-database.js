#!/usr/bin/env node

/**
 * Database Setup Script for Shawed-POS
 * This script helps you set up your Neon database tables
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Shawed-POS Database Setup');
console.log('=============================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('Please create a .env file with your DATABASE_URL');
  console.log('Example:');
  console.log('DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"');
  console.log('\nYou can get your connection string from your Neon dashboard.\n');
  process.exit(1);
}

// Read .env file
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL not found in .env file!');
  console.log('Please add your Neon database connection string to .env file');
  console.log('Example:');
  console.log('DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log(`📊 Database URL: ${process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@')}\n`);

try {
  console.log('🔄 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated\n');

  console.log('🔄 Pushing database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Database schema pushed successfully\n');

  console.log('🔄 Seeding database...');
  try {
    execSync('npm run db:seed', { stdio: 'inherit' });
    console.log('✅ Database seeded successfully\n');
  } catch (error) {
    console.log('⚠️  Seeding failed (this is optional)\n');
  }

  console.log('🎉 Database setup completed successfully!');
  console.log('Your Neon database now has all the required tables.');
  console.log('\nNext steps:');
  console.log('1. Check your Neon console to see the tables');
  console.log('2. Test your application connection');
  console.log('3. Deploy your backend to Render\n');

} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  console.log('\nTroubleshooting:');
  console.log('1. Make sure your DATABASE_URL is correct');
  console.log('2. Check that your Neon database is running');
  console.log('3. Verify your network connection');
  process.exit(1);
}
