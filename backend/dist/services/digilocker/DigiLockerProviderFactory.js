"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigiLockerProviderFactory = void 0;
const env_1 = require("../../config/env");
const DigiLockerMockProvider_1 = require("./DigiLockerMockProvider");
const DigiLockerSandboxProvider_1 = require("./DigiLockerSandboxProvider");
const DigiLockerProductionProvider_1 = require("./DigiLockerProductionProvider");
class DigiLockerProviderFactory {
    static mockProviderInstance = null;
    static sandboxProviderInstance = null;
    static productionProviderInstance = null;
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
        if (mode === 'sandbox') {
            if (!env_1.env.DIGILOCKER_CLIENT_ID || !env_1.env.DIGILOCKER_CLIENT_SECRET) {
                throw new Error(`[DigiLocker Config Error] DIGILOCKER_MODE is set to 'sandbox', but required partner credentials (DIGILOCKER_CLIENT_ID / DIGILOCKER_CLIENT_SECRET) are missing in environment configuration.`);
            }
            if (!this.sandboxProviderInstance) {
                this.sandboxProviderInstance = new DigiLockerSandboxProvider_1.DigiLockerSandboxProvider();
            }
            return this.sandboxProviderInstance;
        }
        if (mode === 'production') {
            if (!env_1.env.DIGILOCKER_CLIENT_ID || !env_1.env.DIGILOCKER_CLIENT_SECRET) {
                throw new Error(`[DigiLocker Config Error] DIGILOCKER_MODE is set to 'production', but required partner credentials (DIGILOCKER_CLIENT_ID / DIGILOCKER_CLIENT_SECRET) are missing in environment configuration.`);
            }
            if (!this.productionProviderInstance) {
                this.productionProviderInstance = new DigiLockerProductionProvider_1.DigiLockerProductionProvider();
            }
            return this.productionProviderInstance;
        }
        // Default safety fallback for unconfigured environment
        if (!this.mockProviderInstance) {
            this.mockProviderInstance = new DigiLockerMockProvider_1.DigiLockerMockProvider();
        }
        return this.mockProviderInstance;
    }
}
exports.DigiLockerProviderFactory = DigiLockerProviderFactory;
