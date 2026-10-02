import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Layers } from 'lucide-react';

export const AdminDomainManagerPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const res = await api.get('/schemes/domains');
      setDomains(res.data.domains || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isTa ? 'அரசு நலத் துறைகள் நிர்வாகம்' : 'Welfare Domain Taxonomy Management'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? '10 முக்கிய மாநில அரசு வளர்ச்சித் துறைகளின் வகைப்பாடு' : 'Manage the 10 state welfare domain categories and dual-language descriptions'}
        </p>
      </div>

      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading domains...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Domain Key</th>
                  <th className="py-3.5 px-4">English Name</th>
                  <th className="py-3.5 px-4">Tamil Name</th>
                  <th className="py-3.5 px-4">Display Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {domains.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-amber-900">{d.domainKey}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{d.name?.en}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{d.name?.ta}</td>
                    <td className="py-3 px-4 text-slate-500">{d.displayOrder}</td>
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
