"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigiLockerProviderFactory = void 0;
const env_1 = require("../../config/env");
const DigiLockerMockProvider_1 = require("./DigiLockerMockProvider");
class DigiLockerProviderFactory {
    static mockProviderInstance = null;
    /**
     * Returns the active provider based on system environment configuration (DIGILOCKER_MODE)
     */
    static getProvider(overrideMode) {
        const mode = overrideMode || env_1.env.DIGILOCKER_MODE || 'mock';
        if (mode === 'mock') {
            if (!this.mockProviderInstance) {
                this.mockProviderInstance = new DigiLockerMockProvider_1.DigiLockerMockProvider();
            }
            return this.mockProviderInstance;
        }
        if (mode === 'sandbox' || mode === 'production') {
            // Startup / configuration validation check
            if (!env_1.env.DIGILOCKER_CLIENT_ID || !env_1.env.DIGILOCKER_CLIENT_SECRET) {
                throw new Error(`[DigiLocker Config Error] Mode is set to '${mode}', but required credentials (DIGILOCKER_CLIENT_ID / DIGILOCKER_CLIENT_SECRET) are missing.`);
            }
            // Sandbox and Production providers will be initialized when official credentials are fully configured.
            // Fallback safeguard for unconfigured sandbox/production environments:
            throw new Error(`[DigiLocker Provider Error] '${mode}' mode provider requires verified API Setu / DigiLocker partner credentials.`);
        }
        // Default safety fallback
        if (!this.mockProviderInstance) {
            this.mockProviderInstance = new DigiLockerMockProvider_1.DigiLockerMockProvider();
        }
        return this.mockProviderInstance;
    }
}
exports.DigiLockerProviderFactory = DigiLockerProviderFactory;
