import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Clock, FileCheck, ShieldCheck, Award, AlertCircle, XCircle } from 'lucide-react';

interface ApplicationTimelineProps {
  currentStatus: string;
  history: any[];
  officerRemarks?: string;
  correctionRequested?: string;
}

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({
  currentStatus,
  history,
  officerRemarks,
  correctionRequested
}) => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const milestones = [
    {
      key: 'SUBMITTED',
      labelEn: 'Application Submitted',
      labelTa: 'விண்ணப்பம் சமர்ப்பிக்கப்பட்டது',
      descEn: 'Citizen application logged into state portal.',
      descTa: 'விண்ணப்பம் வெற்றிகரமாக பதிவு செய்யப்பட்டது.',
      icon: Clock
    },
    {
      key: 'DOC_VERIFICATION',
      labelEn: 'Document & OCR Verification',
      labelTa: 'ஆவணங்கள் மற்றும் OCR சரிபார்ப்பு',
      descEn: 'Supporting certificates verified against profile.',
      descTa: 'சான்றிதழ்கள் மற்றும் விவரங்கள் சரிபார்க்கப்படுகின்றன.',
      icon: FileCheck
    },
    {
      key: 'OFFICER_REVIEW',
      labelEn: 'District Officer Review',
      labelTa: 'மாவட்ட அதிகாரி பரிசீலனை',
      descEn: 'Departmental officer auditing eligibility & integrity.',
      descTa: 'துறை அதிகாரி தகுதியை ஆய்வு செய்கிறார்.',
      icon: ShieldCheck
    },
    {
      key: 'APPROVED',
      labelEn: 'Approved & Benefit Released',
      labelTa: 'அங்கீகரிக்கப்பட்டு உதவித்தொகை வழங்கப்பட்டது',
      descEn: 'Final approval granted. Benefit transfer initiated.',
      descTa: 'விண்ணப்பம் அங்கீகரிக்கப்பட்டு வங்கி பரிமாற்றம் துவங்கப்பட்டது.',
      icon: Award
    }
  ];

  let activeIndex = 0;
  if (currentStatus === 'DOC_VERIFICATION') activeIndex = 1;
  if (currentStatus === 'OFFICER_REVIEW') activeIndex = 2;
  if (currentStatus === 'APPROVED') activeIndex = 3;
  if (currentStatus === 'REJECTED') activeIndex = 3;
  if (currentStatus === 'CORRECTION_REQUIRED') activeIndex = 1;

  const isRejected = currentStatus === 'REJECTED';
  const isCorrection = currentStatus === 'CORRECTION_REQUIRED';

  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center justify-between">
        <span>{isTa ? 'விண்ணப்ப நிலை முன்னேற்றம்' : 'Benefit Journey Timeline'}</span>
        <span className="text-xs px-3 py-1 rounded-full font-bold bg-blue-100 text-blue-900">
          {currentStatus}
        </span>
      </h3>

      {/* Correction Banner if flagged */}
      {isCorrection && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6 flex items-start space-x-3 text-xs text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-950 mb-1">
              {isTa ? 'திருத்தம் கோரப்பட்டுள்ளது:' : 'Correction Action Required:'}
            </h4>
            <p>{correctionRequested || (isTa ? 'தயவுசெய்து விடுபட்ட சான்றிதழை மீண்டும் பதிவேற்றவும்.' : 'Please re-upload missing or unreadable documents.')}</p>
          </div>
        </div>
      )}

      {/* Rejection Banner */}
      {isRejected && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 mb-6 flex items-start space-x-3 text-xs text-red-900">
          <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-950 mb-1">
              {isTa ? 'விண்ணப்பம் நிராகரிக்கப்பட்டது:' : 'Application Rejected:'}
            </h4>
            <p>{officerRemarks || (isTa ? 'அரசு விதிமுறைகளின்படி தகுதி பொருந்தவில்லை.' : 'Does not satisfy departmental scheme rules.')}</p>
          </div>
        </div>
      )}

      {/* Milestone Stepper */}
      <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {milestones.map((m, idx) => {
          const isDone = idx < activeIndex || (idx === activeIndex && currentStatus === 'APPROVED');
          const isCurrent = idx === activeIndex && currentStatus !== 'APPROVED' && !isRejected;

          return (
            <div key={m.key} className="relative flex items-start space-x-4">
              
              {/* Stepper Dot */}
              <div
                className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                  isDone
                    ? 'bg-emerald-600'
                    : isCurrent
                    ? 'bg-blue-900 ring-4 ring-blue-100 animate-pulse'
                    : 'bg-slate-300'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
              </div>

              {/* Step Content */}
              <div>
                <h4 className={`text-xs font-bold ${isDone || isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
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
