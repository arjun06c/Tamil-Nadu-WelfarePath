import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Award, Save, ArrowLeft } from 'lucide-react';

export const AdminSchemeEditorPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    schemeCode: 'TN-SCH-007',
    nameEn: 'Special Rural Entrepreneurship Scheme',
    nameTa: 'சிறப்பு கிராமப்புற தொழில்முனைவோர் திட்டம்',
    departmentEn: 'Micro, Small & Medium Enterprises Department',
    departmentTa: 'சிறு, குறு மற்றும் நடுத்தரத் தொழில்கள் துறை',
    domainKey: 'msme',
    descriptionEn: 'Provides ₹5,00,000 capital subsidy grant for first-generation micro entrepreneurs in rural Tamil Nadu.',
    descriptionTa: 'கிராமப்புறங்களில் முதல் தலைமுறை சிறுகுறு தொழில்முனைவோருக்கு ₹5 லட்சம் மூலதன மானியம் வழங்கும் திட்டம்.',
    benefitSummaryEn: '₹5,00,000 Capital Subsidy Grant.',
    benefitSummaryTa: '₹5 லட்சம் மூலதன மானியம்.'
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      navigate('/admin/schemes');
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/admin/schemes')}
          className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isTa ? 'புதிய அரசு திட்டத்தை உருவாக்குதல்' : 'Create / Edit State Welfare Scheme'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTa ? 'அரசுத் திட்டத்தின் பெயர், துறை, மானியம் மற்றும் இருமொழி விவரங்களை உள்ளிடவும்' : 'Define bilingual names, department taxonomy, official URLs, and benefit summaries'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl space-y-4 border border-slate-200 text-xs">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Scheme Code</label>
            <input
              type="text"
              required
              value={formData.schemeCode}
              onChange={(e) => setFormData({ ...formData, schemeCode: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Welfare Domain Sector</label>
            <select
              value={formData.domainKey}
              onChange={(e) => setFormData({ ...formData, domainKey: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            >
              <option value="education">Education & Scholarships</option>
              <option value="women_child">Women & Child Welfare</option>
              <option value="social_security">Social Security & Pensions</option>
              <option value="differently_abled">Differently Abled Welfare</option>
              <option value="agriculture">Agriculture & Farmers</option>
              <option value="health">Health & Nutrition</option>
              <option value="msme">Entrepreneurship & MSME</option>
              <option value="housing">Housing & Basic Needs</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Scheme Name (English)</label>
            <input
              type="text"
              required
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">திட்டத்தின் பெயர் (தமிழ்)</label>
            <input
              type="text"
              required
              value={formData.nameTa}
              onChange={(e) => setFormData({ ...formData, nameTa: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Department (English)</label>
            <input
              type="text"
              required
              value={formData.departmentEn}
              onChange={(e) => setFormData({ ...formData, departmentEn: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">அரசுத் துறை (தமிழ்)</label>
            <input
              type="text"
              required
              value={formData.departmentTa}
              onChange={(e) => setFormData({ ...formData, departmentTa: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Benefit Summary (English)</label>
            <input
              type="text"
              required
              value={formData.benefitSummaryEn}
              onChange={(e) => setFormData({ ...formData, benefitSummaryEn: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">உதவித்தொகை விவரம் (தமிழ்)</label>
            <input
              type="text"
              required
              value={formData.benefitSummaryTa}
              onChange={(e) => setFormData({ ...formData, benefitSummaryTa: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Scheme Master Record'}</span>
        </button>

      </form>

    </div>
  );
};
