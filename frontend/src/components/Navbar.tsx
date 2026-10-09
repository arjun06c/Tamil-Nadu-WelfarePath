import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Globe, User, LogOut, Shield, Award, LayoutDashboard } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, lang, toggleLanguage, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & State Emblem Title */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-900 via-indigo-800 to-teal-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-200">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  {lang === 'ta' ? 'தமிழ்நாடு நலன்பாதை' : 'Tamil Nadu WelfarePath'}
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  TN.GOV
                </span>
              </div>
              <p className="text-xs text-slate-5 font-medium">
                {t('nav.subtitle')}
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-blue-900 hover:bg-slate-100 transition-colors"
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/schemes"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-blue-900 hover:bg-slate-100 transition-colors"
            >
              {t('nav.schemes')}
            </Link>

            {user && (
              <Link
                to={user.role === 'Officer' ? '/officer/dashboard' : user.role === 'Admin' ? '/admin/dashboard' : '/citizen/dashboard'}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-blue-900 hover:bg-slate-100 transition-colors flex items-center space-x-1"
              >
                <LayoutDashboard className="w-4 h-4 mr-1" />
                {t('nav.dashboard')}
              </Link>
            )}

            {(user?.role === 'Officer' || user?.role === 'Admin') && (
              <Link
                to="/officer"
                className="px-3 py-2 rounded-lg text-sm font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 transition-colors flex items-center space-x-1"
              >
                <Shield className="w-4 h-4 mr-1 text-purple-600" />
                {t('nav.officer')}
              </Link>
            )}

            {user?.role === 'Admin' && (
              <Link
                to="/admin"
                className="px-3 py-2 rounded-lg text-sm font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-50 transition-colors"
              >
                {t('nav.admin')}
              </Link>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-3">
            
            {/* Language Switcher Pill Button */}
            <button
              onClick={() => toggleLanguage()}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-800 transition-all shadow-sm active:scale-95"
              title="Switch Language / மொழியை மாற்றுக"
            >
              <Globe className="w-4 h-4 text-teal-600" />
              <span>{lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}</span>
            </button>

            {/* User Auth Buttons */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <Link
                  to="/citizen/profile"
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-100 text-xs font-semibold transition-colors"
                >
                  <User className="w-4 h-4 text-blue-700" />
                  <span className="max-w-[100px] truncate">{user.name}</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title={t('nav.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-blue-900 transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all hover:shadow"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
