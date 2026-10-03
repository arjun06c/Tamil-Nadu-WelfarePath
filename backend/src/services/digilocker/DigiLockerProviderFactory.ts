import { env } from '../../config/env';
import { IDigiLockerProvider } from './DigiLockerProvider';
import { DigiLockerMockProvider } from './DigiLockerMockProvider';
import { DigiLockerSandboxProvider } from './DigiLockerSandboxProvider';
import { DigiLockerProductionProvider } from './DigiLockerProductionProvider';
import { DigiLockerMode } from './DigiLockerTypes';

export class DigiLockerProviderFactory {
  private static mockProviderInstance: DigiLockerMockProvider | null = null;
  private static sandboxProviderInstance: DigiLockerSandboxProvider | null = null;
  private static productionProviderInstance: DigiLockerProductionProvider | null = null;

  /**
   * Returns the active provider based on system environment configuration (DIGILOCKER_MODE)
   */
  public static getProvider(overrideMode?: DigiLockerMode): IDigiLockerProvider {
    const mode = overrideMode || env.DIGILOCKER_MODE || 'mock';

    if (mode === 'mock') {
      if (!this.mockProviderInstance) {
        this.mockProviderInstance = new DigiLockerMockProvider();
      }
      return this.mockProviderInstance;
    }

    if (mode === 'sandbox') {
      if (!env.DIGILOCKER_CLIENT_ID || !env.DIGILOCKER_CLIENT_SECRET) {
        throw new Error(
          `[DigiLocker Config Error] DIGILOCKER_MODE is set to 'sandbox', but required partner credentials (DIGILOCKER_CLIENT_ID / DIGILOCKER_CLIENT_SECRET) are missing in environment configuration.`
        );
      }
      if (!this.sandboxProviderInstance) {
        this.sandboxProviderInstance = new DigiLockerSandboxProvider();
      }
      return this.sandboxProviderInstance;
    }

    if (mode === 'production') {
      if (!env.DIGILOCKER_CLIENT_ID || !env.DIGILOCKER_CLIENT_SECRET) {
        throw new Error(
          `[DigiLocker Config Error] DIGILOCKER_MODE is set to 'production', but required partner credentials (DIGILOCKER_CLIENT_ID / DIGILOCKER_CLIENT_SECRET) are missing in environment configuration.`
        );
      }
      if (!this.productionProviderInstance) {
        this.productionProviderInstance = new DigiLockerProductionProvider();
      }
      return this.productionProviderInstance;
    }

    // Default safety fallback for unconfigured environment
    if (!this.mockProviderInstance) {
      this.mockProviderInstance = new DigiLockerMockProvider();
    }
    return this.mockProviderInstance;
  }
}
