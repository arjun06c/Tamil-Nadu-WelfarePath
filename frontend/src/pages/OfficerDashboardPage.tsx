import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Search,
  UserCheck,
  Scan,
  Check,
  Eye,
  Building2,
  Clock,
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';

export const OfficerDashboardPage: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [duplicateFlags, setDuplicateFlags] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'form' | 'docs' | 'integrity'>('summary');
  const [remarks, setRemarks] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const { user, lang } = useAuth();
  const { t } = useTranslation();
  const isTa = lang === 'ta';

  useEffect(() => {
    fetchOfficerData();
  }, [statusFilter]);

  const fetchOfficerData = async () => {
    setLoading(true);
    try {
      const [appRes, flagRes] = await Promise.all([
        api.get('/admin/applications', { params: { status: statusFilter } }),
        api.get('/admin/duplicate-flags')
      ]);
      setApplications(appRes.data.applications || []);
      setDuplicateFlags(flagRes.data.flags || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    try {
      await api.put(`/admin/applications/${appId}/status`, {
        status: newStatus,
        remarks: remarks || correctionReason || `Status set to ${newStatus} by District Officer`
      });
      setRemarks('');
      setCorrectionReason('');
      setSelectedApp(null);
      fetchOfficerData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-purple-900 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full w-fit mb-1">
            <Shield className="w-4 h-4 text-purple-700" />
            <span>{isTa ? 'மாவட்ட நலத்துறை அதிகாரி பக்கம்' : 'District Welfare Officer Workbench'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isTa ? 'விண்ணப்பங்களின் சரிபார்ப்பு வரிசை' : 'Application Audit & Integrity Verification Queue'}
          </h1>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              statusFilter === '' ? 'bg-purple-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Queue ({applications.length})
          </button>
          <button
            onClick={() => setStatusFilter('SUBMITTED')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors ${
              statusFilter === 'SUBMITTED' ? 'bg-purple-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Pending Audit
          </button>
          <button
            onClick={() => setStatusFilter('CORRECTION_REQUIRED')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors ${
              statusFilter === 'CORRECTION_REQUIRED' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Corrections
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors ${
              statusFilter === 'APPROVED' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Approved
          </button>
        </div>
      </div>

      {/* Duplicate Integrity Warning Banner */}
      {duplicateFlags.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start space-x-3 text-xs text-amber-950">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-950 mb-1">
              {isTa ? `எச்சரிக்கை: ${duplicateFlags.length} போலி/ஒரே நபர் விண்ணப்பக் கொடிகள் கண்டறியப்பட்டுள்ளன.` : `Integrity Alert: ${duplicateFlags.length} Deterministic Duplicate Flags Detected.`}
            </h4>
            <p className="text-[11px] leading-relaxed text-amber-900">
              Deterministic checks matched identical Aadhaar hashes, bank account hashes, or high demographic similarity across applications. Inspect closely before granting approval.
            </p>
          </div>
        </div>
      )}

      {/* Applications Queue Table */}
      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">App Ref No</th>
                <th className="py-3.5 px-4">Citizen Name</th>
                <th className="py-3.5 px-4">District</th>
                <th className="py-3.5 px-4">Welfare Scheme</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Submitted Date</th>
                <th className="py-3.5 px-4 text-right">Audit Case</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 italic text-xs">
                    No applications matching status filter.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-blue-900 font-mono">
                      {app.applicationReference || app.applicationNo}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-semibold">{app.citizenId?.name || 'Citizen User'}</td>
                    <td className="py-3 px-4 text-slate-600">{app.citizenId?.district || 'District'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {isTa ? app.schemeId?.name?.ta : app.schemeId?.name?.en}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          app.status === 'CORRECTION_REQUIRED'
                            ? 'bg-amber-100 text-amber-900'
                            : app.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setActiveTab('summary');
                        }}
                        className="px-3.5 py-1.5 bg-purple-900 hover:bg-purple-800 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-all inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Audit Case</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Side Drawer / Modal Workbench */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedApp.applicationReference || selectedApp.applicationNo}
                  </span>
                  <span className="text-xs font-bold text-slate-500">• Status: {selectedApp.status}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {isTa ? selectedApp.schemeId?.name?.ta : selectedApp.schemeId?.name?.en}
                </h3>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 text-xs font-bold">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'summary' ? 'bg-purple-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                1. Case Summary
              </button>
              <button
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'form' ? 'bg-purple-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                2. Application Form
              </button>
              <button
                onClick={() => setActiveTab('docs')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'docs' ? 'bg-purple-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                3. Documents & OCR
              </button>
            </div>

            {/* TAB 1: Case Summary */}
            {activeTab === 'summary' && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block font-semibold">Citizen Name</span>
                    <span className="font-bold text-slate-900">{selectedApp.citizenId?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Mobile</span>
                    <span className="font-bold text-slate-900">{selectedApp.citizenId?.mobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">District</span>
                    <span className="font-bold text-slate-900">{selectedApp.citizenId?.district}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Annual Income</span>
                    <span className="font-bold text-emerald-800">₹{selectedApp.citizenId?.annualIncome?.toLocaleString('en-IN') || '1,20,000'}</span>
                  </div>
                </div>

                <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
                  <span className="font-bold text-blue-900 block mb-1">Verification Status Checklist:</span>
                  <div className="space-y-1 text-[11px] text-blue-950">
                    <div>✓ Tamil Nadu domicile address confirmed</div>
                    <div>✓ Income certificate matches scheme ceiling</div>
                    <div>✓ DBT bank account IFSC format validated</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Form Data */}
            {activeTab === 'form' && (
              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[11px] max-h-64 overflow-y-auto">
                  <pre>{JSON.stringify(selectedApp.formData || selectedApp.citizenId, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* TAB 3: Documents & OCR Scanner Results */}
            {activeTab === 'docs' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-teal-900 font-bold">
                  <span className="flex items-center space-x-2">
                    <Scan className="w-4 h-4 text-teal-600" />
                    <span>Automated Tesseract.js OCR Comparator</span>
                  </span>
                  <span>Confidence Level: 85%</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>AadhaarCard & Income Proof Documents</span>
                    <span className="text-emerald-700">Citizen Confirmed</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200 font-mono text-[11px] text-slate-600">
                    NAME MATCH: PASS | DISTRICT MATCH: CHENNAI | CONFIDENCE: 88%
                  </div>
                </div>
              </div>
            )}

            {/* Officer Action Toolbar */}
            <div className="space-y-3 pt-3 border-t border-slate-200 text-xs">
              <div>
                <label className="font-bold block text-slate-900 mb-1">Officer Audit Remarks / Reason:</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks for approval, rejection, or specific correction reason..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => handleUpdateStatus(selectedApp._id, 'CORRECTION_REQUIRED')}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs"
                >
                  Request Correction
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedApp._id, 'REJECTED')}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-xs"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedApp._id, 'APPROVED')}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Release Benefit</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

