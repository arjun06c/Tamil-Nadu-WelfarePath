import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, XCircle } from 'lucide-react';

interface EligibilityCriteriaTableProps {
  criteria: any[];
}

export const EligibilityCriteriaTable: React.FC<EligibilityCriteriaTableProps> = ({ criteria }) => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  if (!criteria || criteria.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
          <tr>
            <th className="py-3.5 px-4">{isTa ? 'நிபந்தனை' : 'Eligibility Criterion'}</th>
            <th className="py-3.5 px-4">{isTa ? 'உங்கள் விவரம்' : 'Your Profile Value'}</th>
            <th className="py-3.5 px-4">{isTa ? 'அரசு விதி' : 'Policy Requirement'}</th>
            <th className="py-3.5 px-4">{isTa ? 'முடிவு' : 'Status'}</th>
            <th className="py-3.5 px-4">{isTa ? 'விளக்கம்' : 'Explainable Reason'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {criteria.map((item, idx) => {
            const label = isTa ? item.label?.ta : item.label?.en;
            const explanation = isTa ? item.explanation?.ta : item.explanation?.en;
            const citizenVal = item.citizenValue !== undefined && item.citizenValue !== null
              ? String(item.citizenValue)
              : (isTa ? 'வழங்கப்படவில்லை' : 'Not Provided');
            
            const reqVal = Array.isArray(item.requiredValue)
              ? item.requiredValue.join(', ')
              : String(item.requiredValue);

            return (
              <tr key={idx} className={item.passed ? 'hover:bg-emerald-50/30' : 'hover:bg-red-50/30'}>
                <td className="py-3 px-4 font-bold text-slate-900">{label}</td>
                <td className="py-3 px-4 font-semibold text-blue-900">{citizenVal}</td>
                <td className="py-3 px-4 text-slate-600">{item.operator} ({reqVal})</td>
                <td className="py-3 px-4">
                  {item.passed ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isTa ? 'நிறைவேறியது' : 'Pass'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{isTa ? 'பூர்த்தியாகவில்லை' : 'Fail'}</span>
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-500 leading-normal">{explanation}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
