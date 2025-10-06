const fetch = require('node-fetch');

async function testAPI() {
  const baseURL = 'https://shawed-pos.onrender.com/api';
  
  try {
    console.log('🔄 Testing API endpoints...');
    
    console.log('🔄 Testing /api/status...');
    const statusResponse = await fetch(`${baseURL}/status`);
    console.log(`Status: ${statusResponse.status}`);
    const statusData = await statusResponse.json();
    console.log('Status response:', statusData);
    
    console.log('\n🔄 Testing /api/sales...');
    const salesResponse = await fetch(`${baseURL}/sales`);
    console.log(`Sales Status: ${salesResponse.status}`);
    if (!salesResponse.ok) {
      const errorText = await salesResponse.text();
      console.log('Sales Error:', errorText);
    } else {
      const salesData = await salesResponse.json();
      console.log('Sales response:', JSON.stringify(salesData, null, 2));
    }
    
    console.log('\n🔄 Testing /api/expenses...');
    const expensesResponse = await fetch(`${baseURL}/expenses`);
    console.log(`Expenses Status: ${expensesResponse.status}`);
    if (!expensesResponse.ok) {
      const errorText = await expensesResponse.text();
      console.log('Expenses Error:', errorText);
    } else {
      const expensesData = await expensesResponse.json();
      console.log('Expenses response:', JSON.stringify(expensesData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

testAPI();
