import { connectDB } from '../../config/db';
import { User, UserRole } from '../../models/User';
import { Application, ApplicationStatus } from '../../models/Application';
import { Scheme } from '../../models/Scheme';
import { DigiLockerSecurityService } from '../../services/digilocker/DigiLockerSecurityService';
import {
  startConnection,
  handleOAuthCallback,
  getAvailableDocuments,
  getDocumentById,
  attachDigiLockerDocumentToApplication,
  disconnectConnection
} from '../digilockerController';
import { digilockerConnectLimiter } from '../../middleware/rateLimiter';

const createMockRes = () => {
  const res: any = {};
  res.headers = {};
  res.statusCode = 200;
  res.data = null;
  res.setHeader = (key: string, val: any) => {
    res.headers[key] = val;
  };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload: any) => {
    res.data = payload;
    return res;
  };
  return res;
};

async function runPhase5SecurityTests() {
  console.log('🛡️ Starting Phase 5 Security, Auditing & Rate Limiting Test Suite...\n');

  await connectDB();

  // Test 1: Encryption & Decryption at Rest
  console.log('[Test 1] Testing AES-256-GCM Token Encryption & Decryption at Rest...');
  const sensitiveToken = 'oauth_access_token_super_secret_99887766';
  const encrypted = DigiLockerSecurityService.encrypt(sensitiveToken);
  const decrypted = DigiLockerSecurityService.decrypt(encrypted);
  console.log(`[Test 1] Token Encrypted: ${encrypted.substring(0, 30)}... | Decrypted Match: ${decrypted === sensitiveToken}`);
  if (decrypted !== sensitiveToken) throw new Error('AES-256-GCM token encryption test failed');

  // Test 2: Log Data Redaction & Sanitization
  console.log('[Test 2] Testing Sensitive Log Payload Redaction...');
  const rawLogObj = {
    client_secret: 'secret_key_123',
    access_token: 'tok_abc123',
    aadhaar: '9876-5432-1098',
    message: 'User connect successful'
  };
  const sanitized = DigiLockerSecurityService.sanitizeLogData(rawLogObj);
  console.log(`[Test 2] Sanitized Log Payload:`, sanitized);
  if (sanitized.client_secret !== '[REDACTED]' || sanitized.access_token !== '[REDACTED]') {
    throw new Error('Log sanitization failed to redact tokens/secrets');
  }

  // Create Users: Citizen A, Citizen B, Admin User
  const citizenA = await User.create({
    name: 'Security Citizen A',
    email: `sec_a_${Date.now()}@tn.gov.in`,
    mobile: '9876543210',
    passwordHash: 'hashed_password',
    role: UserRole.CITIZEN,
    district: 'Chennai'
  });

  const citizenB = await User.create({
    name: 'Security Citizen B',
    email: `sec_b_${Date.now()}@tn.gov.in`,
    mobile: '9876543211',
    passwordHash: 'hashed_password',
    role: UserRole.CITIZEN,
    district: 'Madurai'
  });

  const adminUser = await User.create({
    name: 'System Admin',
    email: `admin_${Date.now()}@tn.gov.in`,
    mobile: '9876543299',
    passwordHash: 'hashed_password',
    role: UserRole.ADMIN,
    district: 'Chennai'
  });

  // Test 3: OAuth HMAC State Generation & Validation
  console.log('[Test 3] Testing Cryptographic HMAC State Generation & Validation...');
  const validState = DigiLockerSecurityService.generateSecureState(citizenA._id.toString());
  const stateCheck = DigiLockerSecurityService.validateAndConsumeState(validState);
  console.log(`[Test 3] State Validation Result: valid=${stateCheck.valid}, userId=${stateCheck.userId}`);
  if (!stateCheck.valid || stateCheck.userId !== citizenA._id.toString()) {
    throw new Error('HMAC state generation & validation failed');
  }

  // Test 4: OAuth Replay Attack Prevention (Re-using consumed state)
  console.log('[Test 4] Testing Replay Attack Prevention on Reused State...');
  const replayCheck = DigiLockerSecurityService.validateAndConsumeState(validState);
  console.log(`[Test 4] Replay Attempt Result: valid=${replayCheck.valid} (${replayCheck.error})`);
  if (replayCheck.valid !== false) {
    throw new Error('SECURITY VULNERABILITY: Reused state token was accepted!');
  }

  // Test 5: OAuth Tampered State Prevention
  console.log('[Test 5] Testing Tampered OAuth State Rejection...');
  const tamperedState = validState.slice(0, -5) + 'XXXXX';
  const tamperedCheck = DigiLockerSecurityService.validateAndConsumeState(tamperedState);
  console.log(`[Test 5] Tampered State Result: valid=${tamperedCheck.valid} (${tamperedCheck.error})`);
  if (tamperedCheck.valid !== false) {
    throw new Error('SECURITY VULNERABILITY: Tampered state token was accepted!');
  }

  // Test 6: Rate Limiting Enforcement (HTTP 429)
  console.log('[Test 6] Testing Endpoint Rate Limiting Enforcement...');
  let hitLimit = false;
  for (let i = 0; i < 20; i++) {
    const reqLimiter: any = { ip: '192.168.1.100', headers: {} };
    const resLimiter = createMockRes();
    let nextCalled = false;
    digilockerConnectLimiter(reqLimiter, resLimiter, () => {
      nextCalled = true;
    });

    if (resLimiter.statusCode === 429) {
      console.log(`[Test 6] Rate Limiter Triggered at Attempt #${i + 1} -> HTTP 429 (${resLimiter.data.message})`);
      hitLimit = true;
      break;
    }
  }
  if (!hitLimit) {
    throw new Error('Rate limiter test failed to emit HTTP 429');
  }

  // Test 7: Citizen Data Isolation & Role Restrictions
  console.log('[Test 7] Testing Role Restrictions on Document Locker Access...');
  const reqAdminLocker: any = { user: { id: adminUser._id.toString(), role: UserRole.ADMIN } };
  const resAdminLocker = createMockRes();
  await getAvailableDocuments(reqAdminLocker, resAdminLocker);
  console.log(`[Test 7] Admin query for raw document locker -> StatusCode: ${resAdminLocker.statusCode} (${resAdminLocker.data.message})`);
  if (resAdminLocker.statusCode !== 403) {
    throw new Error('SECURITY VULNERABILITY: Admin role was allowed to query raw document locker!');
  }

  console.log('\n✅ ALL PHASE 5 SECURITY & RATE LIMITING TESTS PASSED SUCCESSFULLY!');
}

runPhase5SecurityTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Phase 5 Security Test Suite Failed:', err);
    process.exit(1);
  });
