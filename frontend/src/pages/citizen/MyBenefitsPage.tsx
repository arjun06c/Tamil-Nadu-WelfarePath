import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Award,
  Clock,
  CheckCircle2,
  Calendar,
  Landmark,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  TrendingUp,
  Copy,
  Check,
  FileText
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { EmptyState } from '../../components/common/EmptyState';

export const MyBenefitsPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [benefits, setBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

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

  const handleCopy = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Calculate total monthly disbursement amount
  const totalMonthlyAmount = benefits.reduce((acc, b) => {
    const amt = Number(b.disbursementAmount) || 0;
    return acc + amt;
  }, 0);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#10243A] border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-500">
          {isTa ? 'பெறப்பட்ட உதவிகள் பெறப்படுகின்றன...' : 'Loading approved welfare benefits...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title={isTa ? 'பெறப்பட்ட அரசு உதவிகள்' : 'Approved Benefits & Disbursements'}
        subtitle={
          isTa
            ? 'அரசு வழங்கிய நேரடி பணப் பயன் (DBT), உதவித்தொகை மற்றும் புதுப்பித்தல் காலவரிசை'
            : 'Official records of approved Direct Benefit Transfers (DBT), monthly grants, and renewal schedules'
        }
        badge={isTa ? 'நேரடி பணப்பயன் (DBT)' : 'State DBT Sanctions'}
        badgeVariant="teal"
        icon={Award}
        breadcrumbs={[
          { label: isTa ? 'முகப்பு' : 'Dashboard', href: '/citizen/dashboard' },
          { label: isTa ? 'உதவிகள்' : 'Approved Benefits' }
        ]}
      />

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={isTa ? 'செயலிலுள்ள அரசு உதவிகள்' : 'Active Approved Benefits'}
          value={benefits.length}
          subtext={isTa ? 'அங்கீகரிக்கப்பட்ட திட்டங்கள்' : 'Sanctioned by department'}
          icon={Award}
          variant="teal"
        />

        <StatCard
          title={isTa ? 'மாதாந்திர உதவித்தொகை' : 'Total Monthly Disbursement'}
          value={`₹${totalMonthlyAmount.toLocaleString('en-IN')}`}
          subtext={isTa ? 'நேரடி வங்கி பரிமாற்றம் (DBT)' : 'Direct Aadhaar transfer'}
          icon={TrendingUp}
          variant="emerald"
        />

        <StatCard
          title={isTa ? 'வங்கி கணக்கு நிலை' : 'DBT Bank Account Status'}
          value={isTa ? 'இணைக்கப்பட்டது' : 'Aadhaar Linked'}
          subtext={isTa ? 'NPCI சரிபார்க்கப்பட்டது' : 'NPCI mapper verified'}
          icon={ShieldCheck}
          variant="blue"
        />
      </div>

      {/* Government DBT Direct Transfer Notice */}
      <div className="gov-card p-4 bg-teal-50/50 border border-teal-200/80 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-xs text-teal-950 leading-relaxed">
          <span className="font-extrabold block mb-0.5">
            {isTa
              ? 'தமிழ்நாடு அரசு நேரடி பணப் பரிமாற்றம் (DBT) பாதுகாப்பு உத்தரவாதம்'
              : 'Official Government of Tamil Nadu Direct Benefit Transfer (DBT) Guarantee'}
          </span>
          {isTa
            ? 'அனைத்து உதவித்தொகைகளும் இடைத்தரகர்கள் இன்றி, உங்கள் ஆதார் இணைக்கப்பட்ட வங்கிக் கணக்கிற்கு நேரடியாக மின்னணு முறையில் செலுத்தப்படுகின்றன.'
            : 'All welfare grants and scholarship disbursements are credited directly to your Aadhaar-seeded bank account through the Public Financial Management System (PFMS).'}
        </div>
      </div>

      {/* Benefits List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
          <span>
            {benefits.length} {isTa ? 'செயலிலுள்ள உதவிகள் உள்ளன' : 'active benefits registered'}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {isTa ? 'அரசு ஆணை எண் விவரங்கள்' : 'Government Sanction Order Details'}
          </span>
        </div>

        {benefits.length === 0 ? (
          <EmptyState
            icon={Award}
            title={isTa ? 'செயலிலுள்ள உதவிகள் எதுவும் இல்லை' : 'No Active Benefits Recorded Yet'}
            description={
              isTa
                ? 'உங்கள் தகுதியான திட்டங்களுக்கு விண்ணப்பித்து, ஒப்புதல் பெற்றவுடன் உதவித்தொகை மற்றும் பரிமாற்ற விபரங்கள் இங்கு தோன்றும்.'
                : 'Once your applications are officially reviewed and approved by the department, your sanction orders and disbursement schedules will appear here.'
            }
            actionText={isTa ? 'தகுதியான திட்டங்களை பார்க்க' : 'View My Eligible Schemes'}
            onAction={() => window.location.assign('/citizen/eligible-schemes')}
          />
        ) : (
          benefits.map((b: any) => {
            const schemeName = isTa
              ? b.schemeId?.name?.ta || b.schemeId?.name?.en
              : b.schemeId?.name?.en;

            return (
              <div
                key={b._id}
                className="gov-card p-5 space-y-4 hover:border-slate-300 transition-all duration-200"
              >
                {/* Header: Sanction Reference No & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopy(b.benefitReferenceNo)}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-extrabold bg-teal-50 text-teal-900 border border-teal-200 hover:bg-teal-100 transition-colors"
                      title="Click to copy sanction reference number"
                    >
                      <span className="uppercase">{b.benefitReferenceNo}</span>
                      {copiedRef === b.benefitReferenceNo ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-teal-600" />
                      )}
                    </button>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Sanctioned Record
                    </span>
                  </div>

                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isTa ? 'செயலில் உள்ளது' : 'ACTIVE BENEFIT'}</span>
                  </span>
                </div>

                {/* Scheme & Disbursement Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <h3 className="text-base font-extrabold text-[#172B4D] leading-snug">
                      {schemeName}
                    </h3>
                    {b.schemeId?.department && (
                      <p className="text-xs text-slate-500 flex items-center space-x-1.5">
                        <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {isTa ? b.schemeId.department.ta : b.schemeId.department.en}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Disbursement Card */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      {isTa ? 'வழங்கப்படும் தொகை' : 'Disbursement Grant'}
                    </span>
                    <div className="text-base font-extrabold text-emerald-700 mt-0.5">
                      ₹{Number(b.disbursementAmount || 0).toLocaleString('en-IN')}{' '}
                      <span className="text-xs text-slate-500 font-medium">
                        / {b.disbursementFrequency || 'monthly'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Renewal & Payment Channel */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1.5 text-slate-600">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <span>
                        Channel:{' '}
                        <span className="font-bold text-slate-800">
                          Aadhaar DBT Account
                        </span>
                      </span>
                    </div>

                    {b.nextRenewalDate && (
                      <div className="flex items-center space-x-1.5 text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>
                          {isTa ? 'அடுத்த புதுப்பித்தல்: ' : 'Next Renewal Due: '}
                          <span className="font-bold text-slate-800">
                            {new Date(b.nextRenewalDate).toLocaleDateString()}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/schemes/${b.schemeId?._id}`}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
                  >
                    <span>{isTa ? 'திட்ட விதிகள்' : 'View Scheme Guidelines'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
