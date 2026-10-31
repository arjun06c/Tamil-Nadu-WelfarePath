import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  User,
  DollarSign,
  GraduationCap,
  Users,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Edit3,
  MapPin,
  HeartHandshake,
  Check,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';

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

  const { percentage: completionPercentage, missing: missingFields } =
    calculateCompletionStats(formData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.put('/profile', formData);
      await refreshProfile();
      window.dispatchEvent(new CustomEvent('profile-updated'));
      setMsg(
        isTa
          ? 'சுயவிவரம் வெற்றிகரமாக சேமிக்கப்பட்டது! உங்கள் நலத்திட்ட தகுதிகள் உடனுக்குடன் புதுப்பிக்கப்பட்டன.'
          : 'Citizen profile saved successfully! Personalized scheme eligibility engine re-evaluated.'
      );
      setTimeout(() => setMsg(''), 5000);
    } catch (err: any) {
      console.error('Save profile error:', err);
      setMsg(isTa ? 'சேமிப்பதில் பிழை ஏற்பட்டது.' : 'Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const tnDistricts = [
    'Ariyalur',
    'Chengalpattu',
    'Chennai',
    'Coimbatore',
    'Cuddalore',
    'Dharmapuri',
    'Dindigul',
    'Erode',
    'Kallakurichi',
    'Kanchipuram',
    'Kanyakumari',
    'Karur',
    'Krishnagiri',
    'Madurai',
    'Mayiladuthurai',
    'Nagapattinam',
    'Namakkal',
    'Nilgiris',
    'Perambalur',
    'Pudukkottai',
    'Ramanathapuram',
    'Ranipet',
    'Salem',
    'Sivaganga',
    'Tenkasi',
    'Thanjavur',
    'Theni',
    'Thoothukudi',
    'Tiruchirappalli',
    'Tirunelveli',
    'Tirupathur',
    'Tiruppur',
    'Tiruvallur',
    'Tiruvannamalai',
    'Tiruvarur',
    'Vellore',
    'Viluppuram',
    'Virudhunagar'
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <PageHeader
        title={isTa ? 'குடிமகன் சுயவிவரம்' : 'Citizen Profile Builder'}
        subtitle={
          isTa
            ? 'உங்கள் இருப்பிடம், குடும்ப வருமானம், கல்வி மற்றும் சமூகத் தகுதிகளைப் பூர்த்தி செய்து துல்லியமான அரசு நலத்திட்டங்களைப் பெறுங்கள்'
            : 'Manage your authenticated demographic, income, education, and special category credentials for algorithmic welfare matching'
        }
        badge={`${completionPercentage}% ${isTa ? 'பூர்த்தியானது' : 'Complete'}`}
        badgeVariant={completionPercentage >= 80 ? 'teal' : 'amber'}
        icon={User}
        breadcrumbs={[
          { label: isTa ? 'முகப்பு' : 'Dashboard', href: '/citizen/dashboard' },
          { label: isTa ? 'சுயவிவரம்' : 'Profile' }
        ]}
      />

      {/* Completion Meter & Missing Fields Banner */}
      <div className="gov-card p-5 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>
            {isTa
              ? `சுயவிவரப் பூர்த்தி நிலை: ${completionPercentage}%`
              : `Profile Completion Score: ${completionPercentage}%`}
          </span>
          <span className="text-teal-700 font-extrabold">{completionPercentage}/100</span>
        </div>

        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-teal-500 to-blue-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {missingFields.length > 0 ? (
          <p className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
            <span className="font-bold">
              {isTa ? 'விடுபட்ட தகவல்கள்: ' : 'Recommended to complete: '}
            </span>
            {missingFields.map((m) => m.label).join(', ')}
          </p>
        ) : (
          <p className="text-[11px] text-emerald-800 flex items-center space-x-1.5 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {isTa
                ? 'அனைத்து முக்கிய சுயவிவரத் தகவல்களும் பூர்த்தி செய்யப்பட்டுள்ளன.'
                : 'All primary eligibility credentials have been successfully provided.'}
            </span>
          </p>
        )}
      </div>

      {/* Success Notification */}
      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs rounded-xl flex items-center space-x-2.5 shadow-2xs">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{msg}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal & Location Details */}
        <div className="gov-card p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-700" />
            </div>
            <h2 className="text-sm font-extrabold text-[#172B4D]">
              {isTa ? '1. தனிப்பட்ட & இருப்பிட விவரங்கள்' : '1. Personal & Location Details'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isTa ? 'பிறந்த தேதி' : 'Date of Birth'}
              </label>
              <input
                type="date"
                required
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="gov-input"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isTa ? 'பாலினம்' : 'Gender'}
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="gov-input font-medium"
              >
                <option value="Female">{isTa ? 'பெண் (Female)' : 'Female'}</option>
                <option value="Male">{isTa ? 'ஆண் (Male)' : 'Male'}</option>
                <option value="Transgender">
                  {isTa ? 'திருநங்கை / திருநம்பி' : 'Transgender'}
                </option>
                <option value="Other">{isTa ? 'மற்றவை' : 'Other'}</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isTa ? 'மாவட்டம்' : 'District'}
              </label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="gov-input font-medium"
              >
                {tnDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isTa ? 'வட்டம் (Taluk)' : 'Taluk'}
              </label>
              <input
                type="text"
                value={formData.taluk}
                onChange={(e) => setFormData({ ...formData, taluk: e.target.value })}
                placeholder="e.g. Coimbatore South"
                className="gov-input"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                {isTa ? 'ஊர் / நகரம் (Village / Town)' : 'Village / Town / Ward'}
              </label>
              <input
                type="text"
                value={formData.villageTown}
                onChange={(e) => setFormData({ ...formData, villageTown: e.target.value })}
                placeholder="e.g. Peelamedu"
                className="gov-input"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Economic & Income Status */}
        <div className="gov-card p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-900 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-700" />
            </div>
            <h2 className="text-sm font-extrabold text-[#172B4D]">
              {isTa ? '2. பொருளாதார நிலை & வருமானம்' : '2. Economic & Income Status'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isTa ? 'குடும்ப ஆண்டு வருமானம் (₹)' : 'Annual Family Income (₹)'}
              </label>
              <input
                type="number"
                required
                value={formData.annualIncome}
                onChange={(e) => setFormData({ ...formData, annualIncome: Number(e.target.value) })}
                className="gov-input font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {isTa ? 'வருமான சான்றிதழில் உள்ளபடி' : 'As per official Revenue certificate'}
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isTa ? 'வேலை நிலை' : 'Employment Status'}
              </label>
              <select
                value={formData.employmentStatus}
                onChange={(e) =>
                  setFormData({ ...formData, employmentStatus: e.target.value })
                }
                className="gov-input font-medium"
              >
                <option value="Student">{isTa ? 'மாணவர் (Student)' : 'Student'}</option>
                <option value="Unemployed">{isTa ? 'வேலைவாய்ப்பற்றவர்' : 'Unemployed'}</option>
                <option value="Employed">{isTa ? 'தனியார் / அரசு ஊழியர்' : 'Employed'}</option>
                <option value="Self-Employed">{isTa ? 'சுயதொழில்' : 'Self-Employed'}</option>
                <option value="Pensioner">{isTa ? 'ஓய்வூதியம் பெறுபவர்' : 'Pensioner'}</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isTa ? 'தொழில் விவரம்' : 'Occupation Detail'}
              </label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="e.g. Student / Agricultural Labourer"
                className="gov-input"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Education & Schooling History */}
        <div className="gov-card p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-900 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-indigo-700" />
            </div>
            <h2 className="text-sm font-extrabold text-[#172B4D]">
              {isTa ? '3. கல்வித் தகுதி & அரசுப் பள்ளி விவரம்' : '3. Education & Schooling History'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isTa ? 'தற்போதைய கல்வித் தகுதி' : 'Highest Education Level'}
              </label>
              <select
                value={formData.educationLevel}
                onChange={(e) =>
                  setFormData({ ...formData, educationLevel: e.target.value })
                }
                className="gov-input font-medium"
              >
                <option value="High School">High School (10th Standard)</option>
                <option value="Higher Secondary">Higher Secondary (12th Standard)</option>
                <option value="Undergraduate">Undergraduate Degree (UG)</option>
                <option value="Diploma">Diploma Course</option>
                <option value="ITI">ITI Vocational</option>
                <option value="Postgraduate">Postgraduate Degree (PG)</option>
              </select>
            </div>

            {/* Crucial Pudhumai Penn / Tamil Pudhalvan Criteria */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-[#10243A] block text-xs">
                  {isTa
                    ? 'அரசுப் பள்ளி பயின்றவரா? (6 முதல் 12 ஆம் வகுப்பு)'
                    : 'Studied 6th–12th in Tamil Nadu Govt School?'}
                </span>
                <span className="text-[11px] text-blue-800 block mt-0.5">
                  {isTa
                    ? 'புதுமைப் பெண் & தமிழ்ப் புதல்வன் திட்டத்திற்குத் தகுதி'
                    : 'Required for Pudhumai Penn & Tamil Pudhalvan ₹1,000/mo grant'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.govtSchoolYears6To12}
                onChange={(e) =>
                  setFormData({ ...formData, govtSchoolYears6To12: e.target.checked })
                }
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Social Category & Special Status */}
        <div className="gov-card p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-900 flex items-center justify-center">
              <Users className="w-4 h-4 text-teal-700" />
            </div>
            <h2 className="text-sm font-extrabold text-[#172B4D]">
              {isTa
                ? '4. சமூகப் பிரிவு & குடும்ப சிறப்பு தகுதிகள்'
                : '4. Social Category & Family Special Status'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isTa ? 'சமூகப் பிரிவு (Community)' : 'Social Community Category'}
              </label>
              <select
                value={formData.socialCategory}
                onChange={(e) =>
                  setFormData({ ...formData, socialCategory: e.target.value })
                }
                className="gov-input font-medium"
              >
                <option value="BC">BC (Backward Class)</option>
                <option value="MBC">MBC / DNC (Most Backward Class)</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
                <option value="Minority">BC Minority (Muslim/Christian)</option>
                <option value="FC">FC / General (Forward Class)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isTa ? 'குடும்ப உறுப்பினர்கள் எண்ணிக்கை' : 'Family Members Count'}
              </label>
              <input
                type="number"
                min="1"
                value={formData.familyMembersCount}
                onChange={(e) =>
                  setFormData({ ...formData, familyMembersCount: Number(e.target.value) })
                }
                className="gov-input"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isTa ? 'சார்ந்திருப்போர் எண்ணிக்கை' : 'Dependents Count'}
              </label>
              <input
                type="number"
                min="0"
                value={formData.dependentsCount}
                onChange={(e) =>
                  setFormData({ ...formData, dependentsCount: Number(e.target.value) })
                }
                className="gov-input"
              />
            </div>
          </div>

          {/* Checkbox Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <label className="flex items-center space-x-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.isFarmer}
                onChange={(e) => setFormData({ ...formData, isFarmer: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded"
              />
              <span className="font-semibold text-slate-700">
                {isTa ? 'விவசாயி சான்றிதழ் உள்ளவர்' : 'Registered Farmer'}
              </span>
            </label>

            <label className="flex items-center space-x-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.isUnorganizedWorker}
                onChange={(e) =>
                  setFormData({ ...formData, isUnorganizedWorker: e.target.checked })
                }
                className="w-4 h-4 text-teal-600 rounded"
              />
              <span className="font-semibold text-slate-700">
                {isTa ? 'உடலுழைப்பு நலவாரிய உறுப்பினர்' : 'Unorganized Worker Board'}
              </span>
            </label>

            <label className="flex items-center space-x-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.disabilityStatus}
                onChange={(e) =>
                  setFormData({ ...formData, disabilityStatus: e.target.checked })
                }
                className="w-4 h-4 text-teal-600 rounded"
              />
              <span className="font-semibold text-slate-700">
                {isTa ? 'மாற்றுத்திறனாளி (PwD)' : 'Differently Abled (PwD)'}
              </span>
            </label>
          </div>
        </div>

        {/* Submit Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-[#10243A] hover:bg-[#193352] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-70"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isTa ? 'சேமிக்கப்படுகிறது...' : 'Saving & Evaluating Scheme Matches...'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>
                  {isTa
                    ? 'சுயவிவரத்தை சேமித்து தகுதியை புதுப்பிக்க'
                    : 'Save Profile & Recalculate Welfare Eligibility'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
