import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Clock, FileCheck, ShieldCheck, Award, AlertCircle, XCircle } from 'lucide-react';

interface ApplicationTimelineProps {
  currentStatus: string;
  history?: any[];
  officerRemarks?: string;
  correctionRequested?: string;
  pendingDocCount?: number;
}

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({
  currentStatus,
  history = [],
  officerRemarks,
  correctionRequested,
  pendingDocCount = 0
}) => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const milestones = [
    {
      key: 'SUBMITTED',
      labelEn: 'Application Submitted',
      labelTa: 'விண்ணப்பம் சமர்ப்பிக்கப்பட்டது',
      descEn: 'Citizen application logged into WelfarePath portal.',
      descTa: 'விண்ணப்பம் வெற்றிகரமாக பதிவு செய்யப்பட்டது.'
    },
    {
      key: 'DOC_VERIFICATION',
      labelEn: 'Document Verification',
      labelTa: 'சான்றிதழ் சரிபார்ப்பு',
      descEn: pendingDocCount > 0 
        ? `${pendingDocCount} document(s) awaiting officer verification.`
        : 'Supporting certificates under officer verification.',
      descTa: 'சான்றிதழ்கள் அதிகாரி சரிபார்ப்பில் உள்ளன.'
    },
    {
      key: 'OFFICER_REVIEW',
      labelEn: 'Officer Review',
      labelTa: 'அதிகாரி பரிசீலனை',
      descEn: 'Authorized reviewing officer evaluating eligibility entitlement.',
      descTa: 'அதிகாரி தகுதியை ஆய்வு செய்கிறார்.'
    },
    {
      key: 'APPROVED',
      labelEn: 'Application Approval',
      labelTa: 'விண்ணப்ப அங்கீகாரம்',
      descEn: 'Application approved by authorized reviewing officer.',
      descTa: 'விண்ணப்பம் அதிகாரியால் அங்கீகரிக்கப்பட்டது.'
    },
    {
      key: 'BENEFIT_RELEASED',
      labelEn: 'Benefit Release',
      labelTa: 'உதவித்தொகை வழங்கல்',
      descEn: 'Benefit disbursement active and credited to account.',
      descTa: 'உதவித்தொகை வங்கி கணக்கில் வழங்கப்பட்டது.'
    }
  ];

  // Determine current active step index (0-4)
  let activeIndex = 0;
  if (currentStatus === 'SUBMITTED') activeIndex = 0;
  if (currentStatus === 'DOC_VERIFICATION') activeIndex = 1;
  if (currentStatus === 'CORRECTION_REQUIRED') activeIndex = 1;
  if (currentStatus === 'OFFICER_REVIEW') activeIndex = 2;
  if (currentStatus === 'APPROVED') activeIndex = 3;
  if (currentStatus === 'BENEFIT_RELEASED' || currentStatus === 'COMPLETED') activeIndex = 4;
  if (currentStatus === 'REJECTED') activeIndex = 3;

  const isRejected = currentStatus === 'REJECTED';
  const isCorrection = currentStatus === 'CORRECTION_REQUIRED';

  return (
    <div className="glass-card rounded-2xl p-6 mb-6 border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-extrabold text-slate-900">
          {isTa ? 'விண்ணப்ப நிலை முன்னேற்றம்' : 'Application Progress Timeline'}
        </h3>
        <span
          className={`text-xs px-3 py-1 rounded-full font-extrabold border ${
            isCorrection
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : isRejected
              ? 'bg-rose-100 text-rose-900 border-rose-300'
              : currentStatus === 'BENEFIT_RELEASED' || currentStatus === 'COMPLETED' || currentStatus === 'APPROVED'
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
              : 'bg-blue-100 text-blue-900 border-blue-300'
          }`}
        >
          {isTa
            ? currentStatus === 'DOC_VERIFICATION' ? 'ஆவணங்கள் சரிபார்ப்பு'
              : currentStatus === 'CORRECTION_REQUIRED' ? 'திருத்தம் தேவை'
              : currentStatus === 'OFFICER_REVIEW' ? 'அதிகாரி பரிசீலனை'
              : currentStatus === 'APPROVED' ? 'அங்கீகரிக்கப்பட்டது'
              : currentStatus === 'BENEFIT_RELEASED' ? 'உதவித்தொகை வழங்கப்பட்டது'
              : currentStatus
            : currentStatus === 'DOC_VERIFICATION' ? 'Document Verification'
              : currentStatus === 'CORRECTION_REQUIRED' ? 'Correction Required'
              : currentStatus === 'OFFICER_REVIEW' ? 'Under Officer Review'
              : currentStatus}
        </span>
      </div>

      {/* Correction Notice */}
      {isCorrection && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6 flex items-start space-x-3 text-xs text-amber-950">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-amber-950">
              {isTa ? 'சான்றிதழ் திருத்த நடவடிக்கை தேவை:' : 'Action Required: Document Correction Requested'}
            </h4>
            <p className="text-amber-900">{correctionRequested || officerRemarks || (isTa ? 'தயவுசெய்து சான்றிதழை மீண்டும் பதிவேற்றவும்.' : 'Please update or re-upload requested certificate.')}</p>
          </div>
        </div>
      )}

      {/* Rejection Notice */}
      {isRejected && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 mb-6 flex items-start space-x-3 text-xs text-rose-950">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-rose-950">
              {isTa ? 'விண்ணப்பம் நிராகரிக்கப்பட்டது:' : 'Application Rejected:'}
            </h4>
            <p className="text-rose-900">{officerRemarks || (isTa ? 'அரசு விதிமுறைகளின்படி தகுதி பொருந்தவில்லை.' : 'Does not satisfy departmental scheme rules.')}</p>
          </div>
        </div>
      )}

      {/* Dynamic Stepper */}
      <div className="relative pl-6 space-y-7 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {milestones.map((m, idx) => {
          const isDone = idx < activeIndex || (idx === activeIndex && (currentStatus === 'BENEFIT_RELEASED' || currentStatus === 'COMPLETED'));
          const isCurrent = idx === activeIndex && currentStatus !== 'BENEFIT_RELEASED' && currentStatus !== 'COMPLETED' && !isRejected;

          return (
            <div key={m.key} className="relative flex items-start space-x-3 text-xs">
              
              {/* Stepper Node */}
              <div
                className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                  isDone
                    ? 'bg-emerald-600'
                    : isCurrent
                    ? isCorrection
                      ? 'bg-amber-600 ring-4 ring-amber-100'
                      : 'bg-blue-900 ring-4 ring-blue-100 animate-pulse'
                    : 'bg-slate-300'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
              </div>

              {/* Step Info */}
              <div>
                <h4 className={`font-extrabold text-xs ${isDone || isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
                  {isTa ? m.labelTa : m.labelEn}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isTa ? m.descTa : m.descEn}
                </p>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
