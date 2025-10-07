const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSupplierCreation() {
  try {
    console.log('🧪 Testing supplier creation...');
    
    // Test data matching the frontend request
    const supplierData = {
      name: "ABDINASIR ABDULLAHI",
      phone: "616520449",
      email: "cabdirxmn1100@gmail.com",
      address: "KM4,MOGADISHU,SOMALIA"
    };
    
    console.log('📝 Creating supplier with data:', supplierData);
    
    const supplier = await prisma.supplier.create({
      data: {
        name: supplierData.name,
        phone: supplierData.phone,
        address: supplierData.address,
        email: supplierData.email.toLowerCase()
      }
    });
    
    console.log('✅ Supplier created successfully:', supplier);
    
    // Clean up - delete the test supplier
    await prisma.supplier.delete({
      where: { id: supplier.id }
    });
    
    console.log('🗑️ Test supplier deleted');
    
  } catch (error) {
    console.error('❌ Error creating supplier:', error);
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

testSupplierCreation();
