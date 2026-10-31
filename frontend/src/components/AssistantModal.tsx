import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Layers,
  Award,
  ShieldCheck,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  responseType?: string;
  structuredData?: any;
  actionButtons?: Array<{ label: string; path: string; actionType?: string; schemeId?: string }>;
  timestamp: string;
}

export const AssistantModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { lang } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isTa = lang === 'ta';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: isTa
        ? 'வணக்கம்! நான் உங்கள் தமிழ்நாடு நலன்பாதை வழிகாட்டி. உங்களுக்குத் தேவையான அரசு நலத்திட்டங்கள், தகுதி நிபந்தனைகள், ஆவணங்கள் மற்றும் விண்ணப்ப நிலை குறித்து என்னிடம் கேட்கலாம்!'
        : 'Hello! I am your Tamil Nadu WelfarePath Assistant. Ask me about eligible schemes, rule conditions, missing documents, or application status!',
      actionButtons: [
        { label: isTa ? 'என் தகுதியைச் சோதிக்க' : 'Check My Eligibility', path: '/citizen/eligible-schemes', actionType: 'ELIGIBILITY_CHECK' },
        { label: isTa ? 'திட்டங்களைக் காண்க' : 'Explore Schemes', path: '/citizen/schemes', actionType: 'NAVIGATE' },
        { label: isTa ? 'விண்ணப்ப நிலை' : 'Application Status', path: '/citizen/applications', actionType: 'NAVIGATE' },
        { label: isTa ? 'ஆவணங்கள்' : 'Required Docs', path: '/citizen/documents', actionType: 'NAVIGATE' }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/assistant/chat', {
        message: query,
        lang,
        context: {
          currentRoute: location.pathname
        }
      });

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.data.reply,
        responseType: res.data.responseType,
        structuredData: res.data.structuredData,
        actionButtons: res.data.actionButtons,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);

      // If backend returned immediate NAVIGATE action button, auto navigate after short notice
      if (res.data.actionButtons && res.data.actionButtons.length === 1 && res.data.actionButtons[0].actionType === 'NAVIGATE') {
        const targetPath = res.data.actionButtons[0].path;
        setTimeout(() => {
          setIsOpen(false);
          navigate(targetPath);
        }, 800);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: isTa
            ? 'மன்னிக்கவும், தற்சமயம் சேவையில் சிக்கல் உள்ளது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
            : 'I could not retrieve that information right now. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionButtonClick = (btn: { label: string; path: string; actionType?: string; schemeId?: string }) => {
    if (btn.actionType === 'ELIGIBILITY_CHECK') {
      handleSend(isTa ? 'என் தகுதியைச் சோதிக்கவும்' : 'Check my eligibility');
    } else if (btn.path) {
      setIsOpen(false);
      navigate(btn.path);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-700 text-white px-5 py-3.5 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 group border border-blue-400/30"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
          </div>
          <span className="text-xs font-bold tracking-wide">
            {isTa ? 'நலன்பாதை உதவி' : 'Welfare Assistant'}
          </span>
        </button>
      )}

      {/* Expanded Modal Box */}
      {isOpen && (
        <div className="w-[360px] sm:w-[440px] h-[580px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-[#10243A] text-white p-4 flex items-center justify-between border-b border-[#1a385c]">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center border border-teal-400/30">
                <Sparkles className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  {isTa ? 'தமிழ்நாடு அரசு நல உதவியாளன்' : 'WelfarePath Action Assistant'}
                </h3>
                <div className="flex items-center space-x-1.5 text-[10px] text-teal-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                  <span>{isTa ? 'இருமொழி நேரலை வழிகாட்டி' : 'Bilingual Live Assistant'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-end space-x-2 max-w-full">
                  {msg.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-[#10243A] text-white flex items-center justify-center text-xs mb-1 shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#10243A] text-white rounded-br-none shadow-xs font-medium'
                        : 'bg-white text-[#172B4D] border border-slate-200 rounded-bl-none shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* STRUCTURED SCHEME LIST DISPLAY */}
                    {msg.responseType === 'SCHEME_LIST' && Array.isArray(msg.structuredData) && (
                      <div className="mt-3 space-y-2 border-t border-slate-100 pt-2">
                        {msg.structuredData.map((scheme: any) => (
                          <div key={scheme._id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-blue-950 uppercase text-[9px] bg-blue-100 px-1.5 py-0.5 rounded">
                                {scheme.schemeCode}
                              </span>
                              <span className="text-[10px] text-emerald-700 font-bold truncate max-w-[60%]">
                                {isTa ? scheme.benefitSummary?.ta : scheme.benefitSummary?.en}
                              </span>
                            </div>
                            <h5 className="font-bold text-slate-900 line-clamp-1">
                              {isTa ? scheme.name?.ta : scheme.name?.en}
                            </h5>
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                navigate(`/schemes/${scheme._id}`);
                              }}
                              className="text-[10px] font-extrabold text-blue-900 hover:underline flex items-center space-x-0.5 pt-1"
                            >
                              <span>{isTa ? 'விவரங்களைக் காண்க' : 'View Details'}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* STRUCTURED ELIGIBILITY MATCH DISPLAY */}
                    {msg.responseType === 'ELIGIBILITY_RESULT' && Array.isArray(msg.structuredData) && (
                      <div className="mt-3 space-y-2 border-t border-slate-100 pt-2">
                        {msg.structuredData.map((item: any) => (
                          <div key={item.scheme._id} className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200 space-y-1.5 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 truncate max-w-[70%]">
                                {isTa ? item.scheme.name?.ta : item.scheme.name?.en}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                {item.outcome?.statusBadge ? (isTa ? item.outcome.statusBadge.ta : item.outcome.statusBadge.en) : item.outcome?.status}
                              </span>
                            </div>

                            <p className="text-[10px] text-slate-600 line-clamp-2">
                              {isTa ? item.outcome?.gapAnalysisRemarks?.ta : item.outcome?.gapAnalysisRemarks?.en}
                            </p>

                            <button
                              onClick={() => {
                                setIsOpen(false);
                                navigate(`/schemes/${item.scheme._id}`);
                              }}
                              className="text-[10px] font-extrabold text-blue-900 hover:underline flex items-center space-x-1"
                            >
                              <span>{isTa ? 'தகுதியைச் சோதிக்க' : 'Check Full Rules'}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* STRUCTURED APPLICATION STATUS DISPLAY */}
                    {msg.responseType === 'APPLICATION_STATUS' && Array.isArray(msg.structuredData) && (
                      <div className="mt-3 space-y-2 border-t border-slate-100 pt-2">
                        {msg.structuredData.slice(0, 2).map((app: any) => (
                          <div key={app._id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-extrabold text-blue-900">
                                #{app.applicationReference || app.applicationNo}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                {app.status}
                              </span>
                            </div>
                            <div className="font-bold text-slate-800 truncate">
                              {isTa ? app.schemeId?.name?.ta : app.schemeId?.name?.en}
                            </div>
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                navigate(`/citizen/applications/${app._id}`);
                              }}
                              className="text-[10px] font-extrabold text-blue-900 hover:underline flex items-center space-x-1 pt-1"
                            >
                              <span>{isTa ? 'விண்ணப்பத்தை பின்தொடர' : 'Track Status'}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <span className={`block text-[9px] mt-1 ${msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>

                {/* Contextual Action Buttons */}
                {msg.actionButtons && msg.actionButtons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-9">
                    {msg.actionButtons.map((btn, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleActionButtonClick(btn)}
                        className="flex items-center space-x-1 px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-full text-[11px] font-extrabold transition-all shadow-2xs"
                      >
                        <span>{btn.label}</span>
                        <ArrowRight className="w-3 h-3 text-teal-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-slate-400 ml-9">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
                <span>{isTa ? 'பரிசீலிக்கிறது...' : 'Evaluating rules & responses...'}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto text-[11px] text-slate-600">
            <button
              onClick={() => handleSend(isTa ? 'நான் எந்த திட்டத்திற்கு தகுதியானவன்?' : 'Which schemes am I eligible for?')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap font-bold"
            >
              {isTa ? 'என் தகுதி?' : 'Am I Eligible?'}
            </button>
            <button
              onClick={() => handleSend(isTa ? 'என் விண்ணப்ப நிலை என்ன?' : 'Check my application status')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap font-bold"
            >
              {isTa ? 'விண்ணப்ப நிலை' : 'Application Status'}
            </button>
            <button
              onClick={() => handleSend(isTa ? 'தேவையான ஆவணங்கள் என்ன?' : 'What documents are required?')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap font-bold"
            >
              {isTa ? 'ஆவணங்கள்' : 'Required Docs'}
            </button>
            <button
              onClick={() => handleSend('DigiLocker')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap font-bold"
            >
              DigiLocker
            </button>
          </div>

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isTa ? 'ஆங்கிலம் அல்லது தமிழில் கேட்கவும்...' : 'Ask in English or தமிழ்...'}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-800"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-[#10243A] hover:bg-[#1a385c] disabled:opacity-50 text-white rounded-xl transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
