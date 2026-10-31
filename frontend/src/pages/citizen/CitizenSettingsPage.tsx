import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Globe,
  Settings,
  User,
  ShieldCheck,
  Lock,
  ExternalLink,
  ChevronRight,
  Shield,
  Smartphone,
  Mail
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';

export const CitizenSettingsPage: React.FC = () => {
  const { user, lang, toggleLanguage } = useAuth();
  const isTa = lang === 'ta';

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <PageHeader
        title={isTa ? 'கணக்கு அமைப்புகள்' : 'Account & Portal Settings'}
        subtitle={
          isTa
            ? 'உங்கள் கணக்கு விவரங்கள், தளத்தின் மொழித் தேர்வு மற்றும் பாதுகாப்பு மேலாண்மை'
            : 'Configure your language preferences, verified citizen identity credentials, and security integrations'
        }
        badge={isTa ? 'அமைப்புகள்' : 'Preferences'}
        badgeVariant="blue"
        icon={Settings}
        breadcrumbs={[
          { label: isTa ? 'முகப்பு' : 'Dashboard', href: '/citizen/dashboard' },
          { label: isTa ? 'அமைப்புகள்' : 'Settings' }
        ]}
      />

      <div className="gov-card p-6 space-y-6">
        {/* Language Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-[#172B4D] flex items-center space-x-2">
              <Globe className="w-4 h-4 text-teal-600" />
              <span>{isTa ? 'தளத்தின் மொழி (Interface Language)' : 'Portal Language'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isTa
                ? 'முழு தளத்தையும் தமிழ் அல்லது ஆங்கிலத்தில் மாற்றி அமைக்கலாம்'
                : 'Switch all navigation menus, forms, scheme breakdowns, and assistant to English or Tamil'}
            </p>
          </div>

          <button
            onClick={() => toggleLanguage()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 transition-colors self-start sm:self-auto shrink-0 shadow-2xs"
          >
            {lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}
          </button>
        </div>

        {/* User Account Info */}
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-[#172B4D] flex items-center space-x-2">
            <User className="w-4 h-4 text-blue-700" />
            <span>{isTa ? 'அடையாள விவரங்கள்' : 'Authenticated Citizen Identity'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">{isTa ? 'பெயர்:' : 'Full Name:'}</span>
              <span className="font-extrabold text-[#172B4D] truncate block mt-0.5">
                {user?.name}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">{isTa ? 'மின்னஞ்சல்:' : 'Email Address:'}</span>
              <span className="font-semibold text-slate-700 truncate block mt-0.5">
                {user?.email}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">{isTa ? 'மொபைல் எண்:' : 'Mobile Number:'}</span>
              <span className="font-semibold text-slate-700 block mt-0.5">
                {user?.mobile || 'Not linked'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">{isTa ? 'கணக்கு வகை:' : 'Portal Role:'}</span>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-900 border border-blue-200">
                {user?.role || 'Citizen'}
              </span>
            </div>
          </div>
        </div>

        {/* DigiLocker Shortcut */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-[#172B4D] flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>{isTa ? 'டிஜிலாக்கர் இணைப்பு மேலாண்மை' : 'DigiLocker Integration'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isTa
                ? 'அரசு டிஜிலாக்கர் கணக்கை இணைக்கவும், ஆவண சம்மதத்தை நிர்வகிக்கவும்'
                : 'Connect or manage consent permissions for authorized DigiLocker government certificates'}
            </p>
          </div>

          <Link
            to="/citizen/settings/digilocker"
            className="px-4 py-2 bg-[#10243A] hover:bg-[#193352] text-white font-bold rounded-xl text-xs transition-colors flex items-center space-x-1 self-start sm:self-auto shrink-0 shadow-xs"
          >
            <span>{isTa ? 'டிஜிலாக்கரை நிர்வகி' : 'Manage DigiLocker'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Security & Data Privacy Notice */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 text-xs text-slate-600">
          <div className="font-bold text-[#172B4D] flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-teal-700" />
            <span>{isTa ? 'தரவுப் பாதுகாப்பு உத்தரவாதம்' : 'State Citizen Data Privacy Standards'}</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            {isTa
              ? 'உங்கள் அனைத்து விவரங்களும் தமிழ்நாடு மின்னாளுமை முகமை (TNeGA) வழிகாட்டுதலின்படி பாதுகாப்பாக குறியாக்கம் செய்யப்படுகின்றன.'
              : 'All citizen records and application payloads are strictly handled in accordance with the Tamil Nadu e-Governance Agency (TNeGA) data security and encryption standards.'}
          </p>
        </div>
      </div>
    </div>
  );
};
