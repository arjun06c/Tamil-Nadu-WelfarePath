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
        tag: 'Official Prototype Platform',
        title: 'Tamil Nadu WelfarePath',
        highlightTitle: 'Personalized Citizen Welfare Journey',
        description: 'Discover eligible state welfare schemes, understand exact eligibility criteria with explainable gap analysis, prepare OCR-verified documents, and track your benefit lifecycle.',
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
        tag: 'அதிகாரப்பூர்வ மாதிரி தளம்',
        title: 'தமிழ்நாடு நலன்பாதை',
        highlightTitle: 'மக்களுக்கான எளிய அரசு நலத்திட்ட வழிகாட்டி',
        description: 'உங்களுக்கு தகுதியான தமிழ்நாடு அரசு நலத்திட்டங்களை கண்டறியவும், தகுதி நிபந்தனைகள் மற்றும் விடுபட்ட சான்றிதழ்களை தெளிவாக புரிந்து கொள்ளவும், ஆவணங்களை சரிபார்த்து விண்ணப்பிக்கவும்.',
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
