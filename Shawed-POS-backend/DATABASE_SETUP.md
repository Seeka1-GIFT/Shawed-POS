# Database Setup Guide for Shawed-POS

This guide will help you set up your Neon database with all the required tables.

## Prerequisites

1. ✅ Neon database created (you already have this)
2. ✅ Database connection string from Neon console
3. ✅ Node.js and npm installed

## Step 1: Get Your Database Connection String

1. Go to your Neon console: https://console.neon.tech
2. Select your `shawed-pos-db` project
3. Go to the "Connection Details" section
4. Copy the connection string (it looks like: `postgresql://username:password@host:port/database?sslmode=require`)

## Step 2: Create Environment File

1. In the `Shawed-POS-backend` folder, create a `.env` file
2. Add your database connection string:

```env
DATABASE_URL="your_neon_connection_string_here"
NODE_ENV=production
PORT=5000
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=https://shawed-pos.vercel.app
```

## Step 3: Run Database Setup

Open terminal in the `Shawed-POS-backend` folder and run:

```bash
# Install dependencies (if not already done)
npm install

# Run the database setup script
node setup-database.js
```

This will:
- ✅ Generate Prisma client
- ✅ Create all database tables
- ✅ Seed with sample data
- ✅ Verify everything is working

## Step 4: Verify Tables Created

1. Go back to your Neon console
2. Navigate to "Tables" section
3. You should now see these tables:
   - `users`
   - `suppliers`
   - `products`
   - `customers`
   - `sales`
   - `sale_items`
   - `expenses`
   - `purchase_orders`

## Step 5: Test the Setup

You can test if everything is working by:

1. Running the backend locally:
```bash
npm run dev
```

2. Or checking the health endpoint:
```bash
curl http://localhost:5000/health
```

## Troubleshooting

### If you get connection errors:
- ✅ Check your DATABASE_URL is correct
- ✅ Make sure your Neon database is running
- ✅ Verify the connection string format

### If tables aren't created:
- ✅ Check the console output for error messages
- ✅ Make sure you have proper permissions on your Neon database
- ✅ Try running `npx prisma db push` manually

### If seeding fails:
- ✅ This is optional - your app will still work
- ✅ You can manually add data through the application

## Sample Data Included

The seeder creates:
- 👤 Admin user: `admin@shawedpos.com` / `password123`
- 🏪 2 sample suppliers
- 📦 3 sample products
- 👥 2 sample customers
- 💰 1 sample sale
- 📊 2 sample expenses

## Next Steps

After successful setup:
1. ✅ Deploy your backend to Render
2. ✅ Update your frontend API URL if needed
3. ✅ Test the full application

## Need Help?

If you encounter any issues:
1. Check the console output for specific error messages
2. Verify your Neon database is accessible
3. Make sure all environment variables are set correctly
