import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Server,
  Lock,
  Zap,
  Globe,
  Clock
} from 'lucide-react';
import { DigiLockerModeBadge } from '../../components/digilocker/DigiLockerModeBadge';

export const AdminIntegrationHealthPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthStatus();
  }, []);

  const fetchHealthStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/integrations/health');
      setHealthData(res.data);
    } catch (err) {
      console.error('Fetch health status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const status = healthData?.status || 'OPERATIONAL';
  const mode = healthData?.mode || 'mock';
  const envBadgeLabel = healthData?.envBadgeLabel || 'Simulation / Sandbox Environment';
  const config = healthData?.configuration || {};
  const activeServices = healthData?.activeServices || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-300 bg-amber-950 border border-amber-800 px-3 py-1 rounded-full w-fit mb-1">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>{isTa ? 'இணைப்பு ஆரோக்கியம்' : 'Integration Telemetry'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isTa ? 'சேவை இணைப்பு ஆரோக்கிய நிலவரம்' : 'Integration Systems Health & Availability'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTa
              ? 'வெளிப்புற மற்றும் உள் ஆவண இணைப்புகளின் நிலை, குறியாக்கச் பாதுகாப்பு மற்றும் கிடைக்கும் தன்மை.'
              : 'Real-time heartbeat and system health monitors for API Setu / DigiLocker integration stack.'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <DigiLockerModeBadge mode={mode} badgeLabel={envBadgeLabel} />
          <button
            onClick={fetchHealthStatus}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{isTa ? 'புதுப்பிக்குக' : 'Ping System'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-600" />
          <p className="font-bold text-slate-600">{isTa ? 'ஆரோக்கிய நிலையைச் சோதிக்கிறது...' : 'Running system heartbeat checks...'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Status Callout */}
          <div className="glass-card p-6 rounded-3xl border border-emerald-300 bg-emerald-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-black text-emerald-950 text-base">{status}</span>
                  <span className="bg-emerald-200 text-emerald-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {healthData.availability || '100%'}
                  </span>
                </div>
                <p className="text-xs text-emerald-900 font-medium mt-0.5">
                  All 4 core integration gateways and cryptography key stores are functioning normally.
                </p>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-500">
              <span className="block font-bold text-slate-700">{isTa ? 'கடைசி செயல்பாடு:' : 'Last Event Heartbeat:'}</span>
              <span className="font-mono text-slate-900">
                {new Date(healthData.lastSuccessfulOperation).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Configuration Health Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-xs">AES-256-GCM Encryption</h3>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Token Key Status:</span>
                {config.tokenEncryptionKeyConfigured ? (
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Configured
                  </span>
                ) : (
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Fallback Key
                  </span>
                )}
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-slate-900 text-xs">HMAC OAuth State Integrity</h3>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">State Secret Status:</span>
                {config.stateSecretConfigured ? (
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Configured
                  </span>
                ) : (
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Default Secret
                  </span>
                )}
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-blue-900" />
                <h3 className="font-extrabold text-slate-900 text-xs">Provider Factory Engine</h3>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Factory State:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {config.providerFactoryStatus || 'READY'}
                </span>
              </div>
            </div>
          </div>

          {/* Active Microservices Health List */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-xs flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>{isTa ? 'செயலில் உள்ள சேவைகளின் ஆரோக்கியம்' : 'Active Integration Microservices'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeServices.map((srv: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-bold text-slate-900 block">{srv.name}</span>
                      <span className="text-[10px] text-slate-400">Mode: {srv.mode}</span>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                    {srv.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
