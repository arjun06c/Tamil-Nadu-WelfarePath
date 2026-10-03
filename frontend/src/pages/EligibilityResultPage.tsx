import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { EligibilityCriteriaTable } from '../components/EligibilityCriteriaTable';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, RefreshCw, FileText } from 'lucide-react';

export const EligibilityResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { lang } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isTa = lang === 'ta';

  useEffect(() => {
    fetchEvaluation();
  }, [id]);

  const fetchEvaluation = async () => {
    try {
      const res = await api.post(`/schemes/${id}/evaluate`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-xs text-slate-400">Evaluating eligibility rules...</div>;
  if (!data) return <div className="text-center py-20 text-xs text-slate-400">Evaluation data unavailable.</div>;

  const { scheme, evaluation, outcome } = data;
  const status = outcome?.status || evaluation?.status;
  const gapRemarks = isTa ? outcome?.gapAnalysisRemarks?.ta : outcome?.gapAnalysisRemarks?.en;

  const name = isTa ? scheme?.name?.ta : scheme?.name?.en;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      
      {/* Header Banner */}
      <div className="glass-card p-8 rounded-3xl mb-8 relative overflow-hidden">
        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
          {isTa ? 'விளக்கமான தகுதி அறிக்கை' : 'Explainable Eligibility Assessment Report'}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">
          {name}
        </h1>

        {/* Status Badge Box */}
        <div className="mb-6 space-y-3">
          {/* Document Verification Provenance Pills */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            {data?.isVerifiedMatch && (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold border border-emerald-300 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isTa ? 'சரிபார்க்கப்பட்ட ஆவணத் தகவல் பயன்படுத்தப்பட்டது' : 'Verified Document Information Used'}</span>
              </span>
            )}
            {data?.isPreliminaryMatch && !data?.isVerifiedMatch && (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold border border-amber-300 flex items-center space-x-1">
                <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                <span>{isTa ? 'முன்னோட்டத் திட்டப் பொருத்தம் (அதிகாரி சரிபார்ப்பு நிலுவையில்)' : 'Preliminary Match (Pending Officer Verification)'}</span>
              </span>
            )}
          </div>

          {status === 'ELIGIBLE' && (
            <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-2xl flex items-start space-x-3 text-emerald-950">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold badge-eligible inline-block mb-2">
                  {isTa ? 'முழு தகுதி பெறுகிறீர்கள்' : 'POTENTIALLY ELIGIBLE'}
                </span>
                <p className="text-xs leading-relaxed font-medium">{gapRemarks}</p>
              </div>
            </div>
          )}

          {status === 'NEAR_ELIGIBLE' && (
            <div className="bg-amber-50 border border-amber-300 p-5 rounded-2xl flex items-start space-x-3 text-amber-950">
              <AlertTriangle className="w-7 h-7 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold badge-near-eligible inline-block mb-2">
                  {isTa ? 'தகவல் / சான்றிதழ் தேவைப்படுகிறது (Needs More Info)' : 'NEEDS MORE INFORMATION'}
                </span>
                <p className="text-xs leading-relaxed font-medium">{gapRemarks}</p>
              </div>
            </div>
          )}

          {status === 'NOT_ELIGIBLE' && (
            <div className="bg-red-50 border border-red-300 p-5 rounded-2xl flex items-start space-x-3 text-red-950">
              <XCircle className="w-7 h-7 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold badge-not-eligible inline-block mb-2">
                  {isTa ? 'தற்போது தகுதியற்றது' : 'CURRENTLY NOT ELIGIBLE'}
                </span>
                <p className="text-xs leading-relaxed font-medium">{gapRemarks}</p>
              </div>
            </div>
          )}

          {/* Conflict Warnings */}
          {data?.conflictDetails && data.conflictDetails.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl text-xs text-amber-950 space-y-1.5">
              <span className="font-extrabold flex items-center space-x-1 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>{isTa ? 'சுயவிவர தகவல் வேறுபாடு கண்டறியப்பட்டது:' : 'Information Differs From Profile:'}</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900 font-medium">
                {data.conflictDetails.map((conflict: string, idx: number) => (
                  <li key={idx}>{conflict}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {(status === 'ELIGIBLE' || status === 'NEAR_ELIGIBLE') && (
            <button
              onClick={() => navigate(`/apply/${scheme._id}`)}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-900 to-teal-700 hover:from-blue-800 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <span>{isTa ? 'விண்ணப்பிக்க தொடங்குக' : 'Proceed to Application Form'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <Link
            to="/profile"
            className="w-full sm:w-auto px-5 py-3.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isTa ? 'சுயவிவரத்தை புதுப்பிக்க' : 'Update Citizen Profile'}</span>
          </Link>
        </div>

      </div>

      {/* Detailed Breakdown Criteria Table */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <FileText className="w-4 h-4 text-blue-900" />
          <span>{isTa ? 'அளவுகோல் விவரிப்பு அட்டவணை' : 'Detailed Criteria Breakdown'}</span>
        </h2>

        <EligibilityCriteriaTable criteria={outcome?.criteriaBreakdown || evaluation?.criteriaBreakdown} />
      </div>

    </div>
  );
};
