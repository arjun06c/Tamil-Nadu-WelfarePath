import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { User, DollarSign, GraduationCap, Users, Save, CheckCircle2, AlertCircle, Sparkles, Edit3 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { profile, refreshProfile, lang } = useAuth();
  const { t } = useTranslation();
  const isTa = lang === 'ta';
  const [searchParams] = useSearchParams();

  const isEditMode = searchParams.get('edit') === 'true';
  const isCompleteMode = searchParams.get('complete') === 'true';

  const [formData, setFormData] = useState<any>({
    dob: '2003-05-15',
    gender: 'Female',
    district: 'Coimbatore',
    taluk: 'Coimbatore South',
    villageTown: 'Peelamedu',
    annualIncome: 140000,
    occupation: 'Student',
    employmentStatus: 'Student',
    educationLevel: 'Undergraduate',
    socialCategory: 'BC',
    disabilityStatus: false,
    disabilityPercentage: 0,
    isFarmer: false,
    isUnorganizedWorker: false,
    govtSchoolYears6To12: true,
    familyMembersCount: 4,
    dependentsCount: 2
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        ...profile,
        dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '2003-05-15'
      });
    }
  }, [profile]);

  // Calculate dynamic completion percentage and missing fields
  const calculateCompletionStats = (data: any) => {
    const requiredChecklist = [
      { key: 'dob', label: isTa ? 'பிறந்த தேதி' : 'Date of Birth' },
      { key: 'gender', label: isTa ? 'பாலினம்' : 'Gender' },
      { key: 'district', label: isTa ? 'மாவட்டம்' : 'District' },
      { key: 'taluk', label: isTa ? 'வட்டம்' : 'Taluk' },
      { key: 'villageTown', label: isTa ? 'ஊர் / நகரம்' : 'Village/Town' },
      { key: 'annualIncome', label: isTa ? 'ஆண்டு வருமானம்' : 'Annual Income' },
      { key: 'employmentStatus', label: isTa ? 'வேலை நிலை' : 'Employment Status' },
      { key: 'occupation', label: isTa ? 'தொழில்' : 'Occupation' },
      { key: 'educationLevel', label: isTa ? 'கல்வித் தகுதி' : 'Education Level' },
      { key: 'socialCategory', label: isTa ? 'சமூகப் பிரிவு' : 'Social Category' }
    ];

    const missing = requiredChecklist.filter((item) => {
      const val = data[item.key];
      return val === undefined || val === null || val === '';
    });

    const completedCount = requiredChecklist.length - missing.length;
    const percentage = Math.round((completedCount / requiredChecklist.length) * 100);

    return { percentage, missing };
  };

  const { percentage: completionPercentage, missing: missingFields } = calculateCompletionStats(formData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.put('/profile', formData);
      await refreshProfile();
      // Notify application listeners (Sidebar, Dashboard, Eligible Schemes) that profile has changed
      window.dispatchEvent(new CustomEvent('profile-updated'));
      setMsg(
        isTa
          ? 'சுயவிவரம் வெற்றிகரமாக சேமிக்கப்பட்டது! உங்கள் நலத்திட்ட தகுதிகள் மற்றும் பரிந்துரைகள் புதுப்பிக்கப்பட்டன.'
          : 'Citizen profile saved successfully! Personalized scheme eligibility and recommendations updated.'
      );
    } catch (err: any) {
      console.error('Save profile error:', err);
      setMsg(isTa ? 'சேமிப்பதில் பிழை ஏற்பட்டது.' : 'Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isTa ? 'குடிமகன் சுயவிவரம் (Profile Builder)' : 'Citizen Profile Builder'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTa ? 'உங்கள் தகுதியான அரசு நலத்திட்டங்களை கண்டறிய உதவக்கூடிய தகவல்கள்' : 'Complete your details to unlock explainable scheme eligibility matching'}
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center space-x-1.5 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{isTa ? `${completionPercentage}% பூர்த்தியானது` : `${completionPercentage}% Profile Complete`}</span>
        </div>
      </div>

      {/* Mode Banners (Edit or Complete mode) */}
      {isCompleteMode && missingFields.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 text-xs p-4 rounded-2xl mb-6 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-950 mb-0.5">
              {isTa ? 'சுயவிவரப் பூர்த்தி பயன்முறை (Complete Profile Mode)' : 'Complete Profile Mode'}
            </h4>
            <p className="text-[11px] leading-relaxed">
              {isTa
                ? `தயவுசெய்து பின்வரும் விடுபட்ட தகவல்களைப் பூர்த்தி செய்யவும்: ${missingFields.map(m => m.label).join(', ')}.`
                : `Please review and complete the following missing fields to maximize your scheme recommendations: ${missingFields.map(m => m.label).join(', ')}.`}
            </p>
          </div>
        </div>
      )}

      {isEditMode && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs p-4 rounded-2xl mb-6 flex items-center space-x-3">
          <Edit3 className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <h4 className="font-bold text-indigo-950">
              {isTa ? 'சுயவிவரத் திருத்த பயன்முறை (Edit Profile Mode)' : 'Edit Profile Mode'}
            </h4>
            <p className="text-[11px]">
              {isTa ? 'உங்கள் தகவல்களைப் புதுப்பித்து சேமிக்கவும். நலத்திட்டத் தகுதிகள் உடனுக்குடன் கணக்கிடப்படும்.' : 'Update your personal or financial information below and click save to refresh scheme recommendations.'}
            </p>
          </div>
        </div>
      )}

      {msg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs p-4 rounded-2xl mb-6 flex items-center space-x-3 shadow-2xs">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{msg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Demographics & Location */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <User className="w-4 h-4 text-blue-900" />
            <span>{isTa ? '1. தனிப்பட்ட & இருப்பிட விவரங்கள்' : '1. Personal & Location Details'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isTa ? 'பிறந்த தேதி' : 'Date of Birth'}
              </label>
              <input
                type="date"
                required
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isTa ? 'பாலினம்' : 'Gender'}
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-none"
              >
                <option value="Female">{isTa ? 'பெண் (Female)' : 'Female'}</option>
                <option value="Male">{isTa ? 'ஆண் (Male)' : 'Male'}</option>
                <option value="Transgender">{isTa ? 'திருநங்கை / திருநம்பி' : 'Transgender'}</option>
                <option value="Other">{isTa ? 'மற்றவை' : 'Other'}</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isTa ? 'வட்டம் (Taluk)' : 'Taluk Name'}
              </label>
              <input
                type="text"
                value={formData.taluk}
                onChange={(e) => setFormData({ ...formData, taluk: e.target.value })}
                placeholder="e.g. Coimbatore South"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Economic & Income Status */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>{isTa ? '2. பொருளாதார நிலை & வருமானம்' : '2. Economic & Income Status'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isTa ? 'குடும்ப ஆண்டு வருமானம் (₹)' : 'Annual Family Income (₹)'}
              </label>
              <input
                type="number"
                required
                value={formData.annualIncome}
                onChange={(e) => setFormData({ ...formData, annualIncome: Number(e.target.value) })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isTa ? 'தொழில் / வேலை நிலை' : 'Employment Status'}
              </label>
              <select
                value={formData.employmentStatus}
                onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-none"
              >
                <option value="Student">{isTa ? 'மாணவர் (Student)' : 'Student'}</option>
                <option value="Unemployed">{isTa ? 'வேலைவாய்ப்பற்றவர்' : 'Unemployed'}</option>
                <option value="Employed">{isTa ? 'தனியார் / அரசு ஊழியர்' : 'Employed'}</option>
                <option value="Self-Employed">{isTa ? 'சுயதொழில்' : 'Self-Employed'}</option>
                <option value="Pensioner">{isTa ? 'ஓய்வூதியம் பெறுபவர்' : 'Pensioner'}</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isTa ? 'தொழில் துறை' : 'Occupation Detail'}
              </label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="e.g. Student / Agricultural Labourer"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Education & Schooling (Govt School 6th to 12th Flag!) */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>{isTa ? '3. கல்வித் தகுதி & பள்ளி விவரம்' : '3. Education & Schooling History'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isTa ? 'கல்வித் தகுதி' : 'Current Education Level'}
              </label>
              <select
                value={formData.educationLevel}
                onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-none"
              >
                <option value="High School">High School (10th)</option>
                <option value="Higher Secondary">Higher Secondary (12th)</option>
                <option value="Undergraduate">Undergraduate (UG Degree)</option>
                <option value="Diploma">Diploma Course</option>
                <option value="ITI">ITI Vocational</option>
                <option value="Postgraduate">Postgraduate (PG Degree)</option>
              </select>
            </div>

            {/* Crucial Pudhumai Penn Flag */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-indigo-950 block">
                  {isTa ? 'அரசுப் பள்ளி பயின்றவரா? (6 முதல் 12 ஆம் வகுப்பு)' : 'Studied 6th to 12th in TN Govt School?'}
                </span>
                <span className="text-[11px] text-indigo-700">
                  {isTa ? 'புதுமைப் பெண் திட்டம் மற்றும் 7.5% இடஒதுக்கீட்டிற்கு அவசியம்' : 'Crucial for Pudhumai Penn & 7.5% Govt Quota Assistance'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.govtSchoolYears6To12}
                onChange={(e) => setFormData({ ...formData, govtSchoolYears6To12: e.target.checked })}
                className="w-5 h-5 text-blue-900 rounded focus:ring-blue-900"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Social Category & Special Status */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span>{isTa ? '4. சமூகப் பிரிவு & சிறப்பு தகுதிகள்' : '4. Social Category & Special Status'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isTa ? 'சமூகப் பிரிவு (Category)' : 'Social Category'}
              </label>
              <select
                value={formData.socialCategory}
                onChange={(e) => setFormData({ ...formData, socialCategory: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-none"
              >
                <option value="BC">BC (Backward Class)</option>
                <option value="MBC">MBC / DNC</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
                <option value="Minority">BC (Minority)</option>
                <option value="FC">FC (General Category)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="isFarmer"
                checked={formData.isFarmer}
                onChange={(e) => setFormData({ ...formData, isFarmer: e.target.checked })}
                className="w-4 h-4 text-blue-900 rounded"
              />
              <label htmlFor="isFarmer" className="font-semibold text-slate-700">
                {isTa ? 'விவசாயி சான்றிதழ் உள்ளவர்' : 'Registered Farmer'}
              </label>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="isWorker"
                checked={formData.isUnorganizedWorker}
                onChange={(e) => setFormData({ ...formData, isUnorganizedWorker: e.target.checked })}
                className="w-4 h-4 text-blue-900 rounded"
              />
              <label htmlFor="isWorker" className="font-semibold text-slate-700">
                {isTa ? 'நலவாரிய தொழிலாளி' : 'Unorganized Worker Board Member'}
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-800 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? (isTa ? 'சேமிக்கிறது...' : 'Saving Profile...') : (isTa ? 'சுயவிவரத்தை சேமிக்க' : 'Save Citizen Profile')}</span>
        </button>

      </form>

    </div>
  );
};
