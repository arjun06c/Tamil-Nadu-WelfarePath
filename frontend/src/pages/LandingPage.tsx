import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SchemeCard } from '../components/SchemeCard';
import {
  Award,
  GraduationCap,
  Heart,
  ShieldAlert,
  Accessibility,
  Sprout,
  Activity,
  Briefcase,
  TrendingUp,
  Home,
  HardHat,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Zap,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

const domainIconMap: Record<string, any> = {
  education: GraduationCap,
  women_child: Heart,
  social_security: ShieldAlert,
  differently_abled: Accessibility,
  agriculture: Sprout,
  health: Activity,
  employment_skills: Briefcase,
  msme: TrendingUp,
  housing: Home,
  labour: HardHat
};

export const LandingPage: React.FC = () => {
  const { lang } = useAuth();
  const { t } = useTranslation();
  const isTa = lang === 'ta';

  const [domains, setDomains] = useState<any[]>([]);
  const [featuredSchemes, setFeaturedSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [domRes, schRes] = await Promise.all([
          api.get('/schemes/domains'),
          api.get('/schemes')
        ]);
        setDomains(domRes.data.domains || []);
        setFeaturedSchemes((schRes.data.schemes || []).slice(0, 6));
      } catch (err) {
        console.error('Error fetching landing data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 hero-gradient">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            
            {/* Tag Badge */}
            <div className="inline-flex items-center space-x-2 bg-blue-100/80 text-blue-900 border border-blue-200 px-4 py-1.5 rounded-full text-xs font-bold mb-6 shadow-2xs">
              <Sparkles className="w-4 h-4 text-teal-600 animate-spin" />
              <span>{t('hero.tag')}</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              {isTa ? 'தமிழ்நாடு நலன்பாதை' : 'Tamil Nadu WelfarePath'}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-indigo-800 to-teal-600 mt-2">
                {isTa ? 'மக்களுக்கான எளிய அரசு நலத்திட்ட வழிகாட்டி' : 'Personalized Citizen Welfare Journey'}
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
              {t('hero.description')}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-800 hover:from-blue-800 hover:to-teal-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>{t('hero.discoverCta')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/schemes"
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold text-sm transition-all shadow-2xs flex items-center justify-center"
              >
                {t('hero.exploreCta')}
              </Link>
            </div>

            {/* Key Metrics Counter */}
            <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mt-14 pt-8 border-t border-slate-200/80">
              <div>
                <div className="text-2xl font-black text-slate-900">45+</div>
                <div className="text-xs text-slate-500 font-semibold mt-0.5">{t('hero.statSchemes')}</div>
              </div>
              <div>
                <div className="text-2xl font-black text-teal-700">10</div>
                <div className="text-xs text-slate-500 font-semibold mt-0.5">{t('hero.statDomains')}</div>
              </div>
              <div>
                <div className="text-2xl font-black text-blue-900">100%</div>
                <div className="text-xs text-slate-500 font-semibold mt-0.5">{t('hero.statAccuracy')}</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Welfare Domains Grid */}
      <section className="py-16 bg-white border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('domains.title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              {t('domains.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {domains.map((dom) => {
              const IconComp = domainIconMap[dom.domainKey] || Award;
              const name = isTa ? dom.name?.ta : dom.name?.en;

              return (
                <Link
                  key={dom._id}
                  to={`/schemes?domainKey=${dom.domainKey}`}
                  className="glass-card p-5 rounded-2xl text-center card-hover-effect flex flex-col items-center justify-center group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center mb-3 group-hover:bg-blue-900 group-hover:text-white transition-colors duration-200">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-blue-900 transition-colors">
                    {name}
                  </h3>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

      {/* Featured Schemes Preview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {isTa ? 'சிறப்பு அரசு நலத்திட்டங்கள்' : 'Featured Government Schemes'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isTa ? 'தமிழ்நாடு அரசின் சமீபத்திய அதிகாரப்பூர்வ நலத்திட்டங்கள்' : 'Verified Schemes from Official Tamil Nadu Departments'}
              </p>
            </div>
            <Link
              to="/schemes"
              className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>{isTa ? 'அனைத்தும் காண்க' : 'View All Schemes'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Loading verified schemes...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredSchemes.map((scheme) => (
                <SchemeCard key={scheme._id} scheme={scheme} />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 4-Step Citizen Journey Infographic */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {isTa ? 'உங்கள் நலத்திட்டப் பயணம்' : 'How Tamil Nadu WelfarePath Works'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              {isTa ? 'தகுதி கண்டறிதல் முதல் உரிமைத் தொகை பெறுவது வரை 4 எளிய படிகள்' : '4 Simple Steps from Eligibility Check to Benefit Disbursement'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            
            <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl relative">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm mb-4">
                1
              </div>
              <h3 className="text-sm font-bold text-white mb-2">
                {isTa ? 'சுயவிவரம் நிரப்பவும்' : 'Build Citizen Profile'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isTa ? 'வயது, வருமானம், கல்வி மற்றும் மாவட்ட விவரங்களை உள்ளிடவும்.' : 'Enter basic demographic, income, and education details safely.'}
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl relative">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-black flex items-center justify-center text-sm mb-4">
                2
              </div>
              <h3 className="text-sm font-bold text-white mb-2">
                {isTa ? 'தகுதியை அறியவும்' : 'Explainable Rule Check'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isTa ? 'விளக்கமான விதிகள் மூலம் தகுதி மற்றும் விடுபட்ட சான்றிதழ்களை அறியலாம்.' : 'Get criterion-by-criterion breakdown & 3-level eligibility status.'}
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl relative">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-sm mb-4">
                3
              </div>
              <h3 className="text-sm font-bold text-white mb-2">
                {isTa ? 'OCR ஆவண சரிபார்ப்பு' : 'OCR Document Readiness'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isTa ? 'ஆவணங்களைப் பதிவேற்றி Tesseract OCR மூலம் தானாக விவரங்களை நிரப்பலாம்.' : 'Extract document text with Tesseract.js for fast application readiness.'}
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm mb-4">
                4
              </div>
              <h3 className="text-sm font-bold text-white mb-2">
                {isTa ? 'நிலை மற்றும் புதுப்பித்தல்' : 'Track & Renew Benefits'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isTa ? 'விண்ணப்ப நிலையை உடனுக்குடன் கண்காணித்து புதுப்பிக்கலாம்.' : 'Track application status history and manage recurring benefit renewals.'}
              </p>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
};
