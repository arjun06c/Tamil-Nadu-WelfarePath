import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { ShieldAlert, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const AdminIntegrityPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const res = await api.get('/admin/duplicate-flags');
      setFlags(res.data.flags || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (flagId: string, reviewStatus: string) => {
    try {
      await api.put(`/admin/duplicate-flags/${flagId}`, {
        reviewStatus,
        officerNotes: 'Reviewed by System Administrator'
      });
      fetchFlags();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isTa ? 'போலி விண்ணப்பம் & ஒருமைப்பாடு ஆய்வு' : 'Deterministic Integrity & Duplicate Review Module'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'ஆதார் ஹேஷ், வங்கி கணக்கு ஹேஷ் மற்றும் மக்கள் தொகை ஒற்றுமை அடிப்படையில் கண்டறியப்பட்டக் கொடிகள்' : 'Inspect deterministic identity matches (SHA-256 Aadhaar, Bank hash, DOB similarity) for human officer resolution'}
        </p>
      </div>

      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">Loading integrity flags...</div>
        ) : flags.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">No pending duplicate integrity flags found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Flag Type</th>
                  <th className="py-3.5 px-4">Match Details</th>
                  <th className="py-3.5 px-4">Similarity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Officer Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {flags.map((f) => (
                  <tr key={f._id} className="hover:bg-amber-50/40">
                    <td className="py-3 px-4 font-bold text-amber-900">{f.flagType}</td>
                    <td className="py-3 px-4 text-slate-800 max-w-sm leading-relaxed">{f.matchingDetails}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">{(f.similarityScore * 100).toFixed(0)}%</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                        {f.reviewStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(f._id, 'FALSE_POSITIVE')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold"
                      >
                        False Positive
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(f._id, 'CONFIRMED_DUPLICATE')}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold"
                      >
                        Confirm Duplicate
                      </button>
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
