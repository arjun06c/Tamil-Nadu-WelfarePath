import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Info,
  CheckCheck,
  Filter,
  FileCheck,
  Award,
  Sparkles
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';

export const NotificationsPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'UNREAD' | 'APPLICATIONS' | 'ALERTS'>('ALL');
  const [markingAll, setMarkingAll] = useState(false);

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

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/misc/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const unread = notifications.filter((n) => !n.isRead);
      await Promise.all(unread.map((n) => api.put(`/misc/notifications/${n._id}/read`)));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'UNREAD') return !n.isRead;
    if (filterType === 'APPLICATIONS')
      return n.category === 'APPLICATION' || n.title?.en?.toLowerCase().includes('application');
    if (filterType === 'ALERTS')
      return (
        n.category === 'SCHEME' ||
        n.category === 'ALERT' ||
        n.title?.en?.toLowerCase().includes('scheme')
      );
    return true;
  });

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#10243A] border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-500">
          {isTa ? 'அறிவிப்புகள் பெறப்படுகின்றன...' : 'Loading notification updates...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <PageHeader
        title={isTa ? 'அறிவிப்பு மையம்' : 'Notification Center'}
        subtitle={
          isTa
            ? 'உங்கள் விண்ணப்ப நிலை மாற்றங்கள், ஆவண திருத்தக் குறிப்புகள் மற்றும் நலத்திட்ட அறிவிப்புகள்'
            : 'Official updates regarding your application milestones, verification reviews, and benefit releases'
        }
        badge={
          unreadCount > 0
            ? `${unreadCount} ${isTa ? 'புதியவை' : 'Unread'}`
            : isTa
            ? 'அனைத்தும் படிக்கப்பட்டது'
            : 'All Caught Up'
        }
        badgeVariant={unreadCount > 0 ? 'blue' : 'default'}
        icon={Bell}
        breadcrumbs={[
          { label: isTa ? 'முகப்பு' : 'Dashboard', href: '/citizen/dashboard' },
          { label: isTa ? 'அறிவிப்புகள்' : 'Notifications' }
        ]}
        actions={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-[#172B4D] text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <CheckCheck className="w-4 h-4 text-blue-600" />
              <span>{isTa ? 'அனைத்தையும் படித்ததாகக் குறி' : 'Mark All as Read'}</span>
            </button>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <div className="gov-card p-1.5 flex flex-wrap gap-1 border border-slate-200">
        <button
          onClick={() => setFilterType('ALL')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            filterType === 'ALL'
              ? 'bg-[#10243A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {isTa ? 'அனைத்து அறிவிப்புகளும்' : 'All Updates'} ({notifications.length})
        </button>

        <button
          onClick={() => setFilterType('UNREAD')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            filterType === 'UNREAD'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {isTa ? 'படிக்காதவை' : 'Unread Only'} ({unreadCount})
        </button>

        <button
          onClick={() => setFilterType('APPLICATIONS')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            filterType === 'APPLICATIONS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {isTa ? 'விண்ணப்ப நிலை' : 'Application Status'}
        </button>

        <button
          onClick={() => setFilterType('ALERTS')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            filterType === 'ALERTS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {isTa ? 'நலத்திட்ட விழிப்பூட்டல்கள்' : 'Scheme Alerts'}
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={isTa ? 'அறிவிப்புகள் எதுவும் இல்லை' : 'No Notifications'}
            description={
              isTa
                ? 'உங்கள் கணக்கில் தற்போது எந்த புதிய அறிவிப்புகளும் அல்லது விழிப்பூட்டல்களும் இல்லை.'
                : 'You are completely up to date. You will receive notifications when application reviews progress or new schemes match your profile.'
            }
          />
        ) : (
          filteredNotifications.map((n: any) => {
            const isUnread = !n.isRead;
            const title = isTa ? n.title?.ta || n.title?.en : n.title?.en;
            const message = isTa ? n.message?.ta || n.message?.en : n.message?.en;

            return (
              <div
                key={n._id}
                className={`gov-card p-4 flex items-start justify-between gap-3 transition-all duration-200 ${
                  isUnread
                    ? 'border-l-4 border-l-blue-600 bg-blue-50/20'
                    : 'border-l-4 border-l-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start space-x-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                      isUnread
                        ? 'bg-blue-100 text-blue-900 border-blue-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    <FileCheck className="w-4 h-4" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-extrabold text-[#172B4D] leading-snug">
                        {title}
                      </h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{message}</p>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {isUnread && (
                  <button
                    onClick={() => handleMarkAsRead(n._id)}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg shrink-0 transition-colors shadow-2xs"
                  >
                    {isTa ? 'படித்ததாகக் குறி' : 'Mark Read'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
