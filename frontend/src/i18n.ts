import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav: {
        title: 'Tamil Nadu WelfarePath',
        subtitle: 'Government Welfare Decision & Benefit Platform',
        home: 'Home',
        schemes: 'Discover Schemes',
        dashboard: 'My Portfolio',
        officer: 'Officer Console',
        admin: 'Admin Console',
        login: 'Sign In',
        register: 'Citizen Register',
        logout: 'Sign Out',
        profile: 'Citizen Profile'
      },
      hero: {
        tag: 'Personalized Citizen Welfare Platform',
        title: 'Tamil Nadu WelfarePath',
        highlightTitle: 'Discover Welfare Benefits That Match Your Needs',
        description: 'Explore welfare schemes, understand eligibility requirements, prepare supporting documents, and track your application journey.',
        discoverCta: 'Check My Eligibility',
        exploreCta: 'Explore All Schemes',
        statSchemes: 'Verified Schemes',
        statDomains: 'Welfare Sectors',
        statAccuracy: 'Explainable Rule Accuracy'
      },
      domains: {
        title: 'Tamil Nadu Welfare Sectors',
        subtitle: 'Explore targeted support programs across 10 key government development sectors'
      },
      dashboard: {
        title: 'Personal Welfare Portfolio',
        subtitle: 'Real-time overview of your evaluated scheme eligibility, applications, and active benefits',
        eligibleTab: 'Eligible Schemes',
        nearEligibleTab: 'Near Eligible (Missing Requirements)',
        applicationsTab: 'Active Applications',
        benefitsTab: 'Approved Benefit Records',
        reevaluateBtn: 'Re-evaluate My Profile',
        kpiEligible: 'Eligible Schemes',
        kpiNearEligible: 'Near Eligible',
        kpiApplications: 'Applications in Progress',
        kpiBenefits: 'Active Benefits'
      },
      assistant: {
        title: 'WelfarePath Assistant',
        subtitle: 'Bilingual AI & Rule-based Welfare Guidance',
        placeholder: 'Ask in English or தமிழ் (e.g. Which schemes am I eligible for?)...',
        send: 'Ask',
        greeting: 'Hello! How can I assist your welfare benefit discovery today?'
      },
      status: {
        eligible: 'ELIGIBLE',
        nearEligible: 'NEAR ELIGIBLE',
        notEligible: 'NOT ELIGIBLE',
        submitted: 'SUBMITTED',
        docVerification: 'DOC VERIFICATION',
        officerReview: 'OFFICER REVIEW',
        approved: 'APPROVED',
        rejected: 'REJECTED'
      },
      digilocker: {
        title: 'DigiLocker Integration',
        subtitle: 'Securely fetch and verify digital documents directly from official government repositories.',
        connectBtn: 'Connect DigiLocker',
        disconnectBtn: 'Disconnect Integration',
        statusConnected: 'Connected',
        statusNotConnected: 'Not Connected',
        statusDisconnected: 'Disconnected',
        demoBadge: 'Simulation Mode',
        sandboxBadge: 'DigiLocker Sandbox',
        prodBadge: 'DigiLocker',
        fetchFromDigiLocker: 'Fetch from DigiLocker',
        uploadManually: 'Upload Manually',
        chooseSource: 'Choose Document Source',
        availableDocs: 'Available Digital Documents',
        selectDoc: 'Use This Document',
        selected: 'Selected',
        retrieved: 'Retrieved from DigiLocker',
        verificationPending: 'Pending Officer Review',
        verified: 'Officer Verified',
        correctionRequired: 'Correction Required',
        consentTitle: 'Citizen Data Access Consent',
        consentPurpose: 'Welfare Application Document Verification',
        continueConsent: 'Continue with DigiLocker',
        cancelConsent: 'Cancel',
        privacyNotice: 'Your privacy is protected. WelfarePath only requests access to documents required for your specific application purpose.'
      }
    }
  },
  ta: {
    translation: {
      nav: {
        title: 'தமிழ்நாடு நலன்பாதை',
        subtitle: 'அரசு நலத்திட்டங்கள் மற்றும் உரிமைத் தொகை தளம்',
        home: 'முகப்பு',
        schemes: 'நலத்திட்டங்கள்',
        dashboard: 'என் நலன்பாதை',
        officer: 'அதிகாரி பக்கம்',
        admin: 'நிர்வாகி பக்கம்',
        login: 'உள்நுழைக',
        register: 'பதிவு செய்ய',
        logout: 'வெளியேறு',
        profile: 'என் சுயவிவரம்'
      },
      hero: {
        tag: 'தனிப்பயனாக்கப்பட்ட குடிமக்கள் நலத் திட்டம்',
        title: 'தமிழ்நாடு நலன்பாதை',
        highlightTitle: 'உங்கள் தேவைகளுக்கேற்ற அரசு நலத்திட்டங்கள்',
        description: 'உங்களுக்கு தகுதியான தமிழ்நாடு அரசு நலத்திட்டங்களை கண்டறியவும், தகுதி நிபந்தனைகளை புரிந்துகொள்ளவும், தேவையான ஆவணங்களை ஆயத்தம் செய்து விண்ணப்ப நிலையை கண்காணிக்கவும்.',
        discoverCta: 'என் தகுதியைச் சோதிக்க',
        exploreCta: 'அனைத்து திட்டங்கள்',
        statSchemes: 'சரிபார்க்கப்பட்ட திட்டங்கள்',
        statDomains: 'நலத்திட்டத் துறைகள்',
        statAccuracy: 'விளக்கமான தகுதி துல்லியம்'
      },
      domains: {
        title: 'தமிழ்நாடு அரசு நலத்திட்டத் துறைகள்',
        subtitle: '10 முக்கிய அரசு வளர்ச்சித் துறைகளின் கீழ் உள்ள சமூக நலத் திட்டங்களை ஆராயுங்கள்'
      },
      dashboard: {
        title: 'என் தனிப்பட்ட நலன் டாஷ்போர்டு',
        subtitle: 'உங்கள் தகுதியான திட்டங்கள், விண்ணப்பங்கள் மற்றும் அரசு உதவித்தொகை நிலவரம்',
        eligibleTab: 'முழு தகுதியுள்ள திட்டங்கள்',
        nearEligibleTab: 'தகுதி பெறக்கூடியவை (சான்றிதழ் தேவை)',
        applicationsTab: 'செயலில் உள்ள விண்ணப்பங்கள்',
        benefitsTab: 'பெறப்பட்ட உதவித்தொகைகள்',
        reevaluateBtn: 'சுயவிவரத்தை மீண்டும் சரிபார்',
        kpiEligible: 'தகுதியான திட்டங்கள்',
        kpiNearEligible: 'சான்றிதழ் தேவைப்படுபவை',
        kpiApplications: 'விண்ணப்பங்கள்',
        kpiBenefits: 'அரசு உதவிகள்'
      },
      assistant: {
        title: 'நலன்பாதை உதவியாளன்',
        subtitle: 'இருமொழி நலத்திட்ட வழிகாட்டி',
        placeholder: 'தமிழ் அல்லது ஆங்கிலத்தில் கேட்கவும் (எ.கா. நான் எந்த திட்டத்திற்கு தகுதியானவன்?)...',
        send: 'கேட்க',
        greeting: 'வணக்கம்! உங்களுக்குத் தேவையான அரசு நலத்திட்டங்களைக் கண்டறிய நான் எவ்வாறு உதவட்டும்?'
      },
      status: {
        eligible: 'முழு தகுதி',
        nearEligible: 'தகுதி பெறலாம்',
        notEligible: 'தகுதியற்றது',
        submitted: 'சமர்ப்பிக்கப்பட்டது',
        docVerification: 'ஆவண சரிபார்ப்பு',
        officerReview: 'அதிகாரி பரிசீலனை',
        approved: 'அங்கீகரிக்கப்பட்டது',
        rejected: 'நிராகரிக்கப்பட்டது'
      },
      digilocker: {
        title: 'டிஜிலாக்கர் இணைப்பு',
        subtitle: 'அதிகாரப்பூர்வ அரசு களஞ்சியங்களிலிருந்து உங்களது டிஜிட்டல் சான்றிதழ்களை பாதுகாப்பாகப் பெறவும்.',
        connectBtn: 'டிஜிலாக்கரை இணைக்கவும்',
        disconnectBtn: 'இணைப்பைத் துண்டிக்கவும்',
        statusConnected: 'இணைக்கப்பட்டுள்ளது',
        statusNotConnected: 'இணைக்கப்படவில்லை',
        statusDisconnected: 'துண்டிக்கப்பட்டது',
        demoBadge: 'மாதிரி இணைப்பு',
        sandboxBadge: 'டிஜிலாக்கர் பரிசோதனை களம்',
        prodBadge: 'டிஜிலாக்கர்',
        fetchFromDigiLocker: 'டிஜிலாக்கரில் இருந்து பெறவும்',
        uploadManually: 'கைமுறையாக பதிவேற்றவும்',
        chooseSource: 'ஆவண மூலத்தைத் தேர்ந்தெடுக்கவும்',
        availableDocs: 'கிடைக்கக்கூடிய டிஜிட்டல் ஆவணங்கள்',
        selectDoc: 'இந்த ஆவணத்தைப் பயன்படுத்தவும்',
        selected: 'தேர்ந்தெடுக்கப்பட்டது',
        retrieved: 'டிஜிலாக்கரில் இருந்து பெறப்பட்டது',
        verificationPending: 'அதிகாரி சரிபார்ப்பு நிலுவையில் உள்ளது',
        verified: 'அதிகாரியால் சரிபார்க்கப்பட்டது',
        correctionRequired: 'திருத்தம் தேவை',
        consentTitle: 'குடிமக்களின் ஆவண அணுகல் சம்மதம்',
        consentPurpose: 'நலத்திட்ட விண்ணப்ப ஆவண சரிபார்ப்பு',
        continueConsent: 'டிஜிலாக்கருடன் தொடரவும்',
        cancelConsent: 'ரத்து செய்',
        privacyNotice: 'உங்கள் தனியுரிமை பாதுகாக்கப்படுகிறது. உங்கள் விண்ணப்பத்திற்கு தேவையான ஆவணங்களை மட்டுமே நலன்பாதை பெறுகிறது.'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
