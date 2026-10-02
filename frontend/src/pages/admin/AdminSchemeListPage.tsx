import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Award, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';

export const AdminSchemeListPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      const res = await api.get('/schemes');
      setSchemes(res.data.schemes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isTa ? 'அரசு நலத்திட்டங்கள் நிர்வாகம்' : 'State Welfare Scheme Management (CRUD)'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTa ? 'அரசுத் திட்டங்களை உருவாக்குதல், திருத்துதல் மற்றும் தகுதி விதிகளின் கட்டமைப்பு' : 'Create, edit, archive, and manage JSON eligibility criteria across 10 state sectors'}
          </p>
        </div>

        <Link
          to="/admin/schemes/new"
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{isTa ? 'புதிய திட்டம் சேர்க்க' : 'Create New Scheme'}</span>
        </Link>
      </div>

      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">Loading master schemes...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Scheme Code</th>
                  <th className="py-3.5 px-4">Scheme Name</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Rule Version</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {schemes.map((scheme) => (
                  <tr key={scheme._id} className="hover:bg-amber-50/30">
                    <td className="py-3 px-4 font-bold text-amber-900">{scheme.schemeCode}</td>
                    <td className="py-3 px-4 text-slate-900 font-bold max-w-xs truncate">
                      {isTa ? scheme.name?.ta : scheme.name?.en}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {isTa ? scheme.department?.ta : scheme.department?.en}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">v{scheme.ruleVersion || '1.0'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {scheme.isActive ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to={`/admin/schemes/${scheme._id}/edit`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold"
                      >
                        Edit / Rules
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
