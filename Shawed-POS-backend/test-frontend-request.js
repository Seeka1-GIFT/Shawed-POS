// Test the exact request the frontend would send
async function testFrontendRequest() {
  const API_BASE_URL = 'https://shawed-pos.onrender.com/api';
  
  try {
    console.log('🔍 Testing frontend-style request...');
    
    // Simulate the exact request the frontend sends
    const testData = {
      description: 'Kiro',
      amount: 10,
      category: 'Other',
      date: '2025-10-08'
    };
    
    console.log('📤 Sending frontend-style request with data:', testData);
    
    const response = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Frontend might send these headers
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://shawed-pos-git-main-shaweds-projects.vercel.app',
        'Referer': 'https://shawed-pos-git-main-shaweds-projects.vercel.app/expenses'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📥 Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Frontend-style request successful!');
    } else {
      console.log('❌ Frontend-style request failed!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFrontendRequest();
