import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { HelpCircle } from 'lucide-react';

export const FaqPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const res = await api.get('/misc/faqs');
      setFaqs(res.data.faqs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const defaultFaqs = [
    {
      qEn: 'Is Tamil Nadu WelfarePath an official government website?',
      qTa: 'தமிழ்நாடு நலன்பாதை அதிகாரப்பூர்வ அரசு இணையதளமா?',
      aEn: 'No, WelfarePath is an independent academic prototype developed to demonstrate explainable eligibility assessment and document readiness assistance. For official submissions, citizens must visit official state portals.',
      aTa: 'இல்லை, இது ஒரு கல்வி முன்மாதிரி தளம். இறுதி விவரங்களுக்கு அதிகாரப்பூர்வ அரசு இணையதளங்களை பார்க்கவும்.'
    },
    {
      qEn: 'What does "Near Eligible" mean?',
      qTa: '"தகுதி பெறக்கூடிய வாய்ப்பு" என்றால் என்ன?',
      aEn: 'Near Eligible means your demographic and income profile satisfies the scheme rules, but you need to upload a missing proof document or update a minor profile field.',
      aTa: 'உங்கள் சுயவிவரம் அடிப்படை விதிகளுக்கு பொருந்துகிறது, ஆனால் சில சான்றிதழ்கள் பதிவேற்றப்பட வேண்டும் என்பதை இது குறிக்கிறது.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {isTa ? 'அடிக்கடி கேட்கப்படும் கேள்விகள்' : 'Frequently Asked Questions (FAQs)'}
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          {isTa ? 'நலத்திட்டங்கள் மற்றும் தகுதி சரிபார்ப்பு பற்றிய தகவல்கள்' : 'Find answers regarding scheme eligibility, gap analysis, and document assistance'}
        </p>
      </div>

      <div className="space-y-4">
        {defaultFaqs.map((faq, idx) => (
          <div key={idx} className="glass-card p-6 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-blue-900" />
              <span>{isTa ? faq.qTa : faq.qEn}</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">{isTa ? faq.aTa : faq.aEn}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
