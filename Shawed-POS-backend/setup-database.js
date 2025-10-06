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

console.log('🔍 Checking environment variables...');
console.log(`📁 Current directory: ${__dirname}`);
console.log(`📄 Environment file path: ${envPath}`);

// Debug: Show all environment variables that start with DATABASE
const dbVars = Object.keys(process.env).filter(key => key.includes('DATABASE'));
console.log(`🔧 Database-related env vars: ${dbVars.join(', ')}`);

if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL not found in environment variables!');
  console.log('Available environment variables:');
  Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('DB')).forEach(key => {
    console.log(`  ${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
  });
  console.log('\nPlease check your .env file and make sure:');
  console.log('1. The file is named exactly ".env" (with a dot at the beginning)');
  console.log('2. The DATABASE_URL line has no spaces around the = sign');
  console.log('3. The value is properly quoted');
  console.log('\nExample:');
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

  console.log('🔄 Creating admin user...');
  try {
    execSync('npm run db:create-admin', { stdio: 'inherit' });
    console.log('✅ Admin user created successfully\n');
  } catch (error) {
    console.log('⚠️  Admin user creation failed (this is optional)\n');
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
