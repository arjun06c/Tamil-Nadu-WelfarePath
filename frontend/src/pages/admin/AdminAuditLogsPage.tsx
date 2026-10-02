import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { History, Shield } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const sampleLogs = [
    { timestamp: new Date().toLocaleString(), actor: 'admin@tnwelfare.gov.in', action: 'UPDATE_SCHEME_RULES', target: 'TN-SCH-001', details: 'Rule version updated to v1.2' },
    { timestamp: new Date().toLocaleString(), actor: 'officer@tnwelfare.gov.in', action: 'APPROVE_APPLICATION', target: 'TN2026APP00123', details: 'Status updated to APPROVED by District Officer' },
    { timestamp: new Date().toLocaleString(), actor: 'system', action: 'DETERMINISTIC_DUPLICATE_CHECK', target: 'TN2026APP00124', details: 'Same Aadhaar Hash flag created' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isTa ? 'அமைப்பு தணிக்கைப் பதிவுகள் (System Audit Logs)' : 'System Audit Logs & Security Activity Feed'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'அதிகாரிகள் மற்றும் நிர்வாகிகளின் அனைத்து நடவடிக்கைகள் தணிக்கை செய்யப்படும் பதிவு' : 'Immutable audit trail of administrative rule changes, officer approvals, and system integrity checks'}
        </p>
      </div>

      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Ref</th>
                <th className="py-3.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {sampleLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{log.timestamp}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{log.actor}</td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-900 text-[11px]">{log.action}</td>
                  <td className="py-3 px-4 font-bold text-blue-900">{log.target}</td>
                  <td className="py-3 px-4 text-slate-600 leading-normal">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
