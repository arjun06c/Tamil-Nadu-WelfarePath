import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Heart, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="md:col-span-2">
            <h3 className="text-lg font-bold text-white mb-2">
              {isTa ? 'தமிழ்நாடு நலன்பாதை' : 'Tamil Nadu WelfarePath'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mb-4">
              {isTa
                ? 'தமிழ்நாடு மக்களின் நலனுக்காக உருவாக்கப்பட்ட தகுதி சரிபார்ப்பு மற்றும் உதவித்தொகை வழிகாட்டி தளம்.'
                : 'An explainable social welfare decision-support platform enabling Tamil Nadu citizens to discover eligible state benefits, understand rule gaps, and track their welfare journey.'}
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-800/50 w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>{isTa ? 'தமிழ்நாடு நலப்பாதை 2026' : 'Tamil Nadu WelfarePath 2026'}</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              {isTa ? 'முக்கிய பக்கங்கள்' : 'Quick Navigation'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/schemes" className="hover:text-teal-400 transition-colors">{isTa ? 'அனைத்து நலத்திட்டங்கள்' : 'Explore Welfare Schemes'}</a></li>
              <li><a href="/dashboard" className="hover:text-teal-400 transition-colors">{isTa ? 'என் நலன்பாதை டாஷ்போர்டு' : 'My Welfare Portfolio'}</a></li>
              <li><a href="/profile" className="hover:text-teal-400 transition-colors">{isTa ? 'சுயவிவரம் புதுப்பித்தல்' : 'Citizen Profile Builder'}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              {isTa ? 'அரசு தளங்கள்' : 'Government Portals'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="https://tn.gov.in" target="_blank" rel="noreferrer" className="flex items-center space-x-1 hover:text-teal-400">
                  <span>tn.gov.in</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://tnesevai.tn.gov.in" target="_blank" rel="noreferrer" className="flex items-center space-x-1 hover:text-teal-400">
                  <span>e-Sevai Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://penkalvi.tn.gov.in" target="_blank" rel="noreferrer" className="flex items-center space-x-1 hover:text-teal-400">
                  <span>Pudhumai Penn Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between">
          <p>© 2026 Tamil Nadu WelfarePath. {isTa ? 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.' : 'All rights reserved.'}</p>
          <p className="flex items-center space-x-1 mt-2 md:mt-0">
            <span>{isTa ? 'உருவாக்கப்பட்டது' : 'Crafted with'}</span>
            <Heart className="w-3 h-3 text-red-500 fill-current" />
            <span>{isTa ? 'தமிழ்நாட்டிற்காக' : 'for Tamil Nadu Citizens'}</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
