"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../config/db");
const User_1 = require("../../models/User");
const DigiLockerConnection_1 = require("../../models/DigiLockerConnection");
const DigiLockerConsent_1 = require("../../models/DigiLockerConsent");
const AuditLog_1 = require("../../models/AuditLog");
const adminController_1 = require("../adminController");
const createMockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.data = null;
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
async function runPhase10AdminTests() {
    console.log('🔄 Starting Phase 10 Admin DigiLocker Monitoring & Integration Health Test Suite...\n');
    await (0, db_1.connectDB)();
    // 1. Create Admin & Citizen Users
    const admin = await User_1.User.create({
        name: 'System Admin S. Raman',
        email: `admin_p10_${Date.now()}@tn.gov.in`,
        mobile: '9840999999',
        passwordHash: 'hashed_pass',
        role: User_1.UserRole.ADMIN,
        district: 'State HQ'
    });
    const citizen = await User_1.User.create({
        name: 'Citizen K. Kumar',
        email: `kumar_p10_${Date.now()}@example.com`,
        mobile: '9789099999',
        passwordHash: 'hashed_pass',
        role: User_1.UserRole.CITIZEN,
        district: 'Salem'
    });
    // 2. Seed Integration Records (Connections, Consents, Audit Logs)
    await DigiLockerConnection_1.DigiLockerConnection.create({
        userId: citizen._id,
        environment: 'MOCK',
        status: 'CONNECTED',
        scopes: ['doc_type'],
        connectedAt: new Date()
    });
    await DigiLockerConsent_1.DigiLockerConsent.create({
        userId: citizen._id,
        purpose: 'Welfare application verification',
        requestedScopes: ['doc_type'],
        grantedScopes: ['doc_type'],
        consentReference: `REF-P10-${Date.now()}`,
        status: 'ACTIVE'
    });
    await AuditLog_1.AuditLog.create({
        actorId: citizen._id,
        actorEmail: citizen.email,
        action: 'DIGILOCKER_MOCK_AUTHORIZATION_GRANTED',
        targetType: 'DigiLockerConnection',
        details: 'User connected DigiLocker in MOCK mode'
    });
    // Test 1: Fetch Admin DigiLocker Monitoring Metrics
    console.log('[Test 1] Testing getAdminDigiLockerMetrics endpoint...');
    const req1 = { user: { id: admin._id.toString(), role: 'Admin' } };
    const res1 = createMockRes();
    await (0, adminController_1.getAdminDigiLockerMetrics)(req1, res1);
    console.log(`[Test 1.1] Mode: ${res1.data.mode}, BadgeLabel: "${res1.data.badgeLabel}"`);
    if (res1.statusCode !== 200 || !res1.data.metrics) {
        throw new Error('getAdminDigiLockerMetrics endpoint failed');
    }
    const metrics = res1.data.metrics;
    console.log(`[Test 1.2] Total Connections: ${metrics.totalConnections}, Active Consents: ${metrics.activeConsents}`);
    if (metrics.totalConnections < 1 || metrics.activeConsents < 1) {
        throw new Error('Metrics count check failed');
    }
    // Verify recent audit log returned in response
    console.log(`[Test 1.3] Recent Audit Logs Returned: ${res1.data.recentAuditLogs.length}`);
    if (res1.data.recentAuditLogs.length < 1) {
        throw new Error('Audit log list returned empty');
    }
    // Test 2: Fetch Admin Integration Health Status
    console.log('[Test 2] Testing getAdminIntegrationHealth endpoint...');
    const req2 = { user: { id: admin._id.toString(), role: 'Admin' } };
    const res2 = createMockRes();
    await (0, adminController_1.getAdminIntegrationHealth)(req2, res2);
    console.log(`[Test 2.1] System Status: ${res2.data.status}, EnvBadgeLabel: "${res2.data.envBadgeLabel}"`);
    if (res2.statusCode !== 200 || res2.data.status !== 'OPERATIONAL') {
        throw new Error('getAdminIntegrationHealth failed or returned non-OPERATIONAL status');
    }
    console.log(`[Test 2.2] Active Microservices Count: ${res2.data.activeServices.length}`);
    if (res2.data.activeServices.length !== 4) {
        throw new Error('Expected 4 healthy microservices in telemetry response');
    }
    // Verify Mock environment badge label is accurate
    if (res2.data.envBadgeLabel !== 'Demo / Mock Environment') {
        throw new Error('Mock environment badge label check failed');
    }
    console.log('\n✅ ALL PHASE 10 ADMIN MONITORING INTEGRATION TESTS PASSED SUCCESSFULLY!');
}
runPhase10AdminTests()
    .then(() => process.exit(0))
    .catch((err) => {
    console.error('❌ Phase 10 Test Suite Failed:', err);
    process.exit(1);
});
