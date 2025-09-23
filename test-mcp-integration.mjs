#!/usr/bin/env node

// Simple test script to verify EBITDA MCP tools integration
const API_BASE = 'http://localhost:8787';

async function testMCPTools() {
  console.log('🧪 Testing MCP Tools Integration...\n');

  // Test 1: List available tools
  console.log('1️⃣ Testing tools/list...');
  try {
    const response = await fetch(`${API_BASE}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      })
    });
    
    const result = await response.json();
    console.log('✅ Available tools:', result.result?.tools?.map(t => t.name) || []);
    
    // Check if EBITDA tools are present
    const ebitdaTools = result.result?.tools?.filter(t => 
      t.name.includes('ebitda') || t.name.includes('EBITDA')
    ) || [];
    
    if (ebitdaTools.length > 0) {
      console.log('🎉 EBITDA tools found:', ebitdaTools.map(t => t.name));
    } else {
      console.log('❌ No EBITDA tools found');
    }
  } catch (error) {
    console.error('❌ Tools list failed:', error.message);
  }

  console.log('\n2️⃣ Testing chat endpoint with tool call...');
  
  // Test 2: Chat endpoint with tool call
  try {
    const response = await fetch(`${API_BASE}/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Generate an EBITDA forecast' }
        ],
        tool_call: {
          name: 'ebitda-forecasting',
          arguments: {
            currentFinancials: {
              revenue: 100000,
              expenses: 60000,
              ebitda: 40000
            },
            forecastMonths: 12,
            employees: [],
            expenseTypes: [],
            assumptions: {
              revenueGrowthRate: 0.1,
              marketSeasonality: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
            }
          }
        }
      })
    });

    const result = await response.json();
    
    if (result.content) {
      console.log('✅ Chat with tool call successful!');
      console.log('📊 Response preview:', result.content.substring(0, 200) + '...');
    } else {
      console.log('❌ Chat tool call failed:', result);
    }
  } catch (error) {
    console.error('❌ Chat tool call failed:', error.message);
  }

  console.log('\n3️⃣ Testing basic chat endpoint...');
  
  // Test 3: Basic chat without tools
  try {
    const response = await fetch(`${API_BASE}/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello, can you help with financial analysis?' }
        ]
      })
    });

    const result = await response.json();
    
    if (result.content) {
      console.log('✅ Basic chat successful!');
      console.log('💬 Response:', result.content);
    } else {
      console.log('❌ Basic chat failed:', result);
    }
  } catch (error) {
    console.error('❌ Basic chat failed:', error.message);
  }

  console.log('\n🏁 Testing complete!');
}

// Run the tests
testMCPTools().catch(console.error);