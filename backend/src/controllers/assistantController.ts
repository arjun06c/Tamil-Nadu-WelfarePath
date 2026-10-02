import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { CitizenProfile } from '../models/CitizenProfile';
import { Scheme } from '../models/Scheme';
import { Application } from '../models/Application';
import { evaluateSchemeEligibility } from '../services/eligibilityService';

export const handleAssistantChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message, lang = 'en' } = req.body;
    const isTa = lang === 'ta' || /[அ-ஹ]/.test(message || '');

    let responseText = '';
    const actionButtons: Array<{ label: string; path: string }> = [];

    // Optional citizen context
    let profile = null;
    let userApplications: any[] = [];

    if (req.user) {
      profile = await CitizenProfile.findOne({ userId: req.user.id });
      userApplications = await Application.find({ citizenId: req.user.id }).populate('schemeId');
    }

    const queryLower = (message || '').toLowerCase();

    // Intent 1: Check Scheme Eligibility / What am I eligible for?
    if (queryLower.includes('eligible') || queryLower.includes('தகுதி') || queryLower.includes('வாய்ப்பு')) {
      if (!profile) {
        responseText = isTa
          ? 'உங்கள் தகுதியைக் கண்டறிய முதலில் உங்கள் சுயவிவரத்தைப் (Profile) பூர்த்தி செய்யவும்.'
          : 'To evaluate your exact eligibility, please build your citizen profile first.';
        actionButtons.push({
          label: isTa ? 'சுயவிவரத்தை நிரப்பவும்' : 'Complete Profile',
          path: '/profile'
        });
      } else {
        const activeSchemes = await Scheme.find({ isActive: true });
        const eligibleList: string[] = [];
        const nearEligibleList: string[] = [];

        for (const scheme of activeSchemes) {
          const outcome = evaluateSchemeEligibility(scheme, profile);
          const schemeTitle = isTa ? scheme.name.ta : scheme.name.en;

          if (outcome.status === 'ELIGIBLE') {
            eligibleList.push(schemeTitle);
          } else if (outcome.status === 'NEAR_ELIGIBLE') {
            nearEligibleList.push(schemeTitle);
          }
        }

        if (isTa) {
          responseText = `உங்கள் சுயவிவரத்தின்படி:\n`;
          if (eligibleList.length > 0) {
            responseText += `✅ முழு தகுதியுள்ள திட்டங்கள் (${eligibleList.length}): ${eligibleList.slice(0, 3).join(', ')}\n`;
          }
          if (nearEligibleList.length > 0) {
            responseText += `⚠️ விடுபட்ட சான்றிதழ் சமர்ப்பித்தால் தகுதி பெறக்கூடியவை (${nearEligibleList.length}): ${nearEligibleList.slice(0, 3).join(', ')}`;
          }
        } else {
          responseText = `Based on your profile:\n`;
          if (eligibleList.length > 0) {
            responseText += `✅ Fully Eligible Schemes (${eligibleList.length}): ${eligibleList.slice(0, 3).join(', ')}\n`;
          }
          if (nearEligibleList.length > 0) {
            responseText += `⚠️ Near Eligible Schemes (${nearEligibleList.length}): ${nearEligibleList.slice(0, 3).join(', ')}`;
          }
        }

        actionButtons.push({
          label: isTa ? 'டாஷ்போர்டைப் பார்க்கவும்' : 'View Welfare Dashboard',
          path: '/dashboard'
        });
      }
    }
    // Intent 2: Application Tracking / Status
    else if (queryLower.includes('status') || queryLower.includes('track') || queryLower.includes('நிலை') || queryLower.includes('விண்ணப்பம்')) {
      if (userApplications.length === 0) {
        responseText = isTa
          ? 'நீங்கள் இதுவரை எந்த நலத்திட்டத்திற்கும் விண்ணப்பிக்கவில்லை. புதிய திட்டங்களைக் கண்டறிந்து விண்ணப்பிக்கலாம்.'
          : 'You have not submitted any applications yet. Explore available schemes and apply today!';
        actionButtons.push({
          label: isTa ? 'திட்டங்களைக் காண்க' : 'Explore Schemes',
          path: '/schemes'
        });
      } else {
        const latestApp = userApplications[0];
        const schemeTitle = isTa ? latestApp.schemeId?.name?.ta : latestApp.schemeId?.name?.en;
        responseText = isTa
          ? `உங்கள் சமீபத்திய விண்ணப்பம் #${latestApp.applicationNo} (${schemeTitle}) தற்போது "${latestApp.status}" நிலையில் உள்ளது.`
          : `Your recent application #${latestApp.applicationNo} (${schemeTitle}) is currently in state "${latestApp.status}".`;

        actionButtons.push({
          label: isTa ? 'விண்ணப்பத்தைக் கண்காணிக்க' : 'Track Application',
          path: `/applications/${latestApp._id}`
        });
      }
    }
    // Intent 3: Documents / Certificate assistance
    else if (queryLower.includes('document') || queryLower.includes('certificate') || queryLower.includes('சான்றிதழ்') || queryLower.includes('ஆவணம்')) {
      responseText = isTa
        ? 'தமிழ்நாடு நலத்திட்டங்களுக்கு பொதுவாக தேவைப்படும் சான்றிதழ்கள்:\n1. ஆதார் அட்டை\n2. வருமான சான்றிதழ்\n3. சாதி சான்றிதழ் / சமூக சான்றிதழ்\n4. வங்கி கணக்கு புத்தகம்\n\nஎங்கள் OCR கருவி மூலம் ஆவணங்களைப் பதிவேற்றி தானாக படிவத்தை பூர்த்தி செய்ய முடியும்!'
        : 'Commonly required documents for TN welfare schemes:\n1. Aadhaar Card\n2. Income Certificate\n3. Community Certificate\n4. Bank Passbook\n\nYou can upload documents with our OCR tool for instant text extraction and form pre-fill!';
      actionButtons.push({
        label: isTa ? 'திட்டங்களைக் காண்க' : 'Explore Schemes',
        path: '/schemes'
      });
    }
    // Intent 4: General Greeting & Default Help
    else {
      responseText = isTa
        ? 'வணக்கம்! நான் உங்கள் தமிழ்நாடு நலன்பாதை உதவியாளன். தகுதி சரிபார்ப்பு, விண்ணப்பங்களின் நிலை, மற்றும் தேவைப்படும் சான்றிதழ்கள் குறித்து என்னிடம் கேட்கலாம்.'
        : 'Hello! I am your Tamil Nadu WelfarePath Assistant. You can ask me about scheme eligibility, application status, required documents, or renewal deadlines!';
      actionButtons.push(
        { label: isTa ? 'திட்டங்கள்' : 'Discover Schemes', path: '/schemes' },
        { label: isTa ? 'என் டாஷ்போர்டு' : 'My Dashboard', path: '/dashboard' }
      );
    }

    res.status(200).json({
      reply: responseText,
      actionButtons,
      lang: isTa ? 'ta' : 'en'
    });
  } catch (error) {
    console.error('handleAssistantChat error:', error);
    res.status(500).json({ message: 'Error processing assistant prompt' });
  }
};
