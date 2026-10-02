import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Bell, CheckCircle2 } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/misc/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-xs text-slate-400">Loading notifications...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isTa ? 'அறிவிப்புகள் (Notifications Center)' : 'Alerts & Application Updates'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'உங்கள் விண்ணப்ப நிலை மாற்றங்கள் மற்றும் புதுப்பித்தல் நினைவூட்டல்கள்' : 'Real-time updates regarding your applications, status updates, and renewal alerts'}
        </p>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="glass-card text-center py-12 p-4 rounded-2xl">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">{isTa ? 'புதிய அறிவிப்புகள் இல்லை.' : 'No notifications recorded.'}</p>
          </div>
        ) : (
          notifications.map((n: any) => (
            <div key={n._id} className="glass-card p-4 rounded-2xl flex items-start space-x-3 border border-slate-200">
              <CheckCircle2 className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">{isTa ? n.title?.ta : n.title?.en}</h4>
                <p className="text-xs text-slate-600 mt-0.5">{isTa ? n.message?.ta : n.message?.en}</p>
                <span className="text-[10px] text-slate-400 block mt-1">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
