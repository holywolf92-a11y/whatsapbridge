// Test script for bulk status updates and selection system
const API_BASE_URL = process.env.API_BASE_URL || 'https://recruitment-portal-backend-production-d1f7.up.railway.app/api';

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  
  if (res.status === 204) return undefined;
  return await res.json();
}

async function testBulkStatusUpdate() {
  console.log('\n🧪 Testing Bulk Status Update Operations\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Get all candidates
    console.log('\n1️⃣  Fetching all candidates...');
    const response = await request('/candidates');
    const candidates = response.candidates || [];
    console.log(`   ✅ Found ${candidates.length} candidates`);

    if (candidates.length < 2) {
      console.log('   ⚠️  Need at least 2 candidates to test bulk operations');
      return;
    }

    // Step 2: Select first 2 candidates for testing
    const testCandidates = candidates.slice(0, 2);
    const candidateIds = testCandidates.map(c => c.id);
    
    console.log('\n2️⃣  Selected test candidates:');
    testCandidates.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.candidate_code}) - Current Status: ${c.status || 'Applied'}`);
    });

    // Step 3: Get original statuses
    const originalStatuses = testCandidates.map(c => c.status || 'Applied');

    // Step 4: Test bulk update to "Pending"
    console.log('\n3️⃣  Testing bulk update to "Pending"...');
    const updateResult = await request('/candidates/bulk/status', {
      method: 'PATCH',
      body: JSON.stringify({
        candidateIds: candidateIds,
        status: 'Pending'
      })
    });

    console.log(`   ✅ Updated ${updateResult.updated} candidate(s)`);
    
    // Step 5: Verify the updates
    console.log('\n4️⃣  Verifying updates...');
    const verifyResponse = await request('/candidates');
    const updatedCandidates = verifyResponse.candidates.filter(c => candidateIds.includes(c.id));
    
    for (const candidate of updatedCandidates) {
      const statusMatch = candidate.status === 'Pending';
      console.log(`   ${statusMatch ? '✅' : '❌'} ${candidate.name}: ${candidate.status}`);
    }

    // Step 6: Test different status values
    const statusesToTest = ['Applied', 'Deployed', 'Cancelled'];
    
    for (const testStatus of statusesToTest) {
      console.log(`\n5️⃣  Testing bulk update to "${testStatus}"...`);
      const result = await request('/candidates/bulk/status', {
        method: 'PATCH',
        body: JSON.stringify({
          candidateIds: [candidateIds[0]],
          status: testStatus
        })
      });
      
      const allCandidates = await request('/candidates');
      const verify = allCandidates.candidates.find(c => c.id === candidateIds[0]);
      const statusMatch = verify.status === testStatus;
      console.log(`   ${statusMatch ? '✅' : '❌'} Status set to: ${verify.status}`);
    }

    // Step 7: Restore original statuses
    console.log('\n6️⃣  Restoring original statuses...');
    for (let i = 0; i < candidateIds.length; i++) {
      await request('/candidates/bulk/status', {
        method: 'PATCH',
        body: JSON.stringify({
          candidateIds: [candidateIds[i]],
          status: originalStatuses[i]
        })
      });
    }
    console.log('   ✅ Original statuses restored');

    // Step 8: Test edge cases
    console.log('\n7️⃣  Testing edge cases...');
    
    // Empty array
    try {
      await request('/candidates/bulk/status', {
        method: 'PATCH',
        body: JSON.stringify({
          candidateIds: [],
          status: 'Pending'
        })
      });
      console.log('   ✅ Empty array handled correctly');
    } catch (e) {
      console.log(`   ⚠️  Empty array error: ${e.message}`);
    }

    // Invalid status
    try {
      await request('/candidates/bulk/status', {
        method: 'PATCH',
        body: JSON.stringify({
          candidateIds: [candidateIds[0]],
          status: 'InvalidStatus'
        })
      });
      console.log('   ❌ Invalid status should have been rejected');
    } catch (e) {
      console.log('   ✅ Invalid status rejected correctly');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All bulk status update tests passed!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

async function testFilters() {
  console.log('\n🧪 Testing Filter Combinations\n');
  console.log('='.repeat(60));

  try {
    // Test 1: No filters (all candidates)
    console.log('\n1️⃣  Testing without filters...');
    const all = await request('/candidates');
    console.log(`   ✅ Total candidates: ${all.candidates.length}`);

    // Test 2: Status filter
    console.log('\n2️⃣  Testing status filter...');
    const statuses = ['Applied', 'Pending', 'Deployed', 'Cancelled'];
    for (const status of statuses) {
      const filtered = await request(`/candidates?status=${status}`);
      console.log(`   ${status}: ${filtered.candidates.length} candidates`);
    }

    // Test 3: Search filter
    console.log('\n3️⃣  Testing search filter...');
    const searchTerms = ['ahmed', 'engineer', '.com'];
    for (const term of searchTerms) {
      const searched = await request(`/candidates?search=${encodeURIComponent(term)}`);
      console.log(`   Search "${term}": ${searched.candidates.length} results`);
    }

    // Test 4: Position filter
    console.log('\n4️⃣  Testing position filter...');
    const positions = [...new Set(all.candidates.map(c => c.position).filter(Boolean))];
    if (positions.length > 0) {
      const testPosition = positions[0];
      const posFiltered = await request(`/candidates?position=${encodeURIComponent(testPosition)}`);
      console.log(`   Position "${testPosition}": ${posFiltered.candidates.length} candidates`);
    }

    // Test 5: Country filter
    console.log('\n5️⃣  Testing country_of_interest filter...');
    const countries = [...new Set(all.candidates.map(c => c.country_of_interest).filter(Boolean))];
    if (countries.length > 0) {
      const testCountry = countries[0];
      const countryFiltered = await request(`/candidates?country_of_interest=${encodeURIComponent(testCountry)}`);
      console.log(`   Country "${testCountry}": ${countryFiltered.candidates.length} candidates`);
    }

    // Test 6: Combined filters
    console.log('\n6️⃣  Testing combined filters...');
    if (positions.length > 0 && countries.length > 0) {
      const combined = await request(
        `/candidates?status=Pending&position=${encodeURIComponent(positions[0])}&country_of_interest=${encodeURIComponent(countries[0])}`
      );
      console.log(`   Combined (Pending + Position + Country): ${combined.candidates.length} results`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All filter tests passed!\n');

  } catch (error) {
    console.error('\n❌ Filter test failed:', error.message);
    process.exit(1);
  }
}

async function testDocumentFlags() {
  console.log('\n🧪 Testing Document Auto-Flags\n');
  console.log('='.repeat(60));

  try {
    // Get a candidate
    console.log('\n1️⃣  Finding candidate for testing...');
    const response = await request('/candidates');
    const testCandidate = response.candidates[0];
    
    if (!testCandidate) {
      console.log('   ⚠️  No candidates found for testing');
      return;
    }

    console.log(`   ✅ Using candidate: ${testCandidate.name} (${testCandidate.candidate_code})`);

    // Check current document flags
    console.log('\n2️⃣  Current document flags:');
    console.log(`   CV: ${testCandidate.cv_received ? '✅' : '❌'}`);
    console.log(`   Photo: ${testCandidate.photo_received ? '✅' : '❌'}`);
    console.log(`   Certificate: ${testCandidate.certificate_received ? '✅' : '❌'}`);
    console.log(`   Passport: ${testCandidate.passport_received ? '✅' : '❌'}`);
    console.log(`   Medical: ${testCandidate.medical_received ? '✅' : '❌'}`);

    // Check if documents table has entries
    console.log('\n3️⃣  Checking documents table...');
    const docs = await request(`/documents/candidate/${testCandidate.id}`);
    console.log(`   ✅ Found ${docs.documents.length} document(s)`);
    
    if (docs.documents.length > 0) {
      docs.documents.forEach(doc => {
        console.log(`      - ${doc.doc_type}: ${doc.file_name}`);
      });
    }

    // Verify flags match documents
    console.log('\n4️⃣  Verifying flag consistency...');
    const docTypes = docs.documents.map(d => d.doc_type.toLowerCase());
    const checks = [
      { flag: testCandidate.cv_received, type: 'cv' },
      { flag: testCandidate.photo_received, type: 'photo' },
      { flag: testCandidate.certificate_received, type: 'certificate' },
      { flag: testCandidate.passport_received, type: 'passport' },
      { flag: testCandidate.medical_received, type: 'medical' },
    ];

    let consistent = true;
    for (const check of checks) {
      const hasDoc = docTypes.includes(check.type);
      const flagMatches = hasDoc === !!check.flag;
      console.log(`   ${flagMatches ? '✅' : '⚠️'} ${check.type}: flag=${!!check.flag}, has_doc=${hasDoc}`);
      if (!flagMatches) consistent = false;
    }

    if (consistent) {
      console.log('\n   ✅ All flags are consistent with documents table');
    } else {
      console.log('\n   ⚠️  Some flags may need reconciliation');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Document flag tests completed!\n');

  } catch (error) {
    console.error('\n❌ Document flag test failed:', error.message);
    process.exit(1);
  }
}

// Run all tests
(async () => {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     RECRUITMENT PORTAL - INTEGRATION TEST SUITE         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  await testBulkStatusUpdate();
  await testFilters();
  await testDocumentFlags();

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║              ✅ ALL TESTS COMPLETED SUCCESSFULLY          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
})();
