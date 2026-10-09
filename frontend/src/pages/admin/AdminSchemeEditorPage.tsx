import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Award, Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';

export const AdminSchemeEditorPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isEditing = !!id && id !== 'new';

  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    schemeCode: `TN-SCH-${Date.now().toString().slice(-3)}`,
    domainKey: 'education',
    nameEn: '',
    nameTa: '',
    departmentEn: '',
    departmentTa: '',
    descriptionEn: '',
    descriptionTa: '',
    benefitSummaryEn: '',
    benefitSummaryTa: '',
    officialUrl: 'https://tn.gov.in',
    status: 'PUBLISHED',
    isDemoData: false
  });

  useEffect(() => {
    fetchDomains();
    if (isEditing) {
      fetchScheme();
    }
  }, [id]);

  const fetchDomains = async () => {
    try {
      const res = await api.get('/schemes/domains');
      setDomains(res.data.domains || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchScheme = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/schemes/${id}`);
      const s = res.data.scheme;
      if (s) {
        setFormData({
          schemeCode: s.schemeCode || '',
          domainKey: s.domainKey || 'education',
          nameEn: s.name?.en || '',
          nameTa: s.name?.ta || '',
          departmentEn: s.department?.en || '',
          departmentTa: s.department?.ta || '',
          descriptionEn: s.description?.en || '',
          descriptionTa: s.description?.ta || '',
          benefitSummaryEn: s.benefitSummary?.en || '',
          benefitSummaryTa: s.benefitSummary?.ta || '',
          officialUrl: s.officialUrl || 'https://tn.gov.in',
          status: s.status || (s.isActive ? 'PUBLISHED' : 'DRAFT'),
          isDemoData: !!s.isDemoData
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        schemeCode: formData.schemeCode,
        domainKey: formData.domainKey,
        name: { en: formData.nameEn, ta: formData.nameTa },
        department: { en: formData.departmentEn, ta: formData.departmentTa },
        description: { en: formData.descriptionEn, ta: formData.descriptionTa },
        benefitSummary: { en: formData.benefitSummaryEn, ta: formData.benefitSummaryTa },
        officialUrl: formData.officialUrl,
        status: formData.status,
        isDemoData: formData.isDemoData,
        rules: {
          all: [
            {
              field: 'residence',
              operator: 'equals',
              value: 'Tamil Nadu',
              label: { en: 'Must be a resident of Tamil Nadu', ta: 'தமிழ்நாட்டில் வசிப்பவராக இருக்க வேண்டும்' },
              isMandatory: true
            }
          ]
        },
        requiredDocuments: [
          { docType: 'AadhaarCard', isMandatory: true, label: { en: 'Aadhaar Card', ta: 'ஆதார் கார்டு' } },
          { docType: 'IncomeCertificate', isMandatory: true, label: { en: 'Income Certificate', ta: 'வருமானச் சான்றிதழ்' } }
        ]
      };

      if (isEditing) {
        await api.patch(`/admin/schemes/${id}`, payload);
      } else {
        await api.post('/admin/schemes', payload);
      }

      navigate('/admin/schemes');
    } catch (err: any) {
      console.error('Save scheme error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading scheme form...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
      
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/admin/schemes')}
          className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isEditing
              ? (isTa ? 'அரசு திட்டத்தைத் திருத்துதல்' : 'Edit State Welfare Scheme')
              : (isTa ? 'புதிய அரசு திட்டத்தை உருவாக்குதல்' : 'Create State Welfare Scheme')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTa ? 'திட்டத்தின் பெயர், துறை, மானியம் மற்றும் இருமொழி விவரங்களை உள்ளிடவும்' : 'Define bilingual metadata, domain assignment, and publication status'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-3xl space-y-4 border border-slate-200 text-xs shadow-xs">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Scheme Code</label>
            <input
              type="text"
              required
              value={formData.schemeCode}
              disabled={isEditing}
              onChange={(e) => setFormData({ ...formData, schemeCode: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Welfare Domain Sector</label>
            <select
              value={formData.domainKey}
              onChange={(e) => setFormData({ ...formData, domainKey: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
            >
              {domains.map((d) => (
                <option key={d._id} value={d.domainKey}>
                  {isTa ? d.name?.ta : d.name?.en} ({d.domainKey})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Scheme Name (English)</label>
            <input
              type="text"
              required
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">திட்டத்தின் பெயர் (தமிழ்)</label>
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
            <label className="block font-extrabold text-slate-700 mb-1">Department (English)</label>
            <input
              type="text"
              required
              value={formData.departmentEn}
              onChange={(e) => setFormData({ ...formData, departmentEn: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">அரசுத் துறை (தமிழ்)</label>
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
            <label className="block font-extrabold text-slate-700 mb-1">Description (English)</label>
            <textarea
              rows={3}
              required
              value={formData.descriptionEn}
              onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">திட்ட விளக்கம் (தமிழ்)</label>
            <textarea
              rows={3}
              required
              value={formData.descriptionTa}
              onChange={(e) => setFormData({ ...formData, descriptionTa: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Benefit Summary (English)</label>
            <input
              type="text"
              required
              value={formData.benefitSummaryEn}
              onChange={(e) => setFormData({ ...formData, benefitSummaryEn: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">உதவித்தொகை விவரம் (தமிழ்)</label>
            <input
              type="text"
              required
              value={formData.benefitSummaryTa}
              onChange={(e) => setFormData({ ...formData, benefitSummaryTa: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Official Portal URL</label>
            <input
              type="url"
              value={formData.officialUrl}
              onChange={(e) => setFormData({ ...formData, officialUrl: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Publication Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
            >
              <option value="PUBLISHED">PUBLISHED (Visible to Citizens)</option>
              <option value="DRAFT">DRAFT (Admin Only)</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <input
              type="checkbox"
              id="isDemoData"
              checked={formData.isDemoData}
              onChange={(e) => setFormData({ ...formData, isDemoData: e.target.checked })}
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
            />
            <label htmlFor="isDemoData" className="font-extrabold text-slate-700 select-none">
              Flag as Sample Record
            </label>
          </div>
        </div>

        <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/admin/schemes')}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Scheme Master Record'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
