import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Award, Clock } from 'lucide-react';

export const MyBenefitsPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [benefits, setBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBenefits();
  }, []);

  const fetchBenefits = async () => {
    try {
      const res = await api.get('/applications/my-portfolio');
      setBenefits(res.data.activeBenefits || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-xs text-slate-400">Loading approved benefits...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isTa ? 'பெறப்பட்ட அரசு உதவிகள் (My Benefits)' : 'Approved Benefit Release Records'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'அரசு வழங்கிய மாத உதவித்தொகைகள் மற்றும் புதுப்பித்தல் தகவல்கள்' : 'Active direct benefit transfer records and upcoming renewal due dates'}
        </p>
      </div>

      <div className="space-y-4">
        {benefits.length === 0 ? (
          <div className="glass-card text-center py-12 p-4 rounded-2xl">
            <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">{isTa ? 'பெறப்பட்ட அரசு உதவிகள் இல்லை.' : 'No active approved benefits recorded yet.'}</p>
          </div>
        ) : (
          benefits.map((b: any) => (
            <div key={b._id} className="glass-card p-5 rounded-2xl bg-gradient-to-r from-emerald-50/60 to-teal-50/60 border border-emerald-300 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                  {b.benefitReferenceNo}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  {isTa ? b.schemeId?.name?.ta : b.schemeId?.name?.en}
                </h3>
                <div className="text-xs text-slate-500 mt-1">
                  Disbursement Amount: <span className="font-bold text-emerald-800">₹{b.disbursementAmount} / {b.disbursementFrequency}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 inline-block mb-1">
                  ACTIVE BENEFIT
                </span>
                {b.nextRenewalDate && (
                  <div className="text-[11px] text-slate-500 flex items-center space-x-1 justify-end">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Next Renewal Due: {new Date(b.nextRenewalDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
