import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Globe, Award, LogIn, UserPlus } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const { user, lang, toggleLanguage } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isTa = lang === 'ta';

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-900 via-indigo-900 to-teal-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-200">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  {isTa ? 'தமிழ்நாடு நலன்பாதை' : 'Tamil Nadu WelfarePath'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {isTa ? 'தனிப்பயனாக்கப்பட்ட குடிமக்கள் நலத் திட்டம்' : 'Personalized Citizen Welfare Platform'}
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 text-xs font-semibold text-slate-700">
            <Link to="/" className="px-3 py-2 rounded-lg hover:text-blue-900 hover:bg-slate-100 transition-colors">
              {t('nav.home')}
            </Link>
            <Link to="/schemes" className="px-3 py-2 rounded-lg hover:text-blue-900 hover:bg-slate-100 transition-colors">
              {t('nav.schemes')}
            </Link>
            <Link to="/how-it-works" className="px-3 py-2 rounded-lg hover:text-blue-900 hover:bg-slate-100 transition-colors">
              {isTa ? 'செயல்முறை' : 'How It Works'}
            </Link>
            <Link to="/help" className="px-3 py-2 rounded-lg hover:text-blue-900 hover:bg-slate-100 transition-colors">
              {isTa ? 'உதவி & கேள்விகள்' : 'Help & FAQs'}
            </Link>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            
            {/* Language Switcher */}
            <button
              onClick={() => toggleLanguage()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-800 transition-all shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5 text-teal-600" />
              <span>{lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}</span>
            </button>

            {/* Auth Redirects or Direct Dashboard CTA */}
            {user ? (
              <button
                onClick={() => {
                  if (user.role === 'Citizen') navigate('/citizen/dashboard');
                  else if (user.role === 'Officer') navigate('/officer/dashboard');
                  else navigate('/admin/dashboard');
                }}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                {isTa ? 'என் பணிமனைக்குச் செல்க' : 'Go to Workspace'}
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-900 transition-colors flex items-center space-x-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('nav.login')}</span>
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-sm transition-all flex items-center space-x-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t('nav.register')}</span>
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
