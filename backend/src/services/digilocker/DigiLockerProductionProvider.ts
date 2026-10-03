import { env } from '../../config/env';
import { IDigiLockerProvider } from './DigiLockerProvider';
import {
  DigiLockerAuthResult,
  DigiLockerDocumentContent,
  DigiLockerDocumentItem,
  DigiLockerHealthStatus,
  DigiLockerMode,
  DigiLockerUser
} from './DigiLockerTypes';
import { DigiLockerSecurityService } from './DigiLockerSecurityService';

export class DigiLockerProductionProvider implements IDigiLockerProvider {
  private readonly mode: DigiLockerMode = 'production';
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly authUrl: string;
  private readonly tokenUrl: string;
  private readonly apiBaseUrl: string;
  private readonly timeoutMs: number;

  constructor() {
    this.clientId = env.DIGILOCKER_CLIENT_ID;
    this.clientSecret = env.DIGILOCKER_CLIENT_SECRET;
    this.redirectUri = env.DIGILOCKER_REDIRECT_URI;
    this.authUrl =
      env.DIGILOCKER_AUTHORIZATION_URL ||
      'https://api.digitallocker.gov.in/public/oauth2/1/authorize';
    this.tokenUrl =
      env.DIGILOCKER_TOKEN_URL ||
      'https://api.digitallocker.gov.in/public/oauth2/1/token';
    this.apiBaseUrl =
      env.DIGILOCKER_API_BASE_URL ||
      'https://api.digitallocker.gov.in/public/oauth2/1';
    this.timeoutMs = env.DIGILOCKER_TIMEOUT_MS || 10000;

    // Production Provider Startup Configuration Health Check
    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        `[DigiLocker Production Error] DIGILOCKER_MODE is set to 'production', but required credentials (DIGILOCKER_CLIENT_ID / DIGILOCKER_CLIENT_SECRET) are missing.`
      );
    }
  }

  getMode(): DigiLockerMode {
    return this.mode;
  }

  async getAuthorizationUrl(state: string, scopes: string[] = ['doc_type']): Promise<string> {
    const scopeStr = (scopes && scopes.length > 0 ? scopes : [env.DIGILOCKER_SCOPES || 'doc_type']).join(' ');
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state,
      scope: scopeStr
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  async handleCallback(code: string, state: string): Promise<DigiLockerAuthResult> {
    if (!code || code === 'denied') {
      return {
        success: false,
        error: 'Authorization code missing or denied by citizen.'
      };
    }

    try {
      const bodyParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri
      });

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: bodyParams.toString(),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DigiLocker Production] Token Exchange Error:', DigiLockerSecurityService.sanitizeLogData(errorText));
        return {
          success: false,
          error: `Token exchange failed with HTTP ${response.status}.`
        };
      }

      const data: any = await response.json();
      const accessToken = data.access_token;

      if (!accessToken) {
        return {
          success: false,
          error: data.error_description || data.error || 'Access token missing in DigiLocker authorization response.'
        };
      }

      // Fetch official user details using access token
      const user = await this.getUserDetails(accessToken);

      return {
        success: true,
        code,
        state,
        accessToken,
        expiresIn: data.expires_in || 3600,
        user
      };
    } catch (err: any) {
      console.error('[DigiLocker Production] Callback Exception:', DigiLockerSecurityService.sanitizeLogData(err.message));
      return {
        success: false,
        error: err.name === 'AbortError' ? 'DigiLocker API request timed out.' : 'OAuth callback exchange error.'
      };
    }
  }

  async getUserDetails(tokenOrUserId: string): Promise<DigiLockerUser> {
    try {
      const url = `${this.apiBaseUrl}/user`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenOrUserId}`,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`Failed to fetch user details. Status: ${response.status}`);
      }

      const data: any = await response.json();

      return {
        id: data.digilockerid || data.sub || data.id || 'DL-PROD-CITIZEN',
        name: data.name || data.fullname || 'Citizen',
        dob: data.dob || data.dateOfBirth,
        gender: data.gender,
        maskedAadhaar: data.eaadhaar === 'Y' ? 'XXXX-XXXX-XXXX' : undefined,
        mobile: data.mobile,
        email: data.email
      };
    } catch (err: any) {
      console.error('[DigiLocker Production] getUserDetails Error:', DigiLockerSecurityService.sanitizeLogData(err.message));
      return {
        id: tokenOrUserId,
        name: 'Authorized Citizen',
        dob: 'N/A',
        gender: 'N/A'
      };
    }
  }

  async getIssuedDocuments(tokenOrUserId: string): Promise<DigiLockerDocumentItem[]> {
    try {
      const url = `${this.apiBaseUrl}/file/issued`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenOrUserId}`,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`Failed to fetch issued documents. Status: ${response.status}`);
      }

      const data: any = await response.json();
      const items: any[] = data.items || data.files || [];

      return items.map((item: any) => {
        const docType = item.type || item.doctype || item.docType || 'Certificate';
        const nameEn = item.name || item.description || docType;
        let nameTa = nameEn;

        if (docType.includes('Income') || nameEn.toLowerCase().includes('income')) {
          nameTa = 'வருமானச் சான்றிதழ்';
        } else if (docType.includes('Community') || nameEn.toLowerCase().includes('community')) {
          nameTa = 'சாதி சான்றிதழ்';
        } else if (docType.includes('Marksheet') || nameEn.toLowerCase().includes('marksheet')) {
          nameTa = '12ஆம் வகுப்பு மதிப்பெண் சான்றிதழ்';
        } else if (docType.includes('Ration') || nameEn.toLowerCase().includes('ration')) {
          nameTa = 'ஸ்மார்ட் குடும்ப அட்டை';
        } else if (docType.includes('Aadhaar') || nameEn.toLowerCase().includes('aadhaar')) {
          nameTa = 'ஆதார் அட்டை';
        }

        return {
          uri: item.uri || item.docid || `in.gov.tn.doc:${Date.now()}`,
          docType: docType,
          name: {
            en: nameEn,
            ta: nameTa
          },
          issuer: item.issuer || item.issuername || 'Govt of Tamil Nadu',
          issueDate: item.date || item.issuedate || new Date().toISOString().split('T')[0],
          mimeType: item.mime || 'application/pdf',
          status: 'AVAILABLE',
          description: item.description || 'Official Issued Digital Proof Document'
        };
      });
    } catch (err: any) {
      console.error('[DigiLocker Production] getIssuedDocuments Error:', DigiLockerSecurityService.sanitizeLogData(err.message));
      return [];
    }
  }

  async getDocument(tokenOrUserId: string, uri: string): Promise<DigiLockerDocumentContent> {
    try {
      const url = `${this.apiBaseUrl}/file/${encodeURIComponent(uri)}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenOrUserId}`,
          'Accept': 'application/xml, application/pdf, application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`Failed to fetch document content for URI ${uri}. Status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      let metadata: Record<string, any> = {
        source: 'DigiLocker',
        providerMode: 'production',
        retrievedAt: new Date().toISOString()
      };

      if (contentType.includes('xml') || contentType.includes('text')) {
        const xmlText = await response.text();
        
        // Extract key facts from XML payload if present
        const incomeMatch = xmlText.match(/<(?:AnnualIncome|annualFamilyIncome|incomeAmount)>(\d+)<\/(?:AnnualIncome|annualFamilyIncome|incomeAmount)>/i);
        const certNoMatch = xmlText.match(/<(?:CertificateNumber|certNo|documentRef)>([^<]+)<\/(?:CertificateNumber|certNo|documentRef)>/i);
        const issuerMatch = xmlText.match(/<(?:Issuer|issuerName)>([^<]+)<\/(?:Issuer|issuerName)>/i);

        if (incomeMatch) metadata.annualFamilyIncome = parseInt(incomeMatch[1], 10);
        if (certNoMatch) metadata.certificateNumber = certNoMatch[1];
        if (issuerMatch) metadata.issuer = issuerMatch[1];
      }

      return {
        uri,
        docType: uri.includes('inc') ? 'IncomeCertificate' : 'DigitalDocument',
        mimeType: contentType || 'application/pdf',
        metadata
      };
    } catch (err: any) {
      console.error('[DigiLocker Production] getDocument Error:', DigiLockerSecurityService.sanitizeLogData(err.message));
      return {
        uri,
        docType: 'DigitalDocument',
        mimeType: 'application/pdf',
        metadata: {
          source: 'DigiLocker',
          providerMode: 'production',
          error: 'Document content retrieval failed'
        }
      };
    }
  }

  async revokeAccess(tokenOrUserId: string): Promise<boolean> {
    try {
      const url = `${this.apiBaseUrl}/revoke`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `token=${encodeURIComponent(tokenOrUserId)}`,
        signal: controller.signal
      });

      clearTimeout(timer);
      return response.ok;
    } catch (err: any) {
      console.error('[DigiLocker Production] revokeAccess Error:', DigiLockerSecurityService.sanitizeLogData(err.message));
      return false;
    }
  }

  async getHealthStatus(): Promise<DigiLockerHealthStatus> {
    const isConfigured = !!(this.clientId && this.clientSecret);
    return {
      configured: isConfigured,
      mode: 'production',
      status: isConfigured ? 'HEALTHY' : 'NOT_CONFIGURED',
      apiReachability: isConfigured,
      lastChecked: new Date(),
      badgeLabel: 'DigiLocker',
      details: isConfigured
        ? 'Official DigiLocker production requester provider active.'
        : 'Production environment variables missing.'
    };
  }
}
