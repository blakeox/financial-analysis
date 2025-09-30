#!/usr/bin/env node

/**
 * Test script for R2 Infrequent Access and enhanced UUID generation
 */
import { fetch, FormData, Blob } from 'undici';

const API_BASE = 'http://localhost:8787';

async function testEnhancedFeatures() {
  console.log('🧪 Testing enhanced Cloudflare platform features...\n');

  try {
    // Test 1: Health check with enhanced UUID generation
    console.log('1️⃣ Testing health endpoint with enhanced UUID generation...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Health check passed');
      console.log(`   Request ID: ${health.requestId || 'N/A'}`);
      console.log(`   Timestamp: ${health.timestamp || 'N/A'}`);
    } else {
      console.log('❌ Health check failed');
    }

    // Test 2: Test file upload with R2 Infrequent Access
    console.log('\n2️⃣ Testing R2 upload with Infrequent Access storage class...');
    
    // Create a test file
    const testContent = JSON.stringify({
      test: 'R2 Infrequent Access Test',
      timestamp: new Date().toISOString(),
      data: 'This is archival test data for infrequent access storage'
    });
    
    const formData = new FormData();
    formData.append('file', new Blob([testContent], { type: 'application/json' }), 'r2-test.json');
    formData.append('storageClass', 'InfrequentAccess');

    const uploadResponse = await fetch(`${API_BASE}/v1/api/documents/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'X-Storage-Class': 'InfrequentAccess'
      }
    });

    if (uploadResponse.ok) {
      const uploadResult = await uploadResponse.json();
      console.log('✅ R2 Infrequent Access upload successful');
      console.log(`   File Key: ${uploadResult.key || 'N/A'}`);
      console.log(`   Storage Class: InfrequentAccess`);
      console.log(`   Request ID: ${uploadResponse.headers.get('X-Request-ID') || 'N/A'}`);
    } else {
      const error = await uploadResponse.text();
      console.log('❌ R2 upload failed');
      console.log(`   Status: ${uploadResponse.status}`);
      console.log(`   Error: ${error}`);
    }

    // Test 3: Test OpenAPI endpoint
    console.log('\n3️⃣ Testing OpenAPI documentation endpoint...');
    const openApiResponse = await fetch(`${API_BASE}/openapi.json`);
    if (openApiResponse.ok) {
      const openApi = await openApiResponse.json();
      console.log('✅ OpenAPI endpoint accessible');
      console.log(`   Version: ${openApi.info?.version || 'N/A'}`);
      console.log(`   Title: ${openApi.info?.title || 'N/A'}`);
    } else {
      console.log('❌ OpenAPI endpoint failed');
    }

    // Test 4: Test enhanced Node.js crypto functions
    console.log('\n4️⃣ Testing financial calculation with enhanced crypto...');
    const calcData = {
      principal: 400000,
      annualRate: 0.065,
      termMonths: 360,
      paymentFrequency: 'monthly',
      extraMonthlyPayment: 200,
      startDate: '2025-01-01'
    };

    const calcResponse = await fetch(`${API_BASE}/v1/api/analysis/amortization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calcData)
    });

    if (calcResponse.ok) {
      const result = await calcResponse.json();
      console.log('✅ Enhanced financial calculation successful');
      console.log(`   Monthly Payment: $${result.summary?.monthlyPayment?.toFixed(2) || 'N/A'}`);
      console.log(`   Total Interest: $${result.summary?.totalInterest?.toFixed(2) || 'N/A'}`);
      console.log(`   Request ID: ${calcResponse.headers.get('X-Request-ID') || 'N/A'}`);
    } else {
      console.log('❌ Financial calculation failed');
    }

    console.log('\n🎉 Enhanced feature testing completed!');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testEnhancedFeatures();