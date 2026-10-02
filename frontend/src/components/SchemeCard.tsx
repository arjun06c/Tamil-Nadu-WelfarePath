import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Award, FileText, ArrowRight, CheckCircle2, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';

interface SchemeCardProps {
  scheme: any;
  status?: 'ELIGIBLE' | 'NEAR_ELIGIBLE' | 'NOT_ELIGIBLE';
  missingDocsCount?: number;
  gapRemarks?: { en: string; ta: string };
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  scheme,
  status,
  missingDocsCount,
  gapRemarks
}) => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const name = isTa ? scheme.name?.ta : scheme.name?.en;
  const department = isTa ? scheme.department?.ta : scheme.department?.en;
  const description = isTa ? scheme.description?.ta : scheme.description?.en;
  const benefit = isTa ? scheme.benefitSummary?.ta : scheme.benefitSummary?.en;

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between card-hover-effect relative overflow-hidden group">
      
      {/* Top Banner Tag */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-blue-50 text-blue-900 border border-blue-200">
            {scheme.schemeCode}
          </span>

          {/* Eligibility Badge if present */}
          {status === 'ELIGIBLE' && (
            <span className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold badge-eligible">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isTa ? 'முழு தகுதி' : 'ELIGIBLE'}</span>
            </span>
          )}

          {status === 'NEAR_ELIGIBLE' && (
            <span className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold badge-near-eligible">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isTa ? 'தகுதி பெறலாம்' : 'NEAR ELIGIBLE'}</span>
            </span>
          )}

          {status === 'NOT_ELIGIBLE' && (
            <span className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold badge-not-eligible">
              <XCircle className="w-3.5 h-3.5" />
              <span>{isTa ? 'தகுதியற்றது' : 'NOT ELIGIBLE'}</span>
            </span>
          )}
        </div>

        {/* Scheme Title */}
        <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-2 group-hover:text-blue-900 transition-colors">
          {name}
        </h3>

        {/* Department Name */}
        <p className="text-xs text-slate-500 font-medium mb-3 flex items-center space-x-1">
          <Award className="w-3.5 h-3.5 text-teal-600 inline shrink-0" />
          <span className="truncate">{department}</span>
        </p>

        {/* Short Description */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {description}
        </p>
      </div>

      {/* Bottom Info Section */}
      <div>
        {/* Benefit Box */}
        <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-200/60">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">
            {isTa ? 'அரசு உதவி தொகை' : 'Benefit Grant'}
          </div>
          <div className="text-xs font-bold text-emerald-700 truncate">
            {benefit}
          </div>
        </div>

        {/* Gap Alert if Near Eligible */}
        {status === 'NEAR_ELIGIBLE' && gapRemarks && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-4 text-[11px] text-amber-900">
            <span className="font-bold block">{isTa ? 'தேவைப்படும் ஆவணம்:' : 'Gap Action Needed:'}</span>
            <span className="line-clamp-2">{isTa ? gapRemarks.ta : gapRemarks.en}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-1 text-xs text-slate-500">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>{scheme.requiredDocuments?.length || 0} {isTa ? 'ஆவணங்கள்' : 'Required Docs'}</span>
          </div>

          <Link
            to={`/schemes/${scheme._id}`}
            className="flex items-center space-x-1 text-xs font-bold text-blue-900 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span>{isTa ? 'தகுதியை பார்க்க' : 'View Details'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

    </div>
  );
};
