import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Globe, Bell, User, Eye, Edit3, CheckCircle2, LogOut, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const CitizenHeader: React.FC = () => {
  const { user, profile, lang, toggleLanguage, logout } = useAuth();
  const isTa = lang === 'ta';
  const navigate = useNavigate();

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

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
      
      {/* Breadcrumb / Title */}
      <div>
        <h1 className="text-sm font-bold text-slate-900">
          {isTa ? 'குடிமகன் நலன் போர்ட்டல்' : 'Citizen Welfare Service Portal'}
        </h1>
        <p className="text-[11px] text-slate-500 font-medium">
          {isTa ? 'உங்கள் தகுதியான அரசு உதவித்தொகைகள் மற்றும் விண்ணப்பங்கள்' : 'Personalized scheme discovery & benefit lifecycle'}
        </p>
      </div>

      {/* Right Toolbar */}
      <div className="flex items-center space-x-3">
        
        {/* Language Switcher Button */}
        <button
          onClick={() => toggleLanguage()}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-800 transition-all shadow-2xs"
          aria-label="Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-teal-600" />
          <span>{lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}</span>
        </button>

        {/* Notifications Icon */}
        <Link
          to="/citizen/notifications"
          className="p-2 text-slate-600 hover:text-blue-900 rounded-xl hover:bg-slate-100 transition-colors relative"
          title="Notifications"
          aria-label="View Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-900"></span>
        </Link>

        {/* Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 text-xs font-bold transition-all border border-blue-200/80 focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-2xs"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="Citizen Account Menu"
          >
            <div className="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
              {user?.name?.[0] || 'C'}
            </div>
            <span className="max-w-[120px] truncate">{user?.name || 'Citizen'}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-blue-800 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              role="menu"
              aria-orientation="vertical"
            >
              {/* Menu Header / Account Summary */}
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1 flex items-center space-x-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full w-fit">
                  <CheckCircle2 className="w-3 h-3 text-teal-600" />
                  <span>Citizen Account</span>
                </div>
              </div>

              {/* Menu Options */}
              <div className="py-1 text-xs font-semibold text-slate-700">
                <button
                  onClick={() => handleNavigate('/citizen/profile')}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2.5 transition-colors text-slate-800"
                  role="menuitem"
                >
                  <Eye className="w-4 h-4 text-blue-900" />
                  <div>
                    <span className="block font-bold">{isTa ? 'சுயவிவரத்தைக் காண்க' : 'View Profile'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{isTa ? 'சுயவிவரத் தகவல்கள்' : 'View your saved profile details'}</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavigate('/citizen/profile?edit=true')}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2.5 transition-colors text-slate-800"
                  role="menuitem"
                >
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="block font-bold">{isTa ? 'சுயவிவரத்தைத் திருத்துக' : 'Edit Profile'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{isTa ? 'தனிப்பட்ட தகவல்களை புதுப்பிக்க' : 'Update personal & income info'}</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavigate('/citizen/profile?complete=true')}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2.5 transition-colors text-slate-800"
                  role="menuitem"
                >
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <div>
                    <span className="block font-bold">{isTa ? 'சுயவிவரத்தைப் பூர்த்தி செய்க' : 'Complete Profile'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{isTa ? 'விடுபட்ட தகுதிகளைப் பூர்த்தி செய்க' : 'Highlight missing eligibility facts'}</span>
                  </div>
                </button>
              </div>

              {/* Menu Footer / Sign Out */}
              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2.5 hover:bg-rose-50 text-rose-700 font-bold flex items-center space-x-2.5 transition-colors text-xs"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
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
