import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Globe, Bell, User, Eye, Edit3, CheckCircle2, LogOut, ChevronDown, Menu, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HomeNavigation } from '../common/HomeNavigation';

interface CitizenHeaderProps {
  onOpenMobileMenu?: () => void;
}

export const CitizenHeader: React.FC<CitizenHeaderProps> = ({ onOpenMobileMenu }) => {
  const { user, profile, lang, toggleLanguage, logout } = useAuth();
  const isTa = lang === 'ta';
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNavigate = (path: string) => {
    setDropdownOpen(false);
    navigate(path);
  };

  const handleSignOut = () => {
    setDropdownOpen(false);
    logout();
  };

  // Determine current page context title
  const getPageInfo = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) {
      return {
        titleEn: 'Citizen Dashboard',
        titleTa: 'குடிமகன் முகப்பு',
        subtitleEn: 'Personalized scheme discovery & benefit management',
        subtitleTa: 'தனிப்பயனாக்கப்பட்ட திட்டங்கள் மற்றும் பலன் மேலாண்மை'
      };
    }
    if (path.includes('/eligible-schemes')) {
      return {
        titleEn: 'My Eligible Schemes',
        titleTa: 'எனக்கு தகுதியானவை',
        subtitleEn: 'Explainable rule-matched welfare schemes',
        subtitleTa: 'விதிகளுக்கு உட்பட்டு தகுதியான நலத்திட்டங்கள்'
      };
    }
    if (path.includes('/schemes')) {
      return {
        titleEn: 'Discover Schemes',
        titleTa: 'நலத்திட்டங்கள் கண்டறிதல்',
        subtitleEn: 'Explore all Tamil Nadu government welfare programs',
        subtitleTa: 'அனைத்து அரசு நலத்திட்டங்களையும் ஆராயுங்கள்'
      };
    }
    if (path.includes('/applications')) {
      return {
        titleEn: 'My Applications',
        titleTa: 'என் விண்ணப்பங்கள்',
        subtitleEn: 'Track review status and step-by-step milestones',
        subtitleTa: 'விண்ணப்பங்களின் நிலை மற்றும் முன்னேற்றம்'
      };
    }
    if (path.includes('/benefits')) {
      return {
        titleEn: 'Approved Benefits',
        titleTa: 'பெறப்பட்ட உதவிகள்',
        subtitleEn: 'Direct Benefit Transfer records & renewal dates',
        subtitleTa: 'நேரடி பலன் பரிமாற்றம் மற்றும் புதுப்பித்தல்'
      };
    }
    if (path.includes('/documents')) {
      return {
        titleEn: 'Document Center',
        titleTa: 'ஆவண மையம்',
        subtitleEn: 'Uploaded documents & verified credentials',
        subtitleTa: 'சரிபார்க்கப்பட்ட ஆவணங்கள் மற்றும் சான்றுகள்'
      };
    }
    if (path.includes('/digilocker')) {
      return {
        titleEn: 'DigiLocker Integration',
        titleTa: 'டிஜிலாக்கர் இணைப்பு',
        subtitleEn: 'Secure Government of India document repository sync',
        subtitleTa: 'பாதுகாப்பான இந்திய அரசு ஆவண களஞ்சிய இணைப்பு'
      };
    }
    if (path.includes('/saved-schemes')) {
      return {
        titleEn: 'Saved Schemes',
        titleTa: 'சேமித்த திட்டங்கள்',
        subtitleEn: 'Bookmarked schemes for quick application',
        subtitleTa: 'விரைவான விண்ணப்பத்திற்கான சேமித்த திட்டங்கள்'
      };
    }
    if (path.includes('/notifications')) {
      return {
        titleEn: 'Notifications',
        titleTa: 'அறிவிப்புகள்',
        subtitleEn: 'Application milestones and status alerts',
        subtitleTa: 'விண்ணப்ப நிலை மற்றும் அறிவிப்புகள்'
      };
    }
    if (path.includes('/profile')) {
      return {
        titleEn: 'Citizen Profile',
        titleTa: 'குடிமகன் சுயவிவரம்',
        subtitleEn: 'Manage personal, socio-economic, and family details',
        subtitleTa: 'தனிப்பட்ட மற்றும் பொருளாதார விவரங்கள்'
      };
    }
    return {
      titleEn: 'Citizen Welfare Service Portal',
      titleTa: 'குடிமகன் நலன் சேவை தளம்',
      subtitleEn: 'Government of Tamil Nadu',
      subtitleTa: 'தமிழ்நாடு அரசு'
    };
  };

  const pageInfo = getPageInfo();

  return (
    <header className="h-16 shrink-0 w-full bg-white border-b border-slate-200/90 px-4 md:px-6 flex items-center justify-between z-30 shadow-2xs">
      
      {/* Left: Mobile Toggle + Home Navigation + Breadcrumb / Title */}
      <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-[#10243A] rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Home Navigation */}
        <HomeNavigation variant="citizen" />

        <div className="hidden sm:block h-6 w-px bg-slate-200 shrink-0" />

        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h1 className="text-sm md:text-base font-extrabold text-[#172B4D] truncate leading-tight">
              {isTa ? pageInfo.titleTa : pageInfo.titleEn}
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Official Portal
            </span>
          </div>
          <p className="hidden md:block text-[11px] text-slate-500 font-medium truncate mt-0.5">
            {isTa ? pageInfo.subtitleTa : pageInfo.subtitleEn}
          </p>
        </div>
      </div>

      {/* Right Toolbar */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        
        {/* Language Selector */}
        <button
          onClick={() => toggleLanguage()}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-all active:scale-95 shadow-2xs"
          aria-label="Switch Language"
          title={isTa ? 'ஆங்கிலத்திற்கு மாற்றுக' : 'Switch to Tamil'}
        >
          <Globe className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="text-[11px] font-extrabold">
            {lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}
          </span>
        </button>

        {/* Notifications Icon with Indicator */}
        <Link
          to="/citizen/notifications"
          className="p-2 text-slate-600 hover:text-[#10243A] rounded-xl hover:bg-slate-100 transition-colors relative"
          title={isTa ? 'அறிவிப்புகள்' : 'Notifications'}
          aria-label="View Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
        </Link>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#172B4D] text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-600/30 shadow-2xs"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="Citizen Account Menu"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#10243A] to-blue-700 text-white flex items-center justify-center font-extrabold text-[11px] shrink-0 shadow-2xs">
              {user?.name?.[0]?.toUpperCase() || 'C'}
            </div>
            <span className="hidden sm:inline-block max-w-[120px] truncate">
              {user?.name || 'Citizen'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu Modal */}
          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              role="menu"
              aria-orientation="vertical"
            >
              {/* Menu Header / Account Summary */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl">
                <p className="text-xs font-extrabold text-[#172B4D] truncate">
                  {user?.name}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {user?.email}
                </p>
                <div className="mt-1.5 flex items-center space-x-1.5 text-[10px] font-extrabold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full w-fit">
                  <ShieldCheck className="w-3 h-3 text-teal-600" />
                  <span>Citizen Account</span>
                </div>
              </div>

              {/* Menu Options */}
              <div className="py-1.5 text-xs font-semibold text-slate-700">
                <button
                  onClick={() => handleNavigate('/citizen/profile')}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-3 transition-colors text-slate-800"
                  role="menuitem"
                >
                  <Eye className="w-4 h-4 text-blue-700 shrink-0" />
                  <div>
                    <span className="block font-bold">
                      {isTa ? 'சுயவிவரத்தைக் காண்க' : 'View Profile'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {isTa ? 'சுயவிவரத் தகவல்கள்' : 'View saved citizen facts'}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavigate('/citizen/profile?edit=true')}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-3 transition-colors text-slate-800"
                  role="menuitem"
                >
                  <Edit3 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="block font-bold">
                      {isTa ? 'சுயவிவரத்தைத் திருத்துக' : 'Edit Profile'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {isTa ? 'தனிப்பட்ட தகவல்களை புதுப்பிக்க' : 'Update income, education & location'}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavigate('/citizen/settings')}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-3 transition-colors text-slate-800"
                  role="menuitem"
                >
                  <User className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <span className="block font-bold">
                      {isTa ? 'கணக்கு அமைப்புகள்' : 'Account Settings'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {isTa ? 'மொழி மற்றும் பாதுகாப்பு' : 'Language & preferences'}
                    </span>
                  </div>
                </button>
              </div>

              {/* Menu Footer / Sign Out */}
              <div className="pt-1.5 mt-1 border-t border-slate-100">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2.5 hover:bg-rose-50 text-rose-700 font-bold flex items-center space-x-3 transition-colors text-xs"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{isTa ? 'வெளியேறு' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
