import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { Bot, Send, Sparkles, ArrowRight } from 'lucide-react';

export const FullAssistantPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';
  const navigate = useNavigate();

  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'bot',
      text: isTa
        ? 'வணக்கம்! நான் உங்கள் தமிழ்நாடு நலன்பாதை உதவியாளன். உங்களுக்குத் தேவையான அரசு நலத்திட்டங்கள், தகுதி நிபந்தனைகள் மற்றும் விண்ணப்ப நிலை பற்றி என்னிடம் கேட்கலாம்!'
        : 'Hello! I am your WelfarePath Assistant. You can ask me about eligible schemes, missing document gaps, or application status history!',
      actionButtons: [
        { label: isTa ? 'என் தகுதியைச் சோதிக்க' : 'Check Eligibility', path: '/citizen/portfolio' },
        { label: isTa ? 'திட்டங்களைக் காண்க' : 'Explore Schemes', path: '/citizen/schemes' }
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || loading) return;

    const userMsg = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/assistant/chat', { message: query, lang });
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: res.data.reply,
          actionButtons: res.data.actionButtons
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: isTa ? 'மன்னிக்கவும், பிழை ஏற்பட்டது.' : 'Connection error occurred.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col glass-card rounded-3xl border border-slate-200 overflow-hidden shadow-xl">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-800 text-white p-5 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
          <Sparkles className="w-5 h-5 text-teal-300" />
        </div>
        <div>
          <h1 className="text-base font-bold">
            {isTa ? 'தமிழ்நாடு நலன்பாதை உதவியாளன்' : 'WelfarePath Conversational Assistant'}
          </h1>
          <p className="text-xs text-teal-200">
            {isTa ? 'இருமொழி அரசு நலத்திட்ட வழிகாட்டி' : 'Bilingual Intelligent Scheme Discovery & Explanation'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
              m.sender === 'user' ? 'bg-blue-900 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-2xs'
            }`}>
              <p className="whitespace-pre-line">{m.text}</p>
            </div>

            {m.actionButtons && m.actionButtons.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {m.actionButtons.map((btn: any, bIdx: number) => (
                  <button
                    key={bIdx}
                    onClick={() => navigate(btn.path)}
                    className="flex items-center space-x-1 px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-full text-xs font-bold transition-colors"
                  >
                    <span>{btn.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="text-xs text-slate-400 italic">Evaluating assistant rules...</div>}
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-4 bg-white border-t border-slate-200 flex items-center space-x-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isTa ? 'தமிழ் அல்லது ஆங்கிலத்தில் கேட்கவும்...' : 'Type your scheme or eligibility question...'}
          className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-900 focus:outline-none"
        />
        <button type="submit" disabled={!input.trim() || loading} className="p-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl">
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
