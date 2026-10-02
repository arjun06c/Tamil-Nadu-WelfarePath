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
const seedDatabase = async () => {
    try {
        console.log('[Seed] Seeding Tamil Nadu WelfarePath Master Data...');
        // Clear previous domains & schemes
        await WelfareDomain_1.WelfareDomain.deleteMany({});
        await Scheme_1.Scheme.deleteMany({});
        // Seed Domains
        await WelfareDomain_1.WelfareDomain.insertMany(domainsData);
        console.log(`✅ Seeded ${domainsData.length} Welfare Domains.`);
        // Seed Schemes
        await Scheme_1.Scheme.insertMany(schemesData);
        console.log(`✅ Seeded ${schemesData.length} Verified Tamil Nadu Welfare Schemes.`);
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
            district: 'Coimbatore',
            languagePreference: 'en'
        });
        // Seed Citizen Profile for Demo
        await CitizenProfile_1.CitizenProfile.deleteMany({ userId: citizen._id });
        await CitizenProfile_1.CitizenProfile.create({
            userId: citizen._id,
            dob: new Date('2003-05-15'),
            gender: 'Female',
            district: 'Coimbatore',
            taluk: 'Coimbatore South',
            villageTown: 'Peelamedu',
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
        console.log(`✅ Seeded Demo System Users:`);
        console.log(`   - Admin: admin@tnwelfare.gov.in / Admin@123`);
        console.log(`   - Officer: officer@tnwelfare.gov.in / Officer@123`);
        console.log(`   - Citizen: citizen@gmail.com / Citizen@123`);
    }
    catch (error) {
        console.error('[Seed Error]:', error);
    }
};
exports.seedDatabase = seedDatabase;
