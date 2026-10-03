import { env } from '../../config/env';
import { DigiLockerProviderFactory } from '../../services/digilocker/DigiLockerProviderFactory';
import { DigiLockerMockProvider } from '../../services/digilocker/DigiLockerMockProvider';
import { DigiLockerSandboxProvider } from '../../services/digilocker/DigiLockerSandboxProvider';
import { DigiLockerProductionProvider } from '../../services/digilocker/DigiLockerProductionProvider';
import { DigiLockerSecurityService } from '../../services/digilocker/DigiLockerSecurityService';

async function runProductionSandboxTests() {
  console.log('🔄 Starting DigiLocker Production & Sandbox Provider Integration Test Suite...\n');

  // Test 1: Mock Mode Factory Check
  console.log('[Test 1] Testing DigiLockerProviderFactory in mock mode...');
  const mockProvider = DigiLockerProviderFactory.getProvider('mock');
  console.log(`[Test 1.1] Mode: ${mockProvider.getMode()}`);
  if (mockProvider.getMode() !== 'mock') {
    throw new Error('Test 1 failed: Expected mock mode provider');
  }
  const healthMock = await mockProvider.getHealthStatus();
  console.log(`[Test 1.2] Badge Label: "${healthMock.badgeLabel}"`);
  if (healthMock.badgeLabel !== 'Demo Document Source') {
    throw new Error('Test 1 failed: Expected "Demo Document Source" badge label in mock mode');
  }
  console.log('✅ Test 1 Passed.\n');

  // Test 2: Configuration Safety Check - Missing Credentials in Production Mode MUST Fail (No silent fallback)
  console.log('[Test 2] Testing Configuration Health Check for Production mode without credentials...');
  const originalClientId = env.DIGILOCKER_CLIENT_ID;
  const originalClientSecret = env.DIGILOCKER_CLIENT_SECRET;

  env.DIGILOCKER_CLIENT_ID = '';
  env.DIGILOCKER_CLIENT_SECRET = '';

  let errorThrown = false;
  try {
    DigiLockerProviderFactory.getProvider('production');
  } catch (err: any) {
    errorThrown = true;
    console.log(`[Test 2 Outcome] Caught Expected Error: "${err.message}"`);
    if (!err.message.includes('DIGILOCKER_CLIENT_ID') && !err.message.includes('production')) {
      throw new Error('Test 2 failed: Unexpected error message format');
    }
  }

  if (!errorThrown) {
    throw new Error('Test 2 failed: Production mode without credentials did NOT throw an error (Silent fallback occurred!)');
  }
  console.log('✅ Test 2 Passed (No silent fallback from production to mock).\n');

  // Test 3: Configuration Safety Check - Missing Credentials in Sandbox Mode MUST Fail
  console.log('[Test 3] Testing Configuration Health Check for Sandbox mode without credentials...');
  let sandboxErrorThrown = false;
  try {
    DigiLockerProviderFactory.getProvider('sandbox');
  } catch (err: any) {
    sandboxErrorThrown = true;
    console.log(`[Test 3 Outcome] Caught Expected Error: "${err.message}"`);
  }

  if (!sandboxErrorThrown) {
    throw new Error('Test 3 failed: Sandbox mode without credentials did NOT throw an error');
  }
  console.log('✅ Test 3 Passed.\n');

  // Test 4: OAuth URL Generation in Sandbox Mode (with configured test credentials)
  console.log('[Test 4] Testing Sandbox Provider OAuth URL Generation...');
  env.DIGILOCKER_CLIENT_ID = 'test_sandbox_client_123';
  env.DIGILOCKER_CLIENT_SECRET = 'test_sandbox_secret_abc';

  const sandboxProvider = DigiLockerProviderFactory.getProvider('sandbox');
  const testState = DigiLockerSecurityService.generateSecureState('user_test_99');
  const sandboxAuthUrl = await sandboxProvider.getAuthorizationUrl(testState, ['doc_type']);
  console.log(`[Test 4 Outcome] Sandbox Auth URL: "${sandboxAuthUrl}"`);

  if (!sandboxAuthUrl.includes('sandbox.digitallocker.gov.in') || !sandboxAuthUrl.includes('client_id=test_sandbox_client_123')) {
    throw new Error('Test 4 failed: Sandbox OAuth URL structure is invalid');
  }
  const sandboxHealth = await sandboxProvider.getHealthStatus();
  if (sandboxHealth.badgeLabel !== 'DigiLocker Sandbox') {
    throw new Error('Test 4 failed: Expected "DigiLocker Sandbox" badge label');
  }
  console.log('✅ Test 4 Passed.\n');

  // Test 5: OAuth URL Generation in Production Mode (with configured test credentials)
  console.log('[Test 5] Testing Production Provider OAuth URL Generation...');
  const productionProvider = DigiLockerProviderFactory.getProvider('production');
  const prodAuthUrl = await productionProvider.getAuthorizationUrl(testState, ['doc_type']);
  console.log(`[Test 5 Outcome] Production Auth URL: "${prodAuthUrl}"`);

  if (!prodAuthUrl.includes('api.digitallocker.gov.in') || !prodAuthUrl.includes('client_id=test_sandbox_client_123')) {
    throw new Error('Test 5 failed: Production OAuth URL structure is invalid');
  }
  const prodHealth = await productionProvider.getHealthStatus();
  if (prodHealth.badgeLabel !== 'DigiLocker') {
    throw new Error('Test 5 failed: Expected "DigiLocker" badge label in production mode');
  }
  console.log('✅ Test 5 Passed.\n');

  // Test 6: Sensitive Security Redaction
  console.log('[Test 6] Testing Security Service Sensitive Data Redaction...');
  const sensitiveObj = {
    client_secret: 'super_secret_key',
    access_token: 'bearer_token_xyz',
    user_aadhaar: '9876-5432-1098',
    message: 'Authorized successfully'
  };
  const sanitized = DigiLockerSecurityService.sanitizeLogData(sensitiveObj);
  console.log(`[Test 6 Outcome] Sanitized data:`, JSON.stringify(sanitized));

  if (sanitized.client_secret !== '[REDACTED]' || sanitized.access_token !== '[REDACTED]') {
    throw new Error('Test 6 failed: Sensitive keys were not redacted');
  }
  console.log('✅ Test 6 Passed.\n');

  // Restore original env
  env.DIGILOCKER_CLIENT_ID = originalClientId;
  env.DIGILOCKER_CLIENT_SECRET = originalClientSecret;

  console.log('🎉 ALL DIGILOCKER PRODUCTION & SANDBOX PROVIDER TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runProductionSandboxTests().catch((err) => {
  console.error('❌ Test Suite Failed:', err);
  process.exit(1);
});
