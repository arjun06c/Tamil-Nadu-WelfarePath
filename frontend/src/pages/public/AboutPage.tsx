import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Info } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {isTa ? 'எங்களைப் பற்றி (About WelfarePath)' : 'About Tamil Nadu WelfarePath'}
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          {isTa ? 'தகவல் அறியும் உரிமை மற்றும் எளிய சமூக நலத்திட்ட தகுதி தளம்' : 'An explainable social welfare decision-support system'}
        </p>
      </div>

      <div className="glass-card p-8 rounded-3xl border border-slate-200 leading-relaxed text-xs text-slate-700 space-y-4">
        <p>
          {isTa
            ? 'தமிழ்நாடு நலன்பாதை என்பது குடிமக்கள் அரசு நலத்திட்டங்களை எளிதாக கண்டறியவும், தகுதி நிபந்தனைகளை தெளிவாக புரிந்து கொள்ளவும் உருவாக்கப்பட்ட தளமாகும்.'
            : 'Tamil Nadu WelfarePath is a citizen-centric platform built to reduce information asymmetry, explain eligibility criteria transparently, and streamline document preparation.'}
        </p>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-blue-950 flex items-start space-x-2">
          <Info className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
          <p className="font-semibold">
            {isTa
              ? 'திட்ட நிபந்தனைகள் மற்றும் விண்ணப்ப நடைமுறைகளைச் சம்பந்தப்பட்ட அரசுத் துறையின் மூலம் உறுதிப்படுத்திக் கொள்ளவும்.'
              : 'Please confirm scheme conditions and application procedures through the relevant official department.'}
          </p>
        </div>
      </div>
    </div>
  );
};
