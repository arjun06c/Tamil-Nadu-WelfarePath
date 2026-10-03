"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DigiLockerMockProvider_1 = require("../DigiLockerMockProvider");
async function runMockProviderTest() {
    console.log('🧪 Starting Phase 3 DigiLockerMockProvider Unit & Integration Test...\n');
    const provider = new DigiLockerMockProvider_1.DigiLockerMockProvider();
    // Test 1: Mode Check
    const mode = provider.getMode();
    console.log(`[Test 1] Provider Mode: ${mode}`);
    if (mode !== 'mock')
        throw new Error('Expected mode to be "mock"');
    // Test 2: Authorization URL Generation
    const authUrl = await provider.getAuthorizationUrl('test_state_abc', ['doc_type', 'income_cert']);
    console.log(`[Test 2] Auth URL Generated: ${authUrl}`);
    if (!authUrl.includes('mock_auth=true') || !authUrl.includes('test_state_abc')) {
        throw new Error('Authorization URL failed state check');
    }
    // Test 3: OAuth Callback Handler
    const authResult = await provider.handleCallback('mock_code_123', 'test_state_abc');
    console.log(`[Test 3] OAuth Callback Result Success: ${authResult.success}`);
    if (!authResult.success || !authResult.user || !authResult.user.id) {
        throw new Error('Mock callback handler failed');
    }
    // Test 4: User Details
    const user = await provider.getUserDetails(authResult.user.id);
    console.log(`[Test 4] User Fetched: ${user.name} (${user.maskedAadhaar})`);
    if (!user.name)
        throw new Error('User details missing name');
    // Test 5: Issued Documents List
    const docs = await provider.getIssuedDocuments(user.id);
    console.log(`[Test 5] Total Issued Documents Returned: ${docs.length}`);
    if (docs.length === 0)
        throw new Error('No mock documents returned');
    const incomeDoc = docs.find((d) => d.docType === 'IncomeCertificate');
    console.log(`[Test 5.1] Found Document: ${incomeDoc?.name.en} | Issuer: ${incomeDoc?.issuer}`);
    if (!incomeDoc)
        throw new Error('Missing IncomeCertificate in mock list');
    // Test 6: Document Fetching
    const docContent = await provider.getDocument(user.id, incomeDoc.uri);
    console.log(`[Test 6] Document Content Retrieved URI: ${docContent.uri}`);
    if (!docContent.contentUrl && !docContent.base64Data) {
        throw new Error('Document content missing payload');
    }
    // Test 7: Health Check Status & Badge Label
    const health = await provider.getHealthStatus();
    console.log(`[Test 7] Health Status: ${health.status} | Badge: "${health.badgeLabel}"`);
    if (health.badgeLabel !== 'Demo Document Source') {
        throw new Error('Health check badge label must be "Demo Document Source" in mock mode');
    }
    // Test 8: Revoke Access
    const revoked = await provider.revokeAccess(user.id);
    console.log(`[Test 8] Access Revocation Result: ${revoked}`);
    console.log('\n✅ ALL PHASE 3 MOCK PROVIDER TESTS PASSED SUCCESSFULLY!');
}
runMockProviderTest().catch((err) => {
    console.error('❌ Test Failed:', err);
    process.exit(1);
});
