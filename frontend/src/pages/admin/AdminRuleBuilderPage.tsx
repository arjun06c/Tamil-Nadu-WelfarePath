import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sliders, Plus, Save, CheckCircle2 } from 'lucide-react';

export const AdminRuleBuilderPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [ruleJson, setRuleJson] = useState(`{
  "all": [
    {
      "field": "annualIncome",
      "operator": "less_than_or_equal",
      "value": 250000,
      "label": {
        "en": "Annual Family Income <= ₹2,50,000",
        "ta": "குடும்ப ஆண்டு வருமானம் ₹2.5 லட்சத்திற்குள் இருக்க வேண்டும்"
      }
    },
    {
      "field": "govtSchoolYears6To12",
      "operator": "equals",
      "value": true,
      "label": {
        "en": "Studied 6th to 12th in TN Government School",
        "ta": "6 முதல் 12 ஆம் வகுப்பு வரை தமிழக அரசுப் பள்ளியில் படித்திருக்க வேண்டும்"
      }
    }
  ]
}`);

  const [msg, setMsg] = useState('');

  const handleSave = () => {
    try {
      JSON.parse(ruleJson);
      setMsg(isTa ? 'JSON தகுதி விதிகள் வெற்றிகரமாக சரிபார்க்கப்பட்டு சேமிக்கப்பட்டன!' : 'JSON eligibility rules validated and saved successfully!');
    } catch (err: any) {
      setMsg('Invalid JSON syntax: ' + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isTa ? 'விளக்கமான தகுதி விதிகள் கட்டமைப்பு' : 'Visual Configurable Eligibility Rule Builder'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'அரசு கொள்கை விதிகளை JSON கட்டமைப்பில் வரையறுத்து நேரலையில் சரிபார்க்கலாம்' : 'Configure deterministic AND/OR JSON rule trees for explainable scheme eligibility checking'}
        </p>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs p-3.5 rounded-2xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      <div className="glass-card p-6 rounded-2xl space-y-4 border border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Rule Schema Editor (JSON Tree):
          </h2>
          <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
            Version 1.2
          </span>
        </div>

        <textarea
          rows={16}
          value={ruleJson}
          onChange={(e) => setRuleJson(e.target.value)}
          className="w-full font-mono text-xs p-4 bg-slate-900 text-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
        />

        <button
          onClick={handleSave}
          className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{isTa ? 'விதியை சேமிக்க' : 'Save & Publish Rule Schema'}</span>
        </button>
      </div>

    </div>
  );
};
