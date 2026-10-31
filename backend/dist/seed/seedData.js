"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const WelfareDomain_1 = require("../models/WelfareDomain");
const Scheme_1 = require("../models/Scheme");
const CitizenProfile_1 = require("../models/CitizenProfile");
const Application_1 = require("../models/Application");
const ApplicationDocument_1 = require("../models/ApplicationDocument");
const BenefitRecord_1 = require("../models/BenefitRecord");
const domainsData = [
    {
        domainKey: 'education',
        name: { en: 'Education & Scholarships', ta: 'கல்வி மற்றும் உதவித்தொகைகள்' },
        description: {
            en: 'Scholarships, higher education grants, and student assistance programs.',
            ta: 'கல்வி உதவித்தொகை, உயர்கல்வி மானியம் மற்றும் மாணவர் நலத்திட்டங்கள்.'
        },
        iconName: 'GraduationCap',
        displayOrder: 1
    },
    {
        domainKey: 'women_child',
        name: { en: 'Women & Child Welfare', ta: 'மகளிர் மற்றும் குழந்தைகள் நலன்' },
        description: {
            en: 'Maternity assistance, financial independence grants, and girl child welfare.',
            ta: 'மகப்பேறு நிதியுதவி, மகளிர் உரிமைத் தொகை மற்றும் பெண் குழந்தை பாதுகாப்பு.'
        },
        iconName: 'Heart',
        displayOrder: 2
    },
    {
        domainKey: 'social_security',
        name: { en: 'Social Security & Pensions', ta: 'சமூக பாதுகாப்பு மற்றும் ஓய்வூதியங்கள்' },
        description: {
            en: 'Old age pensions, destitute widow pensions, and social safety nets.',
            ta: 'முதியோர் ஓய்வூதியம், கணவரால் கைவிடப்பட்டோர் மற்றும் ஆதரவற்றோர் உதவித் தொகை.'
        },
        iconName: 'ShieldAlert',
        displayOrder: 3
    },
    {
        domainKey: 'differently_abled',
        name: { en: 'Differently Abled Welfare', ta: 'மாற்றுத்திறனாளிகள் நலன்' },
        description: {
            en: 'Maintenance allowances, retrofitted vehicles, and self-employment loans.',
            ta: 'பராமரிப்பு உதவித்தொகை, சக்கர நாற்காலி/வாகனம் மற்றும் சுயதொழில் கடன்.'
        },
        iconName: 'Accessibility',
        displayOrder: 4
    },
    {
        domainKey: 'agriculture',
        name: { en: 'Agriculture & Farmers Welfare', ta: 'வேளாண்மை மற்றும் விவசாயிகள் நலன்' },
        description: {
            en: 'Solar pump sets, crop insurance, and agricultural infrastructure grants.',
            ta: 'சூரிய மின்சார பம்ப்செட், பயிர் காப்பீடு மற்றும் விவசாய உபகரண மானியம்.'
        },
        iconName: 'Sprout',
        displayOrder: 5
    },
    {
        domainKey: 'health',
        name: { en: 'Health & Nutrition', ta: 'சுகாதாரம் மற்றும் ஊட்டச்சத்து' },
        description: {
            en: 'Comprehensive health insurance, doorstep medical care, and nutrition kits.',
            ta: 'முதலமைச்சரின் விரிவான மருத்துவக் காப்பீடு மற்றும் மக்களைத் தேடி மருத்துவம்.'
        },
        iconName: 'Activity',
        displayOrder: 6
    },
    {
        domainKey: 'employment_skills',
        name: { en: 'Employment & Skill Development', ta: 'வேலைவாய்ப்பு மற்றும் திறன் மேம்பாடு' },
        description: {
            en: 'Skill transformation programs, competitive exam coaching, and youth grants.',
            ta: 'நான் முதல்வன் திறன் பயிற்சி, வேலைவாய்ப்பற்ற இளைஞர் உதவித்தொகை.'
        },
        iconName: 'Briefcase',
        displayOrder: 7
    },
    {
        domainKey: 'msme',
        name: { en: 'Entrepreneurship & MSME', ta: 'தொழில்முனைவு மற்றும் சிறுகுறு தொழில்' },
        description: {
            en: 'Capital subsidies, first-generation entrepreneur schemes, and micro business loans.',
            ta: 'NEEDS திட்டம், புதிய தொழில்முனைவோர் மானியம் மற்றும் கடன் உதவிகள்.'
        },
        iconName: 'TrendingUp',
        displayOrder: 8
    },
    {
        domainKey: 'housing',
        name: { en: 'Housing & Basic Livelihood', ta: 'வீட்டுவசதி மற்றும் அடிப்படைத் தேவைகள்' },
        description: {
            en: 'Concrete housing grants, free house site patta, and rural livelihood support.',
            ta: 'கலைஞர் கனவு இல்லம், இலவச வீட்டு மனை பட்டா மற்றும் வாழ்வாதார உதவி.'
        },
        iconName: 'Home',
        displayOrder: 9
    },
    {
        domainKey: 'labour',
        name: { en: 'Labour & Worker Welfare', ta: 'தொழிலாளர் நலன்' },
        description: {
            en: 'Construction workers board benefits, unorganized sector maternity & marriage grants.',
            ta: 'கட்டுமானத் தொழிலாளர்கள் நலவாரியம் மற்றும் உடலுழைப்புத் தொழிலாளர் நன்மைகள்.'
        },
        iconName: 'HardHat',
        displayOrder: 10
    }
];
const schemesData = [
    {
        schemeCode: 'TN-SCH-001',
        domainKey: 'women_child',
        name: {
            en: 'Pudhumai Penn Scheme (Moovalur Ramamirtham Ammaiyar Higher Education Assurance)',
            ta: 'புதுமைப் பெண் திட்டம் (மூவலூர் ராமாமிர்தம் அம்மையார் உயர்கல்வி உறுதித் திட்டம்)'
        },
        department: {
            en: 'Social Welfare & Women Empowerment Department',
            ta: 'சமூக நலன் மற்றும் மகளிர் உரிமைத் துறை'
        },
        description: {
            en: 'Financial assistance of ₹1,000 per month directly deposited into the bank accounts of female students who studied in Tamil Nadu Government Schools from 6th to 12th standard till they complete their UG degree, diploma, or ITI.',
            ta: 'அரசுப் பள்ளிகளில் 6 முதல் 12 ஆம் வகுப்பு வரை படித்த மாணவிகளுக்கு பட்டப்படிப்பு/டிப்ளமோ முடிக்கும் வரை மாதம் ₹1,000 நிதியுதவி வழங்கும் திட்டம்.'
        },
        benefitSummary: {
            en: '₹1,000 monthly direct bank transfer.',
            ta: 'மாதம் ₹1,000 நேரடி வங்கி கணக்கு மாற்றம்.'
        },
        targetBeneficiaries: {
            en: 'Female Students in Higher Education',
            ta: 'உயர்கல்வி பயிலும் மாணவிகள்'
        },
        officialUrl: 'https://penkalvi.tn.gov.in',
        rules: {
            all: [
                {
                    field: 'gender',
                    operator: 'equals',
                    value: 'Female',
                    label: { en: 'Gender must be Female', ta: 'பாலினம் பெண்ணாக இருக்க வேண்டும்' },
                    isMandatory: true
                },
                {
                    field: 'employmentStatus',
                    operator: 'equals',
                    value: 'Student',
                    label: { en: 'Current Status must be Student', ta: 'தற்போதைய நிலை மாணவியாக இருக்க வேண்டும்' },
                    isMandatory: true
                },
                {
                    field: 'educationLevel',
                    operator: 'in',
                    value: ['Undergraduate', 'Diploma', 'ITI'],
                    label: { en: 'Enrolled in UG, Diploma, or ITI', ta: 'இளங்கலை, டிப்ளமோ அல்லது ஐ.டி.ஐ பயில வேண்டும்' },
                    isMandatory: true
                },
                {
                    field: 'govtSchoolYears6To12',
                    operator: 'equals',
                    value: true,
                    label: { en: 'Studied 6th to 12th in TN Govt School', ta: '6 முதல் 12 ஆம் வகுப்பு வரை தமிழக அரசுப் பள்ளியில் படித்திருக்க வேண்டும்' },
                    isMandatory: true
                }
            ]
        },
        requiredDocuments: [
            {
                docType: 'AadhaarCard',
                isMandatory: true,
                label: { en: 'Aadhaar Card', ta: 'ஆதார் அட்டை' }
            },
            {
                docType: 'GovtSchoolStudyCertificate',
                isMandatory: true,
                label: { en: 'Govt School Headmaster Study Certificate', ta: 'அரசுப் பள்ளி தலைமையாசிரியர் சான்றிதழ்' }
            },
            {
                docType: 'BankPassbook',
                isMandatory: true,
                label: { en: 'Bank Passbook First Page', ta: 'வங்கி கணக்குப் புத்தகத்தின் முதல் பக்கம்' }
            }
        ]
    },
    {
        schemeCode: 'TN-SCH-002',
        domainKey: 'women_child',
        name: {
            en: 'Kalaignar Magalir Urimai Thittam (Women Rights Grant)',
            ta: 'கலைஞர் மகளிர் உரிமைத் திட்டம்'
        },
        department: {
            en: 'Special Program Implementation Department',
            ta: 'சிறப்புத் திட்ட செயலாக்கத் துறை'
        },
        description: {
            en: 'Monthly financial grant of ₹1,000 to eligible female heads of families across Tamil Nadu to enhance financial autonomy and support household livelihood.',
            ta: 'தகுதியுள்ள குடும்பத் தலைவிகளுக்கு மாதம் ₹1,000 உரிமைத் தொகை வழங்கும் வரலாற்று சிறப்புமிக்க திட்டம்.'
        },
        benefitSummary: {
            en: '₹1,000 per month direct credit.',
            ta: 'மாதம் ₹1,000 நேரடி வைப்பு.'
        },
        targetBeneficiaries: {
            en: 'Female Heads of Eligible Households',
            ta: 'தகுதியுள்ள குடும்பத் தலைவிகள்'
        },
        officialUrl: 'https://kmut.tn.gov.in',
        rules: {
            all: [
                {
                    field: 'gender',
                    operator: 'equals',
                    value: 'Female',
                    label: { en: 'Gender must be Female', ta: 'பாலினம் பெண்ணாக இருக்க வேண்டும்' },
                    isMandatory: true
                },
                {
                    field: 'age',
                    operator: 'greater_than_or_equal',
                    value: 21,
                    label: { en: 'Age must be 21 or above', ta: 'வயது 21 அல்லது அதற்கு மேற்பட்டிருக்க வேண்டும்' },
                    isMandatory: true
                },
                {
                    field: 'annualIncome',
                    operator: 'less_than_or_equal',
                    value: 250000,
                    label: { en: 'Annual Family Income <= ₹2,50,000', ta: 'குடும்ப ஆண்டு வருமானம் ₹2.5 லட்சத்திற்குள் இருக்க வேண்டும்' },
                    isMandatory: true
                }
            ]
        },
        requiredDocuments: [
            {
                docType: 'SmartRationCard',
                isMandatory: true,
                label: { en: 'Family Smart Ration Card', ta: 'குடும்ப ஸ்மார்ட் ரேஷன் கார்டு' }
            },
            {
                docType: 'AadhaarCard',
                isMandatory: true,
                label: { en: 'Aadhaar Card', ta: 'ஆதார் அட்டை' }
            },
            {
                docType: 'BankPassbook',
                isMandatory: true,
                label: { en: 'Aadhaar-Linked Bank Account Passbook', ta: 'ஆதாருடன் இணைக்கப்பட்ட வங்கி கணக்கு புத்தகம்' }
            }
        ]
    },
    {
        schemeCode: 'TN-SCH-003',
        domainKey: 'education',
        name: {
            en: 'Post-Matric Scholarship for SC/ST/SCC Students',
            ta: 'ஆதிதிராவிடர் மற்றும் பழங்குடியின மாணவர்களுக்கான மெட்ரிக் பிந்தைய கல்வி உதவித்தொகை'
        },
        department: {
            en: 'Adi Dravidar and Tribal Welfare Department',
            ta: 'ஆதிதிராவிடர் மற்றும் பழங்குடியினர் நலத் துறை'
        },
        description: {
            en: '100% compulsory tuition fee waiver and maintenance allowance for SC/ST/Converted Christian Students pursuing post-10th education in recognized institutions.',
            ta: 'பத்தாம் வகுப்பிற்குப் பிந்தைய பட்டப்படிப்பு மற்றும் தொழிற்கல்வி பயிலும் ஆதிதிராவிடர்/பழங்குடியின மாணவர்களுக்கு முழு கல்விக்கட்டண விலக்கு.'
        },
        benefitSummary: {
            en: 'Full Tuition Fee Reimbursement + Maintenance Allowance.',
            ta: 'முழு கல்விக் கட்டணம் + பராமரிப்பு உதவித்தொகை.'
        },
        targetBeneficiaries: {
            en: 'SC / ST / Converted Christian SC Students',
            ta: 'ஆதிதிராவிடர் / பழங்குடியின மாணவர்கள்'
        },
        officialUrl: 'https://tnadwscholarship.tn.gov.in',
        rules: {
            all: [
                {
                    field: 'socialCategory',
                    operator: 'in',
                    value: ['SC', 'ST'],
                    label: { en: 'Category must be SC or ST', ta: 'சமூகப் பிரிவு SC அல்லது ST ஆக இருக்க வேண்டும்' },
                    isMandatory: true
                },
                {
                    field: 'annualIncome',
                    operator: 'less_than_or_equal',
                    value: 250000,
                    label: { en: 'Annual Income <= ₹2,50,000', ta: 'ஆண்டு வருமானம் ₹2.5 லட்சத்திற்குள் இருக்க வேண்டும்' },
                    isMandatory: true
                }
            ]
        },
        requiredDocuments: [
            {
                docType: 'CommunityCertificate',
                isMandatory: true,
                label: { en: 'Community Certificate', ta: 'சாதிச் சான்றிதழ்' }
            },
            {
                docType: 'IncomeCertificate',
                isMandatory: true,
                label: { en: 'Income Certificate from Revenue Dept', ta: 'வருவாய்த் துறை வருமானச் சான்றிதழ்' }
            }
        ]
    },
    {
        schemeCode: 'TN-SCH-004',
        domainKey: 'social_security',
        name: {
            en: 'Indira Gandhi National Old Age Pension Scheme (IGNOAPS - TN)',
            ta: 'இலவச முதியோர் ஓய்வூதியத் திட்டம்'
        },
        department: {
            en: 'Revenue & Disaster Management Department',
            ta: 'வருவாய் மற்றும் பேரிடர் மேலாண்மைத் துறை'
        },
        description: {
            en: 'Monthly pension assistance of ₹1,200 for destitute elderly citizens aged 60 and above with no financial support.',
            ta: '60 வயதிற்கு மேற்பட்ட ஆதரவற்ற முதியோருக்கு மாதம் ₹1,200 ஓய்வூதியம் வழங்கும் திட்டம்.'
        },
        benefitSummary: {
            en: '₹1,200 monthly pension.',
            ta: 'மாதம் ₹1,200 முதியோர் ஓய்வூதியம்.'
        },
        targetBeneficiaries: {
            en: 'Destitute Elderly Citizens aged 60+',
            ta: '60 வயதிற்கு மேற்பட்ட முதியோர்கள்'
        },
        officialUrl: 'https://tnreginet.gov.in',
        rules: {
            all: [
                {
                    field: 'age',
                    operator: 'greater_than_or_equal',
                    value: 60,
                    label: { en: 'Age must be 60 or above', ta: 'வயது 60 அல்லது அதற்கு மேல் இருக்க வேண்டும்' },
                    isMandatory: true
                },
                {
                    field: 'annualIncome',
                    operator: 'less_than_or_equal',
                    value: 100000,
                    label: { en: 'Annual Income <= ₹1,00,000', ta: 'ஆண்டு வருமானம் ₹1 லட்சத்திற்குள் இருக்க வேண்டும்' },
                    isMandatory: true
                }
            ]
        },
        requiredDocuments: [
            {
                docType: 'AgeProof',
                isMandatory: true,
                label: { en: 'Age Proof (Birth Cert / Aadhaar)', ta: 'வயதுச் சான்று (ஆதார் / பிறப்புச் சான்றிதழ்)' }
            },
            {
                docType: 'IncomeCertificate',
                isMandatory: true,
                label: { en: 'Income Certificate', ta: 'வருமானச் சான்றிதழ்' }
            }
        ]
    },
    {
        schemeCode: 'TN-SCH-005',
        domainKey: 'health',
        name: {
            en: "Chief Minister's Comprehensive Health Insurance Scheme (CMCHIS)",
            ta: 'முதலமைச்சரின் விரிவான மருத்துவக் காப்பீட்டுத் திட்டம்'
        },
        department: {
            en: 'Health & Family Welfare Department',
            ta: 'மக்கள் நல்வாழ்வு மற்றும் குடும்ப நலத் துறை'
        },
        description: {
            en: 'Cashless medical treatment coverage up to ₹5,00,000 per family per year in empanelled government and private hospitals across Tamil Nadu.',
            ta: 'குடும்பத்திற்கு ஆண்டுக்கு ₹5 லட்சம் வரை கட்டணமில்லா மருத்துவச் சிகிச்சை வழங்கும் திட்டம்.'
        },
        benefitSummary: {
            en: 'Cashless hospital coverage up to ₹5 Lakhs/year.',
            ta: 'ஆண்டுக்கு ₹5 லட்சம் வரையிலான மருத்துவக் காப்பீடு.'
        },
        targetBeneficiaries: {
            en: 'Families with annual income <= ₹1,20,000',
            ta: 'ஆண்டு வருமானம் ₹1.2 லட்சத்திற்குள் உள்ள குடும்பங்கள்'
        },
        officialUrl: 'https://cmchistn.com',
        rules: {
            all: [
                {
                    field: 'annualIncome',
                    operator: 'less_than_or_equal',
                    value: 120000,
                    label: { en: 'Annual Income <= ₹1,20,000', ta: 'ஆண்டு வருமானம் ₹1,20,000 க்குள் இருக்க வேண்டும்' },
                    isMandatory: true
                }
            ]
        },
        requiredDocuments: [
            {
                docType: 'SmartRationCard',
                isMandatory: true,
                label: { en: 'Ration Card', ta: 'ரேஷன் கார்டு' }
            },
            {
                docType: 'IncomeCertificate',
                isMandatory: true,
                label: { en: 'VAO Income Certificate', ta: 'கிராம நிர்வாக அலுவலர் வழங்கிய வருமான சான்றிதழ்' }
            }
        ]
    },
    {
        schemeCode: 'TN-SCH-006',
        domainKey: 'housing',
        name: {
            en: 'Kalaignar Kanavu Illam Housing Scheme',
            ta: 'கலைஞர் கனவு இல்லம் திட்டம்'
        },
        department: {
            en: 'Rural Development & Panchayat Raj Department',
            ta: 'ஊரக வளர்ச்சி மற்றும் ஊராட்சித் துறை'
        },
        description: {
            en: 'Financial grant of ₹3,50,000 per house to build new RCC concrete houses replacing hutments in rural Tamil Nadu.',
            ta: 'கிராமப்புறங்களில் குடிசைகளுக்குப் பதிலாக புதிய சிமெண்ட் கான்கிரீட் வீடு கட்ட ₹3,50,000 மானியம்.'
        },
        benefitSummary: {
            en: '₹3,50,000 housing subsidy grant.',
            ta: 'வீடு கட்ட ₹3.5 லட்சம் நிதியுதவி.'
        },
        targetBeneficiaries: {
            en: 'Hutment Dwellers & Homeless Poor',
            ta: 'குடிசைவாதிகள் மற்றும் வீடற்ற ஏழைகள்'
        },
        officialUrl: 'https://tnrd.tn.gov.in',
        rules: {
            all: [
                {
                    field: 'annualIncome',
                    operator: 'less_than_or_equal',
                    value: 150000,
                    label: { en: 'Annual Family Income <= ₹1,50,000', ta: 'குடும்ப ஆண்டு வருமானம் ₹1.5 லட்சத்திற்குள் இருக்க வேண்டும்' },
                    isMandatory: true
                }
            ]
        },
        requiredDocuments: [
            {
                docType: 'HouseSitePatta',
                isMandatory: true,
                label: { en: 'House Site Patta Document', ta: 'வீட்டு மனை பட்டா நகல்' }
            },
            {
                docType: 'AadhaarCard',
                isMandatory: true,
                label: { en: 'Aadhaar Card', ta: 'ஆதார் அட்டை' }
            }
        ]
    }
];
const expandedSeedData_1 = require("./expandedSeedData");
const seedDatabase = async () => {
    try {
        console.log('[Seed] Seeding Tamil Nadu WelfarePath Master Data...');
        // Merge domains
        const allDomainsMap = new Map();
        domainsData.forEach((d) => allDomainsMap.set(d.domainKey, d));
        expandedSeedData_1.expandedDomainsData.forEach((d) => {
            if (!allDomainsMap.has(d.domainKey)) {
                allDomainsMap.set(d.domainKey, d);
            }
        });
        const finalDomains = Array.from(allDomainsMap.values());
        for (const d of finalDomains) {
            await WelfareDomain_1.WelfareDomain.findOneAndUpdate({ domainKey: d.domainKey }, d, { upsert: true, new: true });
        }
        console.log(`✅ Seeded ${finalDomains.length} Welfare Domains.`);
        // Merge schemes: preserves original TN-SCH-001 through 006
        const allSchemesMap = new Map();
        schemesData.forEach((s) => allSchemesMap.set(s.schemeCode, s));
        expandedSeedData_1.expandedSchemesData.forEach((s) => {
            if (!allSchemesMap.has(s.schemeCode)) {
                allSchemesMap.set(s.schemeCode, s);
            }
        });
        const finalSchemes = Array.from(allSchemesMap.values());
        for (const s of finalSchemes) {
            await Scheme_1.Scheme.findOneAndUpdate({ schemeCode: s.schemeCode }, s, { upsert: true, new: true });
        }
        console.log(`✅ Seeded ${finalSchemes.length} Verified Tamil Nadu Welfare Schemes.`);
        // Seed Users
        const defaultPasswordHash = await bcryptjs_1.default.hash('Admin@123', 10);
        const officerPasswordHash = await bcryptjs_1.default.hash('Officer@123', 10);
        const citizenPasswordHash = await bcryptjs_1.default.hash('Citizen@123', 10);
        await User_1.User.deleteMany({ email: { $in: ['admin@tnwelfare.gov.in', 'officer@tnwelfare.gov.in', 'citizen@gmail.com'] } });
        const admin = await User_1.User.create({
            name: 'System Admin Officer',
            email: 'admin@tnwelfare.gov.in',
            mobile: '9876543210',
            passwordHash: defaultPasswordHash,
            role: User_1.UserRole.ADMIN,
            district: 'Chennai',
            languagePreference: 'en'
        });
        const officer = await User_1.User.create({
            name: 'District Welfare Officer',
            email: 'officer@tnwelfare.gov.in',
            mobile: '9876543211',
            passwordHash: officerPasswordHash,
            role: User_1.UserRole.OFFICER,
            district: 'Madurai',
            languagePreference: 'ta'
        });
        const citizen = await User_1.User.create({
            name: 'Kavitha R',
            email: 'citizen@gmail.com',
            mobile: '9876543212',
            passwordHash: citizenPasswordHash,
            role: User_1.UserRole.CITIZEN,
            district: 'Madurai',
            languagePreference: 'en'
        });
        // Seed Citizen Profile for Demo
        await CitizenProfile_1.CitizenProfile.deleteMany({ userId: citizen._id });
        await CitizenProfile_1.CitizenProfile.create({
            userId: citizen._id,
            dob: new Date('2003-05-15'),
            gender: 'Female',
            district: 'Madurai',
            taluk: 'Madurai South',
            villageTown: 'Simmakkal',
            annualIncome: 140000,
            occupation: 'Student',
            employmentStatus: 'Student',
            educationLevel: 'Undergraduate',
            socialCategory: 'BC',
            disabilityStatus: false,
            disabilityPercentage: 0,
            isFarmer: false,
            isUnorganizedWorker: false,
            govtSchoolYears6To12: true,
            familyMembersCount: 4,
            dependentsCount: 2,
            aadhaarHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            bankDetails: {
                accountNoHash: 'c67d8f3750868f7f0e34c9c228807d8a7051390d4df7fa7eb1908bf93ee26d56',
                ifscCode: 'SBIN0001234',
                bankName: 'State Bank of India'
            }
        });
        // Seed 4 Consistent Demo Scenarios (Scenarios A, B, C, D)
        const seededSchemes = await Scheme_1.Scheme.find({});
        const pudhumaiScheme = seededSchemes.find(s => s.schemeCode === 'TN-SCH-001') || seededSchemes[0];
        const kmutScheme = seededSchemes.find(s => s.schemeCode === 'TN-SCH-002') || seededSchemes[1];
        const scholarshipScheme = seededSchemes.find(s => s.schemeCode === 'TN-SCH-003') || seededSchemes[2];
        const oldAgeScheme = seededSchemes.find(s => s.schemeCode === 'TN-SCH-004') || seededSchemes[3];
        // Clear existing applications, documents, and benefits for seeded citizen
        await Application_1.Application.deleteMany({ citizenId: citizen._id });
        await ApplicationDocument_1.ApplicationDocument.deleteMany({ citizenId: citizen._id });
        await BenefitRecord_1.BenefitRecord.deleteMany({ citizenId: citizen._id });
        // SCENARIO A — New / Pending Verification (Pudhumai Penn Scheme - Kavitha R)
        const appA = await Application_1.Application.create({
            applicationNo: 'TNP-WP-2026-00101',
            applicationReference: 'TNP-WP-2026-00101',
            citizenId: citizen._id,
            schemeId: pudhumaiScheme._id,
            district: 'Madurai',
            assignedOfficerId: officer._id,
            assignedAt: new Date(Date.now() - 1 * 86400000),
            status: Application_1.ApplicationStatus.SUBMITTED,
            currentStep: 1,
            completionPercentage: 20,
            formData: {
                applicantName: 'Kavitha R',
                mobile: '9876543212',
                district: 'Madurai',
                annualIncome: 140000,
                gender: 'Female',
                age: 21,
                collegeName: 'Meenakshi Government Arts College for Women',
                degree: 'B.A. Tamil Literature',
                schoolName: 'Govt Girls Hr Sec School, Othakadai, Madurai'
            },
            submittedAt: new Date(Date.now() - 3 * 3600000) // 3 hours ago (NEW badge)
        });
        // 1. Govt School Study Certificate (6th - 12th)
        await ApplicationDocument_1.ApplicationDocument.create({
            applicationId: appA._id,
            citizenId: citizen._id,
            docType: 'GovtSchoolStudyCertificate',
            documentName: { en: 'Govt School Study Certificate (6th-12th)', ta: 'அரசுப் பள்ளி சான்றிதழ் (6-12)' },
            fileName: 'study_certificate_kavitha.pdf',
            fileUrl: '/mock-documents/study_certificate_kavitha.pdf',
            fileSize: 7336,
            mimeType: 'application/pdf',
            source: 'DIGILOCKER',
            sourceReference: 'in.gov.tn.school:2026-881',
            issuer: 'School Education Department',
            retrievedAt: new Date(Date.now() - 3 * 3600000),
            verificationStatus: 'NOT_REVIEWED',
            uploadedAt: new Date(Date.now() - 3 * 3600000)
        });
        // 2. College Bonafide Study Certificate
        await ApplicationDocument_1.ApplicationDocument.create({
            applicationId: appA._id,
            citizenId: citizen._id,
            docType: 'CollegeStudyCertificate',
            documentName: { en: 'College Bonafide Study Certificate', ta: 'கல்லூரி படிப்புச் சான்றிதழ்' },
            fileName: 'college_bonafide_kavitha.svg',
            fileUrl: '/mock-documents/college_bonafide_kavitha.svg',
            fileSize: 9300,
            mimeType: 'image/svg+xml',
            source: 'MANUAL_UPLOAD',
            issuer: 'Meenakshi Government Arts College for Women (Autonomous)',
            verificationStatus: 'NOT_REVIEWED',
            uploadedAt: new Date(Date.now() - 3 * 3600000)
        });
        // 3. Bank Passbook (DBT Linked)
        await ApplicationDocument_1.ApplicationDocument.create({
            applicationId: appA._id,
            citizenId: citizen._id,
            docType: 'BankPassbook',
            documentName: { en: 'Bank Passbook (DBT Account)', ta: 'வங்கி கணக்குப் புத்தகம்' },
            fileName: 'bank_passbook_kavitha.svg',
            fileUrl: '/mock-documents/bank_passbook_kavitha.svg',
            fileSize: 8136,
            mimeType: 'image/svg+xml',
            source: 'MANUAL_UPLOAD',
            issuer: 'State Bank of India',
            verificationStatus: 'NOT_REVIEWED',
            uploadedAt: new Date(Date.now() - 3 * 3600000)
        });
        // 4. Aadhaar Card
        await ApplicationDocument_1.ApplicationDocument.create({
            applicationId: appA._id,
            citizenId: citizen._id,
            docType: 'AadhaarCard',
            documentName: { en: 'Aadhaar Card Copy', ta: 'ஆதார் அட்டை நகல்' },
            fileName: 'aadhaar_card_kavitha.svg',
            fileUrl: '/mock-documents/aadhaar_card_kavitha.svg',
            fileSize: 6536,
            mimeType: 'image/svg+xml',
            source: 'DIGILOCKER',
            issuer: 'UIDAI',
            verificationStatus: 'NOT_REVIEWED',
            uploadedAt: new Date(Date.now() - 3 * 3600000)
        });
        // 5. Income Certificate
        await ApplicationDocument_1.ApplicationDocument.create({
            applicationId: appA._id,
            citizenId: citizen._id,
            docType: 'IncomeCertificate',
            documentName: { en: 'Income Certificate', ta: 'வருமான சான்றிதழ்' },
            fileName: 'income_certificate_kavitha.svg',
            fileUrl: '/mock-documents/income_certificate_kavitha.svg',
            fileSize: 11551,
            mimeType: 'image/svg+xml',
            source: 'DIGILOCKER',
            issuer: 'Revenue Department',
            verificationStatus: 'NOT_REVIEWED',
            uploadedAt: new Date(Date.now() - 3 * 3600000)
        });
        // SCENARIO B — Correction Required
        const appB = await Application_1.Application.create({
            applicationNo: 'TNP-WP-2026-00102',
            applicationReference: 'TNP-WP-2026-00102',
            citizenId: citizen._id,
            schemeId: kmutScheme._id,
            district: 'Madurai',
            assignedOfficerId: officer._id,
            assignedAt: new Date(Date.now() - 4 * 86400000),
            status: Application_1.ApplicationStatus.CORRECTION_REQUIRED,
            currentStep: 2,
            completionPercentage: 45,
            officerRemarks: 'Smart Ration Card scan is blurry. Please upload a clear photo or fetch from DigiLocker.',
            correctionCount: 1,
            formData: {
                applicantName: 'Kavitha R',
                mobile: '9876543212',
                district: 'Madurai',
                annualIncome: 140000,
                gender: 'Female',
                age: 21
            },
            submittedAt: new Date(Date.now() - 5 * 86400000)
        });
        await ApplicationDocument_1.ApplicationDocument.create({
            applicationId: appB._id,
            citizenId: citizen._id,
            docType: 'SmartRationCard',
            documentName: { en: 'Family Smart Ration Card', ta: 'குடும்ப ரேஷன் கார்டு' },
            fileName: 'smart_ration_card_kavitha.svg',
            fileUrl: '/mock-documents/smart_ration_card_kavitha.svg',
            fileSize: 8571,
            mimeType: 'image/svg+xml',
            source: 'MANUAL_UPLOAD',
            verificationStatus: 'CORRECTION_REQUIRED',
            correctionReason: 'Image too blurry to read family member details',
            officerRemarks: 'Smart Ration Card scan is blurry. Please upload a clear photo or fetch from DigiLocker.',
            correctionRequestedAt: new Date(Date.now() - 1 * 86400000),
            correctionRequestedBy: officer._id,
            uploadedAt: new Date(Date.now() - 5 * 86400000)
        });
        await ApplicationDocument_1.ApplicationDocument.create({
            applicationId: appB._id,
            citizenId: citizen._id,
            docType: 'BankPassbook',
            documentName: { en: 'Bank Passbook (DBT Account)', ta: 'வங்கி கணக்குப் புத்தகம்' },
            fileName: 'bank_passbook_kavitha.svg',
            fileUrl: '/mock-documents/bank_passbook_kavitha.svg',
            fileSize: 8136,
            mimeType: 'image/svg+xml',
            source: 'MANUAL_UPLOAD',
            issuer: 'State Bank of India',
            verificationStatus: 'NOT_REVIEWED',
            uploadedAt: new Date(Date.now() - 5 * 86400000)
        });
        // SCENARIO C — Under Review
        const appC = await Application_1.Application.create({
            applicationNo: 'TNP-WP-2026-00103',
            applicationReference: 'TNP-WP-2026-00103',
            citizenId: citizen._id,
            schemeId: scholarshipScheme._id,
            district: 'Madurai',
            assignedOfficerId: officer._id,
            assignedAt: new Date(Date.now() - 6 * 86400000),
            verificationStartedAt: new Date(Date.now() - 1 * 86400000),
            status: Application_1.ApplicationStatus.UNDER_REVIEW,
            currentStep: 3,
            completionPercentage: 70,
            formData: {
                applicantName: 'Kavitha R',
                mobile: '9876543212',
                district: 'Madurai',
                annualIncome: 140000,
                gender: 'Female',
                age: 21
            },
            submittedAt: new Date(Date.now() - 7 * 86400000)
        });
        await ApplicationDocument_1.ApplicationDocument.create({
            applicationId: appC._id,
            citizenId: citizen._id,
            docType: 'CommunityCertificate',
            documentName: { en: 'Community Certificate', ta: 'சாதி சான்றிதழ்' },
            fileName: 'community_certificate_kavitha.svg',
            fileUrl: '/mock-documents/community_certificate_kavitha.svg',
            fileSize: 9099,
            mimeType: 'image/svg+xml',
            source: 'DIGILOCKER',
            sourceReference: 'in.gov.tn.edistrict.comm:2026-992',
            issuer: 'Revenue Department',
            retrievedAt: new Date(Date.now() - 7 * 86400000),
            verificationStatus: 'VERIFIED',
            verifiedAt: new Date(Date.now() - 1 * 86400000),
            verifiedBy: officer._id,
            officerRemarks: 'Community Certificate verified via e-District database.',
            uploadedAt: new Date(Date.now() - 7 * 86400000)
        });
        await ApplicationDocument_1.ApplicationDocument.create({
            applicationId: appC._id,
            citizenId: citizen._id,
            docType: 'IncomeCertificate',
            documentName: { en: 'Income Certificate', ta: 'வருமான சான்றிதழ்' },
            fileName: 'income_certificate_kavitha.svg',
            fileUrl: '/mock-documents/income_certificate_kavitha.svg',
            fileSize: 11551,
            mimeType: 'image/svg+xml',
            source: 'DIGILOCKER',
            issuer: 'Revenue Department',
            verificationStatus: 'NOT_REVIEWED',
            uploadedAt: new Date(Date.now() - 7 * 86400000)
        });
        // SCENARIO D — Approved & Benefit Released
        const appD = await Application_1.Application.create({
            applicationNo: 'TNP-WP-2026-00104',
            applicationReference: 'TNP-WP-2026-00104',
            citizenId: citizen._id,
            schemeId: oldAgeScheme._id,
            district: 'Madurai',
            assignedOfficerId: officer._id,
            assignedAt: new Date(Date.now() - 10 * 86400000),
            verificationStartedAt: new Date(Date.now() - 3 * 86400000),
            status: Application_1.ApplicationStatus.APPROVED,
            currentStep: 5,
            completionPercentage: 100,
            approvedBy: officer._id,
            approvedAt: new Date(Date.now() - 1 * 86400000),
            officerRemarks: 'Application fully verified and approved for monthly pension grant.',
            formData: {
                applicantName: 'Kavitha R',
                mobile: '9876543212',
                district: 'Madurai',
                annualIncome: 140000,
                gender: 'Female',
                age: 21
            },
            submittedAt: new Date(Date.now() - 10 * 86400000)
        });
        await ApplicationDocument_1.ApplicationDocument.create({
            applicationId: appD._id,
            citizenId: citizen._id,
            docType: 'AgeProof',
            documentName: { en: 'Age Proof Document', ta: 'வயதுச் சான்று' },
            fileName: 'aadhaar_card_kavitha.svg',
            fileUrl: '/mock-documents/aadhaar_card_kavitha.svg',
            fileSize: 6536,
            mimeType: 'image/svg+xml',
            source: 'DIGILOCKER',
            issuer: 'UIDAI / Revenue Dept',
            verificationStatus: 'VERIFIED',
            verifiedAt: new Date(Date.now() - 2 * 86400000),
            verifiedBy: officer._id,
            uploadedAt: new Date(Date.now() - 10 * 86400000)
        });
        await ApplicationDocument_1.ApplicationDocument.create({
            applicationId: appD._id,
            citizenId: citizen._id,
            docType: 'IncomeCertificate',
            documentName: { en: 'Income Certificate', ta: 'வருமான சான்றிதழ்' },
            fileName: 'income_certificate_kavitha.svg',
            fileUrl: '/mock-documents/income_certificate_kavitha.svg',
            fileSize: 11551,
            mimeType: 'image/svg+xml',
            source: 'DIGILOCKER',
            issuer: 'Revenue Department',
            verificationStatus: 'VERIFIED',
            verifiedAt: new Date(Date.now() - 2 * 86400000),
            verifiedBy: officer._id,
            uploadedAt: new Date(Date.now() - 10 * 86400000)
        });
        await ApplicationDocument_1.ApplicationDocument.create({
            applicationId: appD._id,
            citizenId: citizen._id,
            docType: 'NativityCertificate',
            documentName: { en: 'Nativity & Residence Certificate', ta: 'இருப்பிடச் சான்றிதழ்' },
            fileName: 'nativity_certificate_kavitha.svg',
            fileUrl: '/mock-documents/nativity_certificate_kavitha.svg',
            fileSize: 9211,
            mimeType: 'image/svg+xml',
            source: 'DIGILOCKER',
            issuer: 'Revenue Department',
            verificationStatus: 'VERIFIED',
            verifiedAt: new Date(Date.now() - 2 * 86400000),
            verifiedBy: officer._id,
            uploadedAt: new Date(Date.now() - 10 * 86400000)
        });
        await BenefitRecord_1.BenefitRecord.create({
            applicationId: appD._id,
            citizenId: citizen._id,
            schemeId: oldAgeScheme._id,
            disbursementAmount: 1200,
            disbursementFrequency: 'Monthly',
            releaseDate: new Date(Date.now() - 1 * 86400000),
            status: 'ACTIVE',
            nextRenewalDate: new Date(Date.now() + 365 * 86400000),
            benefitReferenceNo: 'TN-BEN-981245',
            notes: 'Benefit approved and released under Indira Gandhi Old Age Pension Scheme.'
        });
        // Seed Additional Realistic Citizens & Applications for Authentic District Analytics
        const moreCitizensData = [
            { name: 'Muthukumar S', email: 'muthu.s@gmail.com', mobile: '9876543220', district: 'Madurai' },
            { name: 'Meenakshi A', email: 'meenakshi.a@gmail.com', mobile: '9876543221', district: 'Madurai' },
            { name: 'Karthik V', email: 'karthik.v@gmail.com', mobile: '9876543222', district: 'Madurai' },
            { name: 'Priya S', email: 'priya.s@gmail.com', mobile: '9876543223', district: 'Madurai' },
            { name: 'Anbuchelvan K', email: 'anbu.k@gmail.com', mobile: '9876543224', district: 'Madurai' },
            { name: 'Lakshmi N', email: 'lakshmi.n@gmail.com', mobile: '9876543225', district: 'Madurai' },
            { name: 'Murugan P', email: 'murugan.p@gmail.com', mobile: '9876543226', district: 'Chennai' }
        ];
        const seededMoreCitizens = [];
        for (const cData of moreCitizensData) {
            let existing = await User_1.User.findOne({ email: cData.email });
            if (!existing) {
                existing = await User_1.User.create({
                    ...cData,
                    passwordHash: citizenPasswordHash,
                    role: User_1.UserRole.CITIZEN,
                    languagePreference: 'ta'
                });
            }
            seededMoreCitizens.push(existing);
        }
        const cmHealthScheme = seededSchemes.find(s => s.domainKey === 'health') || pudhumaiScheme;
        const diffAbledScheme = seededSchemes.find(s => s.domainKey === 'differently_abled') || pudhumaiScheme;
        const housingScheme = seededSchemes.find(s => s.domainKey === 'housing') || pudhumaiScheme;
        // Delete existing extended demo applications and their documents
        const extendedRefs = [
            'TNP-WP-2026-00105', 'TNP-WP-2026-00106', 'TNP-WP-2026-00107', 'TNP-WP-2026-00108',
            'TNP-WP-2026-00109', 'TNP-WP-2026-00110', 'TNP-WP-2026-00111', 'TNP-WP-2026-00112',
            'TNP-WP-2026-00113', 'TNP-WP-2026-00114', 'TNP-WP-2026-00115', 'TNP-WP-2026-00116',
            'TNP-WP-2026-00117', 'TNP-WP-2026-00118', 'TNP-WP-2026-00119', 'TNP-WP-2026-00120',
            'TNP-WP-2026-00121', 'TNP-WP-2026-00122', 'TNP-WP-2026-00123', 'TNP-WP-2026-00124',
            'TNP-WP-2026-00125', 'TNP-WP-2026-00126'
        ];
        const prevApps = await Application_1.Application.find({ applicationReference: { $in: extendedRefs } });
        if (prevApps.length > 0) {
            await ApplicationDocument_1.ApplicationDocument.deleteMany({ applicationId: { $in: prevApps.map((a) => a._id) } });
        }
        await Application_1.Application.deleteMany({ applicationReference: { $in: extendedRefs } });
        const extendedApps = [
            // 0-3 Days Pending
            {
                ref: 'TNP-WP-2026-00105',
                citizen: seededMoreCitizens[0],
                scheme: pudhumaiScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.SUBMITTED,
                subDays: 2,
                assignedOfficer: officer._id
            },
            {
                ref: 'TNP-WP-2026-00106',
                citizen: seededMoreCitizens[1],
                scheme: kmutScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.SUBMITTED,
                subDays: 1,
                assignedOfficer: officer._id
            },
            // 4-7 Days Pending
            {
                ref: 'TNP-WP-2026-00107',
                citizen: seededMoreCitizens[2],
                scheme: scholarshipScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.DOC_VERIFICATION,
                subDays: 5,
                assignedOfficer: officer._id
            },
            {
                ref: 'TNP-WP-2026-00108',
                citizen: seededMoreCitizens[3],
                scheme: oldAgeScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.UNDER_REVIEW,
                subDays: 6,
                verifDays: 2,
                assignedOfficer: officer._id
            },
            // 8-15 Days Pending
            {
                ref: 'TNP-WP-2026-00109',
                citizen: seededMoreCitizens[4],
                scheme: cmHealthScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.UNDER_REVIEW,
                subDays: 10,
                verifDays: 4,
                assignedOfficer: officer._id
            },
            {
                ref: 'TNP-WP-2026-00110',
                citizen: seededMoreCitizens[5],
                scheme: diffAbledScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.RESUBMITTED,
                subDays: 12,
                correctionCount: 1,
                officerRemarks: 'Disability certificate resubmitted with clear doctor signature.',
                assignedOfficer: officer._id
            },
            {
                ref: 'TNP-WP-2026-00111',
                citizen: seededMoreCitizens[0],
                scheme: pudhumaiScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.CORRECTION_REQUIRED,
                subDays: 14,
                correctionCount: 1,
                officerRemarks: 'Bonafide certificate page 2 signature missing. Please resubmit.',
                assignedOfficer: officer._id
            },
            // 16-30 Days Pending
            {
                ref: 'TNP-WP-2026-00112',
                citizen: seededMoreCitizens[1],
                scheme: kmutScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.UNDER_REVIEW,
                subDays: 20,
                verifDays: 6,
                assignedOfficer: officer._id
            },
            {
                ref: 'TNP-WP-2026-00113',
                citizen: seededMoreCitizens[2],
                scheme: housingScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.CORRECTION_REQUIRED,
                subDays: 25,
                correctionCount: 1,
                officerRemarks: 'Patta survey number clarification required from Tahsildar.',
                assignedOfficer: officer._id
            },
            // > 30 Days Pending (Critical Backlog)
            {
                ref: 'TNP-WP-2026-00114',
                citizen: seededMoreCitizens[3],
                scheme: oldAgeScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.SUBMITTED,
                subDays: 35,
                assignedOfficer: officer._id
            },
            {
                ref: 'TNP-WP-2026-00115',
                citizen: seededMoreCitizens[4],
                scheme: scholarshipScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.UNDER_REVIEW,
                subDays: 42,
                verifDays: 10,
                assignedOfficer: officer._id
            },
            // Completed - APPROVED with authentic turnaround times
            {
                ref: 'TNP-WP-2026-00116',
                citizen: seededMoreCitizens[5],
                scheme: pudhumaiScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.APPROVED,
                subDays: 18,
                verifDays: 16,
                apprDays: 15,
                remarks: 'Direct benefit transfer order released.',
                assignedOfficer: officer._id
            },
            {
                ref: 'TNP-WP-2026-00117',
                citizen: seededMoreCitizens[0],
                scheme: kmutScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.APPROVED,
                subDays: 22,
                verifDays: 20,
                apprDays: 19,
                remarks: 'Ration card & bank passbook verified.',
                assignedOfficer: officer._id
            },
            {
                ref: 'TNP-WP-2026-00118',
                citizen: seededMoreCitizens[1],
                scheme: cmHealthScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.APPROVED,
                subDays: 15,
                verifDays: 13,
                apprDays: 12,
                remarks: 'UHP card linked successfully.',
                assignedOfficer: officer._id
            },
            {
                ref: 'TNP-WP-2026-00119',
                citizen: seededMoreCitizens[2],
                scheme: diffAbledScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.APPROVED,
                subDays: 28,
                verifDays: 25,
                apprDays: 23,
                remarks: 'Medical board verification verified.',
                assignedOfficer: officer._id
            },
            {
                ref: 'TNP-WP-2026-00120',
                citizen: seededMoreCitizens[3],
                scheme: oldAgeScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.APPROVED,
                subDays: 8,
                verifDays: 6,
                apprDays: 4,
                remarks: 'Pension sanctioned under Indira Gandhi scheme.',
                assignedOfficer: officer._id
            },
            {
                ref: 'TNP-WP-2026-00123',
                citizen: seededMoreCitizens[4],
                scheme: kmutScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.APPROVED,
                subDays: 4,
                verifDays: 2,
                apprDays: 1,
                remarks: 'Aadhaar authenticated via DigiLocker.',
                assignedOfficer: officer._id
            },
            {
                ref: 'TNP-WP-2026-00124',
                citizen: seededMoreCitizens[5],
                scheme: pudhumaiScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.APPROVED,
                subDays: 3,
                verifDays: 2,
                apprDays: 0.5,
                remarks: 'Government school certificate verified.',
                assignedOfficer: officer._id
            },
            // Completed - REJECTED with specific statutory reasons
            {
                ref: 'TNP-WP-2026-00121',
                citizen: seededMoreCitizens[0],
                scheme: scholarshipScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.REJECTED,
                subDays: 16,
                verifDays: 14,
                rejcDays: 12,
                remarks: 'Family annual income ₹3,80,000 exceeds statutory eligibility ceiling of ₹2,50,000.',
                assignedOfficer: officer._id
            },
            {
                ref: 'TNP-WP-2026-00122',
                citizen: seededMoreCitizens[1],
                scheme: pudhumaiScheme,
                district: 'Madurai',
                status: Application_1.ApplicationStatus.REJECTED,
                subDays: 24,
                verifDays: 21,
                rejcDays: 20,
                remarks: 'Applicant studied in private matriculation school; ineligible under TN Govt school mandate.',
                assignedOfficer: officer._id
            },
            // District Scoping Validation Records (Chennai District)
            {
                ref: 'TNP-WP-2026-00125',
                citizen: seededMoreCitizens[6],
                scheme: pudhumaiScheme,
                district: 'Chennai',
                status: Application_1.ApplicationStatus.APPROVED,
                subDays: 5,
                verifDays: 3,
                apprDays: 2,
                remarks: 'Approved in Chennai jurisdiction.',
                assignedOfficer: admin._id
            },
            {
                ref: 'TNP-WP-2026-00126',
                citizen: seededMoreCitizens[6],
                scheme: kmutScheme,
                district: 'Chennai',
                status: Application_1.ApplicationStatus.SUBMITTED,
                subDays: 2,
                assignedOfficer: admin._id
            }
        ];
        for (const item of extendedApps) {
            const subDate = new Date(Date.now() - item.subDays * 86400000);
            const verifDate = item.verifDays ? new Date(Date.now() - item.verifDays * 86400000) : undefined;
            const apprDate = item.apprDays ? new Date(Date.now() - item.apprDays * 86400000) : undefined;
            const rejcDate = item.rejcDays ? new Date(Date.now() - item.rejcDays * 86400000) : undefined;
            const history = [
                {
                    previousStatus: 'DRAFT',
                    newStatus: Application_1.ApplicationStatus.SUBMITTED,
                    changedBy: item.citizen._id,
                    changedByRole: 'Citizen',
                    remarks: 'Application submitted by citizen',
                    timestamp: subDate
                }
            ];
            if (verifDate) {
                history.push({
                    previousStatus: Application_1.ApplicationStatus.SUBMITTED,
                    newStatus: Application_1.ApplicationStatus.UNDER_REVIEW,
                    changedBy: item.assignedOfficer,
                    changedByRole: 'Officer',
                    remarks: 'Officer initiated document audit',
                    timestamp: verifDate
                });
            }
            if (apprDate) {
                history.push({
                    previousStatus: Application_1.ApplicationStatus.UNDER_REVIEW,
                    newStatus: Application_1.ApplicationStatus.APPROVED,
                    changedBy: item.assignedOfficer,
                    changedByRole: 'Officer',
                    remarks: item.remarks || 'Application approved',
                    timestamp: apprDate
                });
            }
            else if (rejcDate) {
                history.push({
                    previousStatus: Application_1.ApplicationStatus.UNDER_REVIEW,
                    newStatus: Application_1.ApplicationStatus.REJECTED,
                    changedBy: item.assignedOfficer,
                    changedByRole: 'Officer',
                    remarks: item.remarks || 'Application rejected',
                    timestamp: rejcDate
                });
            }
            const createdApp = await Application_1.Application.create({
                applicationNo: item.ref,
                applicationReference: item.ref,
                citizenId: item.citizen._id,
                schemeId: item.scheme._id,
                district: item.district,
                assignedOfficerId: item.assignedOfficer,
                assignedAt: subDate,
                verificationStartedAt: verifDate,
                status: item.status,
                currentStep: item.status === Application_1.ApplicationStatus.APPROVED ? 5 : item.status === Application_1.ApplicationStatus.UNDER_REVIEW ? 3 : 1,
                completionPercentage: item.status === Application_1.ApplicationStatus.APPROVED ? 100 : item.status === Application_1.ApplicationStatus.UNDER_REVIEW ? 60 : 25,
                correctionCount: item.correctionCount || 0,
                officerRemarks: item.remarks || '',
                approvedBy: apprDate ? item.assignedOfficer : undefined,
                approvedAt: apprDate,
                rejectedBy: rejcDate ? item.assignedOfficer : undefined,
                rejectedAt: rejcDate,
                formData: {
                    applicantName: item.citizen.name,
                    mobile: item.citizen.mobile,
                    district: item.district,
                    annualIncome: 140000,
                    gender: 'Female'
                },
                submittedAt: subDate,
                statusHistory: history
            });
            // Attach realistic mock documents corresponding to scheme
            const mockDocCatalog = {
                GovtSchoolStudyCertificate: {
                    fileName: 'study_certificate_kavitha.pdf',
                    fileUrl: '/mock-documents/study_certificate_kavitha.pdf',
                    fileSize: 7336,
                    mimeType: 'application/pdf'
                },
                CollegeStudyCertificate: {
                    fileName: 'college_bonafide_kavitha.svg',
                    fileUrl: '/mock-documents/college_bonafide_kavitha.svg',
                    fileSize: 9300,
                    mimeType: 'image/svg+xml'
                },
                BankPassbook: {
                    fileName: 'bank_passbook_kavitha.svg',
                    fileUrl: '/mock-documents/bank_passbook_kavitha.svg',
                    fileSize: 8136,
                    mimeType: 'image/svg+xml'
                },
                AadhaarCard: {
                    fileName: 'aadhaar_card_kavitha.svg',
                    fileUrl: '/mock-documents/aadhaar_card_kavitha.svg',
                    fileSize: 6536,
                    mimeType: 'image/svg+xml'
                },
                IncomeCertificate: {
                    fileName: 'income_certificate_kavitha.svg',
                    fileUrl: '/mock-documents/income_certificate_kavitha.svg',
                    fileSize: 11551,
                    mimeType: 'image/svg+xml'
                },
                SmartRationCard: {
                    fileName: 'smart_ration_card_kavitha.svg',
                    fileUrl: '/mock-documents/smart_ration_card_kavitha.svg',
                    fileSize: 8571,
                    mimeType: 'image/svg+xml'
                },
                CommunityCertificate: {
                    fileName: 'community_certificate_kavitha.svg',
                    fileUrl: '/mock-documents/community_certificate_kavitha.svg',
                    fileSize: 9099,
                    mimeType: 'image/svg+xml'
                },
                NativityCertificate: {
                    fileName: 'nativity_certificate_kavitha.svg',
                    fileUrl: '/mock-documents/nativity_certificate_kavitha.svg',
                    fileSize: 9211,
                    mimeType: 'image/svg+xml'
                },
                AgeProof: {
                    fileName: 'aadhaar_card_kavitha.svg',
                    fileUrl: '/mock-documents/aadhaar_card_kavitha.svg',
                    fileSize: 6536,
                    mimeType: 'image/svg+xml'
                },
                HouseSitePatta: {
                    fileName: 'nativity_certificate_kavitha.svg',
                    fileUrl: '/mock-documents/nativity_certificate_kavitha.svg',
                    fileSize: 9211,
                    mimeType: 'image/svg+xml'
                },
                DisabilityCertificate: {
                    fileName: 'study_certificate_kavitha.pdf',
                    fileUrl: '/mock-documents/study_certificate_kavitha.pdf',
                    fileSize: 7336,
                    mimeType: 'application/pdf'
                }
            };
            const docsToSeed = item.scheme?.requiredDocuments && item.scheme.requiredDocuments.length > 0
                ? item.scheme.requiredDocuments
                : [
                    { docType: 'AadhaarCard', label: { en: 'Aadhaar Card', ta: 'ஆதார் அட்டை' } },
                    { docType: 'IncomeCertificate', label: { en: 'Income Certificate', ta: 'வருமான சான்றிதழ்' } }
                ];
            for (let dIdx = 0; dIdx < docsToSeed.length; dIdx++) {
                const reqDoc = docsToSeed[dIdx];
                const template = mockDocCatalog[reqDoc.docType] || {
                    fileName: 'income_certificate_kavitha.svg',
                    fileUrl: '/mock-documents/income_certificate_kavitha.svg',
                    fileSize: 11551,
                    mimeType: 'image/svg+xml'
                };
                let verStatus = 'NOT_REVIEWED';
                let verDate = undefined;
                let verBy = undefined;
                let corrReason = undefined;
                let offRem = '';
                if (item.status === Application_1.ApplicationStatus.APPROVED) {
                    verStatus = 'VERIFIED';
                    verDate = apprDate || subDate;
                    verBy = item.assignedOfficer;
                    offRem = 'Statutory criteria verified and approved.';
                }
                else if (item.status === Application_1.ApplicationStatus.CORRECTION_REQUIRED && dIdx === 0) {
                    verStatus = 'CORRECTION_REQUIRED';
                    corrReason = item.remarks || 'Document scan unclear or needs rectification.';
                    offRem = item.remarks || 'Document correction requested.';
                }
                await ApplicationDocument_1.ApplicationDocument.create({
                    applicationId: createdApp._id,
                    citizenId: item.citizen._id,
                    docType: reqDoc.docType,
                    documentName: reqDoc.label || { en: reqDoc.docType, ta: reqDoc.docType },
                    fileName: template.fileName,
                    fileUrl: template.fileUrl,
                    fileSize: template.fileSize,
                    mimeType: template.mimeType,
                    source: dIdx % 2 === 0 ? 'DIGILOCKER' : 'MANUAL_UPLOAD',
                    issuer: dIdx % 2 === 0 ? 'e-District TN / DigiLocker' : 'Authorized Issuing Authority',
                    verificationStatus: verStatus,
                    verifiedAt: verDate,
                    verifiedBy: verBy,
                    correctionReason: corrReason,
                    officerRemarks: offRem,
                    uploadedAt: subDate
                });
            }
        }
        console.log(`✅ Seeded Demo System Users, Scenarios A-D & 22 Historical Application Records for Madurai & Chennai.`);
        console.log(`   - Admin: admin@tnwelfare.gov.in / Admin@123`);
        console.log(`   - Officer: officer@tnwelfare.gov.in / Officer@123`);
        console.log(`   - Citizen: citizen@gmail.com / Citizen@123`);
    }
    catch (error) {
        console.error('[Seed Error]:', error);
    }
};
exports.seedDatabase = seedDatabase;
