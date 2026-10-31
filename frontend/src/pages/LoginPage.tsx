import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, lang } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isTa = lang === 'ta';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const savedUserStr = localStorage.getItem('tn_welfarepath_user');
      let targetPath = '/citizen/dashboard';
      if (savedUserStr) {
        try {
          const u = JSON.parse(savedUserStr);
          if (u.role === 'Officer') targetPath = '/officer/dashboard';
          else if (u.role === 'Admin') targetPath = '/admin/dashboard';
        } catch (e) {}
      }
      navigate(targetPath);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email address or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F4F7FB]">
      <div className="max-w-md w-full gov-card p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#10243A] text-teal-400 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#172B4D] tracking-tight">
            {isTa ? 'உள்நுழைக' : 'Sign In to WelfarePath'}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {isTa
              ? 'உங்கள் தனிப்பட்ட நலத்திட்டங்கள், விண்ணப்பங்கள், ஆவணங்கள் மற்றும் உதவிகளைப் அணுக உள்நுழைக.'
              : 'Sign in to access your personalized welfare schemes, applications, documents, and benefits.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-xl font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {isTa ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="gov-input w-full pl-10 pr-4 text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {isTa ? 'கடவுச்சொல்' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="gov-input w-full pl-10 pr-10 text-xs font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#10243A] hover:bg-[#1a385c] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2"
          >
            <span>{loading ? (isTa ? 'சரிபார்க்கிறது...' : 'Signing in...') : (isTa ? 'உள்நுழைக' : 'Sign In')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
          <span>{isTa ? 'கணக்கு இல்லையா?' : "Don't have a citizen account?"} </span>
          <Link to="/register" className="font-bold text-[#2563EB] hover:underline">
            {isTa ? 'இங்கே பதிவு செய்யவும்' : 'Register now'}
          </Link>
        </div>

      </div>
    </div>
  );
};
