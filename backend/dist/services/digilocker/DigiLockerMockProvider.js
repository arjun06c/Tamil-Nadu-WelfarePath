"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigiLockerMockProvider = void 0;
class DigiLockerMockProvider {
    mode = 'mock';
    getMode() {
        return this.mode;
    }
    async getAuthorizationUrl(state, scopes = ['doc_type']) {
        const scopeString = encodeURIComponent(scopes.join(' '));
        // Simulated auth endpoint for mock mode
        return `/citizen/settings/digilocker?mock_auth=true&state=${encodeURIComponent(state)}&scope=${scopeString}`;
    }
    async handleCallback(code, state) {
        if (!code || code === 'denied') {
            return {
                success: false,
                error: 'Authorization was cancelled or denied by citizen.'
            };
        }
        return {
            success: true,
            code,
            state,
            accessToken: `mock_access_token_demo_${Date.now()}`,
            expiresIn: 3600,
            user: {
                id: 'DL-MOCK-CITIZEN-9876',
                name: 'Thiru Arulmurugan S',
                dob: '1995-06-15',
                gender: 'M',
                maskedAadhaar: 'XXXX-XXXX-9812',
                mobile: '9876543210',
                email: 'arulmurugan.demo@tn.gov.in'
            }
        };
    }
    async getUserDetails(userId) {
        return {
            id: userId || 'DL-MOCK-CITIZEN-9876',
            name: 'Thiru Arulmurugan S',
            dob: '1995-06-15',
            gender: 'M',
            maskedAadhaar: 'XXXX-XXXX-9812',
            mobile: '9876543210',
            email: 'arulmurugan.demo@tn.gov.in'
        };
    }
    async getIssuedDocuments(userId) {
        return [
            {
                uri: 'in.gov.tn.edistrict.inc:2026-981023',
                docType: 'IncomeCertificate',
                name: {
                    en: 'Income Certificate (வருமானச் சான்றிதழ்)',
                    ta: 'வருமானச் சான்றிதழ்'
                },
                issuer: 'Revenue & Disaster Management Department, Govt of Tamil Nadu',
                issueDate: '2025-05-12',
                mimeType: 'application/pdf',
                status: 'AVAILABLE',
                description: 'Certified annual household income proof issued by Tahsildar.'
            },
            {
                uri: 'in.gov.tn.edistrict.com:2026-443219',
                docType: 'CommunityCertificate',
                name: {
                    en: 'Community Certificate (சாதி சான்றிதழ்)',
                    ta: 'சாதி சான்றிதழ்'
                },
                issuer: 'Revenue & Disaster Management Department, Govt of Tamil Nadu',
                issueDate: '2024-08-20',
                mimeType: 'application/pdf',
                status: 'AVAILABLE',
                description: 'BC / MBC / SC / ST Community proof issued by Zonal Deputy Tahsildar.'
            },
            {
                uri: 'in.gov.tn.dge.marksheet:2026-881920',
                docType: 'HSCMarksheet',
                name: {
                    en: 'Class 12 / HSC Mark Sheet (12ஆம் வகுப்பு மதிப்பெண் சான்றிதழ்)',
                    ta: '12ஆம் வகுப்பு மதிப்பெண் சான்றிதழ்'
                },
                issuer: 'Directorate of Government Examinations, Tamil Nadu',
                issueDate: '2023-06-10',
                mimeType: 'application/pdf',
                status: 'AVAILABLE',
                description: 'Official Higher Secondary Certificate Examination Mark Sheet.'
            },
            {
                uri: 'in.gov.tn.pds.ration:2026-551923',
                docType: 'SmartRationCard',
                name: {
                    en: 'Smart Ration Card (குடும்ப அட்டை)',
                    ta: 'ஸ்மார்ட் குடும்ப அட்டை'
                },
                issuer: 'Civil Supplies and Consumer Protection Dept, Govt of Tamil Nadu',
                issueDate: '2022-01-15',
                mimeType: 'application/pdf',
                status: 'AVAILABLE',
                description: 'PHH / Priority Household Family Smart Card.'
            },
            {
                uri: 'in.gov.uidai.aadhaar:2026-112233',
                docType: 'AadhaarCard',
                name: {
                    en: 'Aadhaar Card (ஆதார் கார்டு)',
                    ta: 'ஆதார் அட்டை'
                },
                issuer: 'Unique Identification Authority of India (UIDAI)',
                issueDate: '2021-11-05',
                mimeType: 'application/pdf',
                status: 'AVAILABLE',
                description: 'Official Digital Aadhaar Identity Document.'
            }
        ];
    }
    async getDocument(userId, uri) {
        const docs = await this.getIssuedDocuments(userId);
        const doc = docs.find((d) => d.uri === uri) || docs[0];
        return {
            uri: doc.uri,
            docType: doc.docType,
            mimeType: 'application/pdf',
            contentUrl: `https://via.placeholder.com/800x1100.png?text=Demo+Document+Source:+${encodeURIComponent(doc.name.en)}`,
            metadata: {
                source: 'Demo Document Source',
                providerMode: 'mock',
                issuer: doc.issuer,
                issueDate: doc.issueDate,
                documentType: doc.docType,
                verifiedByProvider: true,
                disclaimer: 'This document was retrieved from Demo Document Source (Mock Mode).'
            }
        };
    }
    async revokeAccess(userId) {
        return true;
    }
    async getHealthStatus() {
        return {
            configured: true,
            mode: 'mock',
            status: 'HEALTHY',
            apiReachability: true,
            lastChecked: new Date(),
            badgeLabel: 'Demo Document Source',
            details: 'Running in simulated mock provider mode. No external credentials required.'
        };
    }
}
exports.DigiLockerMockProvider = DigiLockerMockProvider;
