import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Award, FileText, ArrowRight, CheckCircle2, AlertTriangle, XCircle, Landmark, ExternalLink } from 'lucide-react';
import { StatusBadge } from './common/StatusBadge';

interface SchemeCardProps {
  scheme: any;
  status?: 'ELIGIBLE' | 'NEAR_ELIGIBLE' | 'NOT_ELIGIBLE' | 'STRONG_MATCH' | 'POTENTIAL_MATCH';
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

  const name = isTa ? scheme.name?.ta || scheme.name?.en : scheme.name?.en;
  const department = isTa ? scheme.department?.ta || scheme.department?.en : scheme.department?.en;
  const description = isTa ? scheme.description?.ta || scheme.description?.en : scheme.description?.en;
  const benefit = isTa ? scheme.benefitSummary?.ta || scheme.benefitSummary?.en : scheme.benefitSummary?.en;
  const domain = scheme.domainKey ? scheme.domainKey.replace(/_/g, ' ') : '';

  return (
    <div className="gov-card p-6 flex flex-col justify-between relative group hover:border-slate-300 transition-all duration-200">
      
      {/* Top Header Tags */}
      <div>
        <div className="flex items-start justify-between gap-2.5 mb-3">
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 text-[#10243A] border border-slate-200 tracking-wider">
              {scheme.schemeCode}
            </span>
            {domain && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">
                {domain}
              </span>
            )}
          </div>

          {status && (
            <StatusBadge status={status} isTamil={isTa} size="sm" />
          )}
        </div>

        {/* Scheme Title */}
        <h3 className="text-[15px] font-bold text-[#172B4D] mb-1.5 line-clamp-2 leading-snug group-hover:text-blue-700 transition-colors">
          <Link to={`/schemes/${scheme._id}`}>{name}</Link>
        </h3>

        {/* Department Name */}
        {department && (
          <p className="text-xs text-slate-500 font-medium mb-3 flex items-center space-x-1.5">
            <Landmark className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span className="truncate">{department}</span>
          </p>
        )}

        {/* Description */}
        {description && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
            {description}
          </p>
        )}
      </div>

      {/* Financial Benefit & Criteria Highlights */}
      <div>
        {benefit && (
          <div className="bg-slate-50/80 rounded-xl p-3 mb-3.5 border border-slate-200/80">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">
              {isTa ? 'அரசு உதவித்தொகை / பயன்' : 'Official Financial Benefit'}
            </div>
            <div className="text-xs font-extrabold text-emerald-800 line-clamp-1">
              {benefit}
            </div>
          </div>
        )}

        {/* Gap Remarks / Notice if any */}
        {gapRemarks && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3.5 text-[11px] text-amber-900 flex items-start space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">{isTa ? 'தேவைப்படும் நடவடிக்கை:' : 'Action Required:'}</span>
              <span className="line-clamp-2">{isTa ? gapRemarks.ta : gapRemarks.en}</span>
            </div>
          </div>
        )}

        {/* Card Footer: Metadata & Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {scheme.requiredDocuments?.length || 0} {isTa ? 'ஆவணங்கள்' : 'Docs Required'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to={`/schemes/${scheme._id}`}
              className="text-xs font-bold text-slate-700 hover:text-blue-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {isTa ? 'விவரம்' : 'Details'}
            </Link>

            <Link
              to={`/citizen/apply/${scheme._id}`}
              className="flex items-center space-x-1 text-xs font-bold text-white bg-[#10243A] hover:bg-[#193352] px-3.5 py-1.5 rounded-lg transition-all shadow-sm active:scale-95"
            >
              <span>{isTa ? 'விண்ணப்பிக்க' : 'Apply Now'}</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
};
