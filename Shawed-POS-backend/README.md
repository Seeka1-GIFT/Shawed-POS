# Shawed-POS Backend API

A robust TypeScript/Express.js backend API for the Shawed-POS (Point of Sale) system with PostgreSQL database integration using Prisma ORM.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role management
- **Product Management**: Full CRUD operations with stock tracking
- **Customer Management**: Customer profiles with credit tracking
- **Sales Processing**: Complete sales workflow with transaction management
- **Expense Tracking**: Business expense management
- **Supplier Management**: Supplier profiles and purchase order management
- **Comprehensive Reports**: Sales, inventory, expenses, and profit/loss reports
- **Database Integration**: PostgreSQL with Prisma ORM
- **Type Safety**: Full TypeScript implementation

## 📋 Prerequisites

- Node.js >= 16.0.0
- PostgreSQL database
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shawed-pos-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your database credentials:
   ```
   DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/Shawed-POS"
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Database Setup**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📜 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## 🗃️ Database Schema

The system includes the following main entities:

- **Users**: Authentication and user management
- **Products**: Inventory management with barcode support
- **Customers**: Customer profiles with credit tracking
- **Sales**: Transaction records with items and payments
- **Expenses**: Business expense tracking
- **Suppliers**: Supplier management with purchase orders
- **Reports**: Comprehensive business analytics

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Products
- `GET /api/products` - List products with filtering
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `PUT /api/products/:id/stock` - Update stock
- `DELETE /apiProducts/:id` - Delete product
- `GET /api/products/low-stock` - Get low stock products

### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `PUT /api/customers/:id/balance` - Update balance
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/:id/sales` - Get customer sales

### Sales
- `GET /api/sales` - List sales with filtering
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales` - Create new sale
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale
- `GET /api/sales/report` - Generate sales report

### Expenses
- `GET /api/expenses` - List expenses
- `GET /api/expenses/:id` - Get expense details
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/report` - Generate expense report

### Suppliers
- `GET /api/suppliers` - List suppliers
- `GET /api/suppliers/:id` - Get supplier details
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier
- `GET /api/suppliers/:id/products` - Get supplier products
- `GET /api/suppliers/:id/purchase-orders` - Get supplier purchase orders

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/sales` - Sales analytics
- `GET /api/reports/inventory` - Inventory analysis
- `GET /api/reports/expenses` - Expense analytics
- `GET /api/reports/profit-loss` - Profit/Loss report

## 🔧 Middleware

- **Authentication**: JWT token validation
- **Authorization**: Role-based access control
- **CORS**: Cross-origin resource sharing
- **Error Handling**: Comprehensive error management
- **Request Logging**: Morgan HTTP request logger
- **Security**: Helmet security headers

## 🚀 Deployment

### Using Docker
```bash
# Build image
docker build -t shawed-pos-backend .

# Run container
docker run -p 5000:5000 --env-file .env shawed-pos-backend
```

### Using Render
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use the provided `render.yaml` configuration
4. Deploy automatically

### Environment Variables for Production
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (production)
- `JWT_SECRET`: Strong JWT secret key
- `JWT_EXPIRES_IN`: Token expiration (default: 7d)
- `CORS_ORIGIN`: Frontend URL

## 📊 Database Migration

When updating the schema:

```bash
# Create migration
npx prisma migrate dev --name your-migration-name

# Push changes (development)
npx prisma db push

# Deploy migrations (production)
npx prisma migrate deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review API documentation in the `/docs` folder

## 🔄 Version History

- **v1.0.0**: Initial release with full POS functionality



