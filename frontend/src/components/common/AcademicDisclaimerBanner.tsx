import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Info } from 'lucide-react';

export const AcademicDisclaimerBanner: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  return (
    <div className="bg-blue-950 text-slate-200 px-4 py-2 text-xs border-b border-blue-900/60 flex items-center justify-center space-x-2 text-center shadow-2xs">
      <Info className="w-4 h-4 text-amber-400 shrink-0" />
      <span>
        {isTa
          ? 'நலத்திட்ட தகவல் மற்றும் உதவிக்கான கல்வி முன்மாதிரி தளம். இறுதி விவரங்களுக்கு அதிகாரப்பூர்வ அரசு இணையதளங்களை சரிபார்க்கவும்.'
          : 'Independent academic prototype for welfare information and assistance. Always verify details through official government portals.'}
      </span>
    </div>
  );
};
