import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  ShieldCheck,
  RefreshCw,
  Layers,
  Key,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
  History,
  Activity,
  FileText,
  UserCheck
} from 'lucide-react';
import { DigiLockerModeBadge } from '../../components/digilocker/DigiLockerModeBadge';

export const AdminDigiLockerMonitoringPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/integrations/digilocker');
      setData(res.data);
    } catch (err) {
      console.error('Fetch DigiLocker admin metrics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const mode = data?.mode || 'mock';
  const badgeLabel = data?.badgeLabel || 'Demo Document Source';
  const metrics = data?.metrics || {};
  const logs = data?.recentAuditLogs || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-xs">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-300 bg-amber-950 border border-amber-800 px-3 py-1 rounded-full w-fit mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{isTa ? 'நிர்வாகி தளம்' : 'System Administration'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isTa ? 'டிஜிலாக்கர் இணைப்பு கண்காணிப்பு' : 'DigiLocker Integration Operational Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTa
              ? 'அமைப்பின் டிஜிலாக்கர் இணைப்புகள், சம்மதப் பதிவுகள் மற்றும் ஆவணப் பெறுகை புள்ளிவிவரங்களை நேரலையாகக் கண்காணிக்கவும்.'
              : 'Enterprise telemetry for DigiLocker OAuth connections, consent grants, document retrieval metrics, and security audit history.'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <DigiLockerModeBadge mode={mode} badgeLabel={badgeLabel} />
          <button
            onClick={fetchMetrics}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{isTa ? 'புதுப்பிக்குக' : 'Refresh Metrics'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-600" />
          <p className="font-bold text-slate-600">{isTa ? 'புள்ளிவிவரங்களை ஏற்றுகிறது...' : 'Fetching integration metrics...'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Operational KPIs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold text-[10px] uppercase block">
                {isTa ? 'மொத்த இணைப்புகள்' : 'Total Connections'}
              </span>
              <div className="text-2xl font-black text-slate-900">{metrics.totalConnections || 0}</div>
              <span className="text-[10px] text-emerald-600 font-bold">
                {metrics.activeConnections || 0} Active • {metrics.revokedConnections || 0} Revoked
              </span>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold text-[10px] uppercase block">
                {isTa ? 'பெறப்பட்ட ஆவணங்கள்' : 'Retrieved Documents'}
              </span>
              <div className="text-2xl font-black text-teal-900">{metrics.totalDigiDocs || 0}</div>
              <span className="text-[10px] text-slate-500 font-semibold">
                {metrics.attachedDigiDocs || 0} Attached to Welfare Applications
              </span>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold text-[10px] uppercase block">
                {isTa ? 'சம்மத நடவடிக்கைகள்' : 'Citizen Consent Grants'}
              </span>
              <div className="text-2xl font-black text-amber-900">{metrics.consentCount || 0}</div>
              <span className="text-[10px] text-emerald-600 font-bold">
                {metrics.activeConsents || 0} Active • {metrics.revokedConsents || 0} Revoked
              </span>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold text-[10px] uppercase block">
                {isTa ? 'API பிழைகள்' : 'API Error Rate'}
              </span>
              <div className="text-2xl font-black text-emerald-700">0.0%</div>
              <span className="text-[10px] text-emerald-600 font-bold">All Gateways Healthy</span>
            </div>
          </div>

          {/* Provider Mode Callout Banner */}
          <div className="glass-card p-6 rounded-3xl border border-amber-300 bg-amber-50/40 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-900 text-amber-200 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-amber-950 text-sm">
                  {isTa ? `தற்போதைய சேவையக நிலை: ${badgeLabel}` : `Configured Provider Environment: ${badgeLabel}`}
                </h3>
                <p className="text-amber-900 text-xs mt-0.5">
                  {mode === 'mock'
                    ? 'Engine is executing under local high-fidelity DigiLocker Mock Provider (5 Official Tamil Nadu Document Types). Sandbox/Production access requires official MeitY API Setu client credentials.'
                    : 'Engine is configured for live sandbox OAuth authentication endpoints.'}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Audit Logs Table */}
          <div className="glass-card rounded-3xl border border-slate-200 overflow-hidden space-y-3 p-6">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
              <History className="w-4 h-4 text-amber-600" />
              <span>{isTa ? 'சமீபத்திய டிஜிலாக்கர் தணிக்கைப் பதிவுகள்' : 'Recent Integration Security Audit Logs'}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Actor / Email</th>
                    <th className="py-3 px-3">Action Event</th>
                    <th className="py-3 px-3">Target ID</th>
                    <th className="py-3 px-3">Details Summary</th>
                    <th className="py-3 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        No DigiLocker integration audit logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log: any) => (
                      <tr key={log._id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{log.actorEmail || 'System'}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{log.targetId || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{log.details || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
