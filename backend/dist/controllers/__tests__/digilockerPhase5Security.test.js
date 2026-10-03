"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../config/db");
const User_1 = require("../../models/User");
const DigiLockerSecurityService_1 = require("../../services/digilocker/DigiLockerSecurityService");
const digilockerController_1 = require("../digilockerController");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const createMockRes = () => {
    const res = {};
    res.headers = {};
    res.statusCode = 200;
    res.data = null;
    res.setHeader = (key, val) => {
        res.headers[key] = val;
    };
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (payload) => {
        res.data = payload;
        return res;
    };
    return res;
};
async function runPhase5SecurityTests() {
    console.log('🛡️ Starting Phase 5 Security, Auditing & Rate Limiting Test Suite...\n');
    await (0, db_1.connectDB)();
    // Test 1: Encryption & Decryption at Rest
    console.log('[Test 1] Testing AES-256-GCM Token Encryption & Decryption at Rest...');
    const sensitiveToken = 'oauth_access_token_super_secret_99887766';
    const encrypted = DigiLockerSecurityService_1.DigiLockerSecurityService.encrypt(sensitiveToken);
    const decrypted = DigiLockerSecurityService_1.DigiLockerSecurityService.decrypt(encrypted);
    console.log(`[Test 1] Token Encrypted: ${encrypted.substring(0, 30)}... | Decrypted Match: ${decrypted === sensitiveToken}`);
    if (decrypted !== sensitiveToken)
        throw new Error('AES-256-GCM token encryption test failed');
    // Test 2: Log Data Redaction & Sanitization
    console.log('[Test 2] Testing Sensitive Log Payload Redaction...');
    const rawLogObj = {
        client_secret: 'secret_key_123',
        access_token: 'tok_abc123',
        aadhaar: '9876-5432-1098',
        message: 'User connect successful'
    };
    const sanitized = DigiLockerSecurityService_1.DigiLockerSecurityService.sanitizeLogData(rawLogObj);
    console.log(`[Test 2] Sanitized Log Payload:`, sanitized);
    if (sanitized.client_secret !== '[REDACTED]' || sanitized.access_token !== '[REDACTED]') {
        throw new Error('Log sanitization failed to redact tokens/secrets');
    }
    // Create Users: Citizen A, Citizen B, Admin User
    const citizenA = await User_1.User.create({
        name: 'Security Citizen A',
        email: `sec_a_${Date.now()}@tn.gov.in`,
        mobile: '9876543210',
        passwordHash: 'hashed_password',
        role: User_1.UserRole.CITIZEN,
        district: 'Chennai'
    });
    const citizenB = await User_1.User.create({
        name: 'Security Citizen B',
        email: `sec_b_${Date.now()}@tn.gov.in`,
        mobile: '9876543211',
        passwordHash: 'hashed_password',
        role: User_1.UserRole.CITIZEN,
        district: 'Madurai'
    });
    const adminUser = await User_1.User.create({
        name: 'System Admin',
        email: `admin_${Date.now()}@tn.gov.in`,
        mobile: '9876543299',
        passwordHash: 'hashed_password',
        role: User_1.UserRole.ADMIN,
        district: 'Chennai'
    });
    // Test 3: OAuth HMAC State Generation & Validation
    console.log('[Test 3] Testing Cryptographic HMAC State Generation & Validation...');
    const validState = DigiLockerSecurityService_1.DigiLockerSecurityService.generateSecureState(citizenA._id.toString());
    const stateCheck = DigiLockerSecurityService_1.DigiLockerSecurityService.validateAndConsumeState(validState);
    console.log(`[Test 3] State Validation Result: valid=${stateCheck.valid}, userId=${stateCheck.userId}`);
    if (!stateCheck.valid || stateCheck.userId !== citizenA._id.toString()) {
        throw new Error('HMAC state generation & validation failed');
    }
    // Test 4: OAuth Replay Attack Prevention (Re-using consumed state)
    console.log('[Test 4] Testing Replay Attack Prevention on Reused State...');
    const replayCheck = DigiLockerSecurityService_1.DigiLockerSecurityService.validateAndConsumeState(validState);
    console.log(`[Test 4] Replay Attempt Result: valid=${replayCheck.valid} (${replayCheck.error})`);
    if (replayCheck.valid !== false) {
        throw new Error('SECURITY VULNERABILITY: Reused state token was accepted!');
    }
    // Test 5: OAuth Tampered State Prevention
    console.log('[Test 5] Testing Tampered OAuth State Rejection...');
    const tamperedState = validState.slice(0, -5) + 'XXXXX';
    const tamperedCheck = DigiLockerSecurityService_1.DigiLockerSecurityService.validateAndConsumeState(tamperedState);
    console.log(`[Test 5] Tampered State Result: valid=${tamperedCheck.valid} (${tamperedCheck.error})`);
    if (tamperedCheck.valid !== false) {
        throw new Error('SECURITY VULNERABILITY: Tampered state token was accepted!');
    }
    // Test 6: Rate Limiting Enforcement (HTTP 429)
    console.log('[Test 6] Testing Endpoint Rate Limiting Enforcement...');
    let hitLimit = false;
    for (let i = 0; i < 20; i++) {
        const reqLimiter = { ip: '192.168.1.100', headers: {} };
        const resLimiter = createMockRes();
        let nextCalled = false;
        (0, rateLimiter_1.digilockerConnectLimiter)(reqLimiter, resLimiter, () => {
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
    const reqAdminLocker = { user: { id: adminUser._id.toString(), role: User_1.UserRole.ADMIN } };
    const resAdminLocker = createMockRes();
    await (0, digilockerController_1.getAvailableDocuments)(reqAdminLocker, resAdminLocker);
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
