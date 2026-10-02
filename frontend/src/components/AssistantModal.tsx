import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { MessageSquare, X, Send, Bot, User, ArrowRight, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  actionButtons?: Array<{ label: string; path: string }>;
  timestamp: string;
}

export const AssistantModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { lang } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isTa = lang === 'ta';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: isTa
        ? 'வணக்கம்! நான் உங்கள் தமிழ்நாடு நலன்பாதை உதவியாளன். உங்களுக்குத் தேவையான அரசு நலத்திட்டங்கள், தகுதி நிபந்தனைகள் மற்றும் விண்ணப்ப நிலை பற்றி என்னிடம் கேட்கலாம்!'
        : 'Hello! I am your Tamil Nadu WelfarePath Assistant. You can ask me about eligible schemes, rule conditions, missing document gaps, or application status!',
      actionButtons: [
        { label: isTa ? 'என் தகுதியைச் சோதிக்க' : 'Check My Eligibility', path: '/dashboard' },
        { label: isTa ? 'திட்டங்களைக் காண்க' : 'Explore Schemes', path: '/schemes' }
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
        lang
      });

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.data.reply,
        actionButtons: res.data.actionButtons,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: isTa
            ? 'மன்னிக்கவும், தற்சமயம் இணைப்பில் சிக்கல் உள்ளது. தயவுசெய்து சிறிது நேரம் கழித்து முயற்சிக்கவும்.'
            : 'Sorry, I encountered a temporary connection issue. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
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
        <div className="w-[360px] sm:w-[420px] h-[540px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-800 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <Sparkles className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  {t('assistant.title')}
                </h3>
                <div className="flex items-center space-x-1.5 text-[10px] text-teal-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                  <span>{isTa ? 'இருமொழி வழிகாட்டி ஆன்லைன்' : 'Bilingual AI Online'}</span>
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
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-end space-x-2">
                  {msg.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs mb-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-900 text-white rounded-br-none shadow-sm'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <span className={`block text-[9px] mt-1 ${msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>

                {/* Action Buttons if available */}
                {msg.actionButtons && msg.actionButtons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-9">
                    {msg.actionButtons.map((btn, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setIsOpen(false);
                          navigate(btn.path);
                        }}
                        className="flex items-center space-x-1 px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-full text-[11px] font-semibold transition-all shadow-2xs"
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
          <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto text-[11px] text-slate-600">
            <button
              onClick={() => handleSend(isTa ? 'நான் எந்த திட்டத்திற்கு தகுதியானவன்?' : 'Which schemes am I eligible for?')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap"
            >
              {isTa ? 'என் தகுதி?' : 'Am I Eligible?'}
            </button>
            <button
              onClick={() => handleSend(isTa ? 'என் விண்ணப்ப நிலை என்ன?' : 'Check my application status')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap"
            >
              {isTa ? 'விண்ணப்ப நிலை' : 'Application Status'}
            </button>
            <button
              onClick={() => handleSend(isTa ? 'தேவையான ஆவணங்கள் என்ன?' : 'What documents are required?')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap"
            >
              {isTa ? 'ஆவணங்கள்' : 'Required Docs'}
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
              placeholder={t('assistant.placeholder')}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-800"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
