import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { ListTodo, Search, Filter, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const OfficerApplicationQueuePage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [applications, setApplications] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, [statusFilter, search]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/applications', {
        params: { status: statusFilter, search }
      });
      setApplications(res.data.applications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isTa ? 'விண்ணப்பப் பரிசீலனை வரிசை' : 'Officer Application Queue & Verification Workspace'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'உங்கள் மாவட்ட பிரிவில் பெறப்பட்ட அரசு நலத்திட்ட விண்ணப்பங்களின் ஆய்வு வரிசை' : 'Audit citizen case files, verify document OCR scans, and approve benefit releases'}
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search application number or citizen name..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-2 rounded-xl font-bold transition-colors ${
              statusFilter === '' ? 'bg-purple-950 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            All Queue
          </button>
          <button
            onClick={() => setStatusFilter('SUBMITTED')}
            className={`px-3 py-2 rounded-xl font-bold transition-colors ${
              statusFilter === 'SUBMITTED' ? 'bg-purple-950 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Submitted
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-2 rounded-xl font-bold transition-colors ${
              statusFilter === 'APPROVED' ? 'bg-purple-950 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Approved
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">Loading queue...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Application Ref</th>
                  <th className="py-3.5 px-4">Citizen Name</th>
                  <th className="py-3.5 px-4">District</th>
                  <th className="py-3.5 px-4">Welfare Scheme</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-purple-50/40">
                    <td className="py-3 px-4 font-bold text-purple-950">{app.applicationNo}</td>
                    <td className="py-3 px-4 text-slate-900">{app.citizenId?.name || 'Citizen'}</td>
                    <td className="py-3 px-4 text-slate-600">{app.citizenId?.district || 'District'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {isTa ? app.schemeId?.name?.ta : app.schemeId?.name?.en}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-800">
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{new Date(app.createdAt).toLocaleDateString()}</td>
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
