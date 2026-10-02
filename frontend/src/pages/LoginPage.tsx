import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 hero-gradient">
      <div className="max-w-md w-full glass-card p-8 rounded-3xl shadow-xl border border-slate-200/80">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isTa ? 'உள்நுழைக' : 'Sign In to WelfarePath'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isTa ? 'உங்கள் நலத்திட்ட தகுதி மற்றும் விண்ணப்பங்களை பார்வையிட' : 'Access your personalized welfare portfolio & tracking'}
          </p>
        </div>

        {/* Quick Demo Shortcuts */}
        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3 mb-6">
          <div className="text-[11px] font-bold text-blue-900 mb-2 flex items-center space-x-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{isTa ? 'மாதிரி கணக்கில் உடனடி நுழைவு:' : 'Quick Demo One-Click Login:'}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            <button
              type="button"
              onClick={() => handleQuickLogin('citizen@gmail.com', 'Citizen@123')}
              className="py-1.5 bg-white border border-blue-300 rounded-lg text-blue-900 font-semibold hover:bg-blue-100"
            >
              Citizen Demo
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('officer@tnwelfare.gov.in', 'Officer@123')}
              className="py-1.5 bg-white border border-purple-300 rounded-lg text-purple-900 font-semibold hover:bg-purple-100"
            >
              Officer Demo
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@tnwelfare.gov.in', 'Admin@123')}
              className="py-1.5 bg-white border border-amber-300 rounded-lg text-amber-900 font-semibold hover:bg-amber-100"
            >
              Admin Demo
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isTa ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isTa ? 'கடவுச்சொல்' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-900 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <span>{loading ? (isTa ? 'சரிபார்க்கிறது...' : 'Signing in...') : (isTa ? 'உள்நுழைக' : 'Sign In')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          <span>{isTa ? 'கணக்கு இல்லையா?' : "Don't have a citizen account?"} </span>
          <Link to="/register" className="font-bold text-blue-900 hover:underline">
            {isTa ? 'இங்கே பதிவு செய்யவும்' : 'Register now'}
          </Link>
        </div>

      </div>
    </div>
  );
};
