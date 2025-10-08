// Using built-in fetch in Node.js 18+

async function testExpenseAPI() {
  const API_BASE_URL = 'https://shawed-pos.onrender.com/api';
  
  try {
    console.log('🔍 Testing expense API endpoint...');
    
    // Test data matching what frontend sends
    const testData = {
      description: 'Kiro',
      amount: 10,
      category: 'Other',
      date: '2025-10-08'
    };
    
    console.log('📤 Sending request with data:', testData);
    
    const response = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📥 Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ API request successful!');
    } else {
      console.log('❌ API request failed!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testExpenseAPI();
