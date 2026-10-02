import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'Citizen' | 'Officer' | 'Admin';
  district: string;
  languagePreference: 'en' | 'ta';
}

export interface CitizenProfile {
  _id?: string;
  userId: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Transgender' | 'Other';
  district: string;
  taluk: string;
  villageTown: string;
  annualIncome: number;
  occupation: string;
  employmentStatus: 'Employed' | 'Unemployed' | 'Student' | 'Self-Employed' | 'Pensioner';
  educationLevel: 'Illiterate' | 'Primary' | 'High School' | 'Higher Secondary' | 'Undergraduate' | 'Postgraduate' | 'Diploma' | 'ITI';
  socialCategory: 'FC' | 'BC' | 'MBC' | 'SC' | 'ST' | 'Minority';
  disabilityStatus: boolean;
  disabilityPercentage: number;
  isFarmer: boolean;
  isUnorganizedWorker: boolean;
  govtSchoolYears6To12: boolean;
  familyMembersCount: number;
  dependentsCount: number;
  aadhaarHash?: string;
  bankDetails?: {
    accountNoHash?: string;
    ifscCode?: string;
    bankName?: string;
  };
}

interface AuthContextType {
  user: User | null;
  profile: CitizenProfile | null;
  token: string | null;
  lang: 'en' | 'ta';
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  toggleLanguage: (newLang?: 'en' | 'ta') => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('tn_welfarepath_token'));
  const [lang, setLang] = useState<'en' | 'ta'>((localStorage.getItem('tn_welfarepath_lang') as any) || 'en');
  const [loading, setLoading] = useState<boolean>(true);
  const { i18n } = useTranslation();

  const toggleLanguage = (newLang?: 'en' | 'ta') => {
    const targetLang = newLang || (lang === 'en' ? 'ta' : 'en');
    setLang(targetLang);
    localStorage.setItem('tn_welfarepath_lang', targetLang);
    i18n.changeLanguage(targetLang);
  };

  const fetchCurrentUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setProfile(res.data.profile);
    } catch (err) {
      console.error('Error loading user profile:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    i18n.changeLanguage(lang);
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('tn_welfarepath_token', newToken);
    setToken(newToken);
    setUser(userData);
    if (userData.languagePreference) {
      toggleLanguage(userData.languagePreference);
    }
    await fetchCurrentUser();
  };

  const register = async (data: any) => {
    const res = await api.post('/auth/register', data);
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('tn_welfarepath_token', newToken);
    setToken(newToken);
    setUser(userData);
    await fetchCurrentUser();
  };

  const logout = () => {
    localStorage.removeItem('tn_welfarepath_token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (token) {
      const res = await api.get('/auth/me');
      setProfile(res.data.profile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        lang,
        loading,
        login,
        register,
        logout,
        toggleLanguage,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
