import {
  DigiLockerAuthResult,
  DigiLockerDocumentContent,
  DigiLockerDocumentItem,
  DigiLockerHealthStatus,
  DigiLockerMode,
  DigiLockerUser
} from './DigiLockerTypes';

export interface IDigiLockerProvider {
  /**
   * Returns current active mode of provider
   */
  getMode(): DigiLockerMode;

  /**
   * Generates secure OAuth authorization URL for citizen redirect
   */
  getAuthorizationUrl(state: string, scopes?: string[]): Promise<string>;

  /**
   * Processes OAuth redirect callback, validates state and code
   */
  handleCallback(code: string, state: string): Promise<DigiLockerAuthResult>;

  /**
   * Retrieves authenticated citizen user details
   */
  getUserDetails(userId: string): Promise<DigiLockerUser>;

  /**
   * Retrieves authorized list of eligible digital documents
   */
  getIssuedDocuments(userId: string): Promise<DigiLockerDocumentItem[]>;

  /**
   * Downloads single document by URI according to data minimization principles
   */
  getDocument(userId: string, uri: string): Promise<DigiLockerDocumentContent>;

  /**
   * Revokes access connection
   */
  revokeAccess(userId: string): Promise<boolean>;

  /**
   * Runs diagnostic health check on API Setu / DigiLocker integration
   */
  getHealthStatus(): Promise<DigiLockerHealthStatus>;
}
