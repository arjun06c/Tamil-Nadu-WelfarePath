import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Layers,
  Plus,
  Edit,
  Eye,
  CheckCircle2,
  AlertCircle,
  Award,
  GraduationCap,
  Heart,
  ShieldAlert,
  Accessibility,
  Sprout,
  Activity,
  Briefcase,
  TrendingUp,
  Home,
  HardHat,
  Anchor,
  Trees,
  BookOpen,
  Trophy,
  HeartHandshake,
  X
} from 'lucide-react';

const iconComponents: Record<string, any> = {
  GraduationCap,
  Heart,
  ShieldAlert,
  Accessibility,
  Sprout,
  Activity,
  Briefcase,
  TrendingUp,
  Home,
  HardHat,
  Anchor,
  Trees,
  BookOpen,
  Trophy,
  HeartHandshake,
  Award
};

export const AdminDomainManagerPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';
  const navigate = useNavigate();

  const [domains, setDomains] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalDomains: 0, totalSchemes: 0, publishedSchemes: 0, draftSchemes: 0 });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    domainKey: '',
    nameEn: '',
    nameTa: '',
    descriptionEn: '',
    descriptionTa: '',
    iconName: 'Award',
    displayOrder: 1,
    status: 'ACTIVE'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const res = await api.get('/schemes/domains');
      setDomains(res.data.domains || []);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (domain?: any) => {
    if (domain) {
      setEditingDomain(domain);
      setFormData({
        domainKey: domain.domainKey || '',
        nameEn: domain.name?.en || '',
        nameTa: domain.name?.ta || '',
        descriptionEn: domain.description?.en || '',
        descriptionTa: domain.description?.ta || '',
        iconName: domain.iconName || 'Award',
        displayOrder: domain.displayOrder || 1,
        status: domain.status || 'ACTIVE'
      });
    } else {
      setEditingDomain(null);
      setFormData({
        domainKey: `domain_${Date.now().toString().slice(-4)}`,
        nameEn: '',
        nameTa: '',
        descriptionEn: '',
        descriptionTa: '',
        iconName: 'Award',
        displayOrder: domains.length + 1,
        status: 'ACTIVE'
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        domainKey: formData.domainKey,
        name: { en: formData.nameEn, ta: formData.nameTa },
        description: { en: formData.descriptionEn, ta: formData.descriptionTa },
        iconName: formData.iconName,
        displayOrder: Number(formData.displayOrder),
        status: formData.status
      };

      if (editingDomain) {
        await api.patch(`/admin/domains/${editingDomain._id}`, payload);
      } else {
        await api.post('/admin/domains', payload);
      }

      setIsModalOpen(false);
      await fetchDomains();
    } catch (err: any) {
      console.error('Save domain error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Layers className="w-6 h-6 text-blue-900" />
            <span>{isTa ? 'அரசு நலத் துறைகள் நிர்வாகம்' : 'Welfare Domain Taxonomy Management'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTa ? 'மாநில அரசு வளர்ச்சித் துறைகள் மற்றும் நலத்திட்டங்களின் வகைப்பாடு' : 'Manage core welfare domain categories, display order, and scheme allocation'}
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isTa ? 'புதிய துறை சேர்க்க' : 'Add New Welfare Domain'}</span>
        </button>
      </div>

      {/* Domain Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">{isTa ? 'மொத்த துறைகள்' : 'Total Domains'}</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.totalDomains || domains.length}</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">{isTa ? 'மொத்த திட்டங்கள்' : 'Total Schemes'}</span>
          <span className="text-2xl font-black text-blue-950 mt-1 block">{stats.totalSchemes || 0}</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30">
          <span className="text-[10px] font-extrabold uppercase text-emerald-800 block">{isTa ? 'வெளியிடப்பட்டவை' : 'Published Schemes'}</span>
          <span className="text-2xl font-black text-emerald-950 mt-1 block">{stats.publishedSchemes || 0}</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-amber-200 bg-amber-50/30">
          <span className="text-[10px] font-extrabold uppercase text-amber-800 block">{isTa ? 'வரைவு நிலை' : 'Draft Schemes'}</span>
          <span className="text-2xl font-black text-amber-950 mt-1 block">{stats.draftSchemes || 0}</span>
        </div>
      </div>

      {/* Domain Taxonomy Table */}
      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading domains...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Icon</th>
                  <th className="py-3.5 px-4">Domain Key</th>
                  <th className="py-3.5 px-4">English Name</th>
                  <th className="py-3.5 px-4">Tamil Name</th>
                  <th className="py-3.5 px-4">Schemes</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Order</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {domains.map((d) => {
                  const IconCmp = iconComponents[d.iconName] || Award;
                  return (
                    <tr key={d._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900">
                          <IconCmp className="w-4 h-4" />
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-blue-950">{d.domainKey}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{d.name?.en}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{d.name?.ta}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                          {d.schemeCount || 0} Schemes
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          d.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {d.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-bold">{d.displayOrder}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => navigate(`/admin/schemes?domainKey=${d.domainKey}`)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded font-bold transition-all text-[11px] inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Schemes</span>
                        </button>

                        <button
                          onClick={() => handleOpenModal(d)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold transition-all text-[11px] inline-flex items-center space-x-1"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Create/Edit Domain */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="glass-card bg-white p-6 rounded-3xl max-w-lg w-full space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {editingDomain ? (isTa ? 'துறையைத் திருத்துக' : 'Edit Welfare Domain') : (isTa ? 'புதிய துறை சேர்க்க' : 'Add New Welfare Domain')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDomain} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Domain Key (Unique Identifier)</label>
                <input
                  type="text"
                  required
                  value={formData.domainKey}
                  disabled={!!editingDomain}
                  onChange={(e) => setFormData({ ...formData, domainKey: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">English Name</label>
                  <input
                    type="text"
                    required
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">தமிழ் பெயர்</label>
                  <input
                    type="text"
                    required
                    value={formData.nameTa}
                    onChange={(e) => setFormData({ ...formData, nameTa: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Icon Component Name</label>
                  <select
                    value={formData.iconName}
                    onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900"
                  >
                    {Object.keys(iconComponents).map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">English Description</label>
                <textarea
                  rows={2}
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">தமிழ் விளக்கம்</label>
                <textarea
                  rows={2}
                  value={formData.descriptionTa}
                  onChange={(e) => setFormData({ ...formData, descriptionTa: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-900 text-white font-bold rounded-xl"
                >
                  {saving ? 'Saving...' : 'Save Domain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
