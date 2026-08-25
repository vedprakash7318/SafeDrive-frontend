import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Phone,
  MessageSquare,
  ShieldAlert,
  Clock,
  Trash2,
  CheckCircle,
  Volume2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { API_BASE } from '../config/api';
import { playNotificationSound, setupOnMessageListener } from '../config/firebase';
import UserNavbar from '../components/UserNavbar';

export default function Notifications() {
  const navigate = useNavigate();
  const token = localStorage.getItem('safe_drive_user_token');
  const user = JSON.parse(localStorage.getItem('safe_drive_user_data') || '{}');

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/user/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchNotifications();

    // Listen for real-time foreground messages
    const unsubscribeFCM = setupOnMessageListener(() => {
      playNotificationSound();
      fetchNotifications();
    });

    // Listen for Service Worker background messages
    const handleSwMessage = (event) => {
      if (event.data?.type === 'PLAY_RINGTONE') {
        playNotificationSound();
        fetchNotifications();
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    return () => {
      if (typeof unsubscribeFCM === 'function') unsubscribeFCM();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, [token, navigate]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#F36F21] selection:text-white">
      <UserNavbar user={user} unreadCount={unreadCount} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Page Header */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold text-blue-700 mb-2">
              <Bell className="w-3.5 h-3.5" />
              <span>Real-Time Alert Center</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900">Notifications & Alerts</h1>
            <p className="text-xs text-slate-500 mt-0.5">Live scanner alerts, wrong parking notices, and push events for your vehicle.</p>
          </div>

          <button
            onClick={() => playNotificationSound()}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl transition border border-slate-200 cursor-pointer shadow-2xs"
          >
            <Volume2 className="w-4 h-4 text-[#F36F21]" />
            <span>Test Alert Ringtone</span>
          </button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center text-slate-400 font-bold text-sm">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 text-[#1E8A38] rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="font-black text-lg text-slate-900">All Clear! No New Alerts</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Whenever someone scans your vehicle's SafeDrive QR tag to notify you about parking or emergencies, the alert will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const isEmergency = n.type === 'EMERGENCY_ALERT';
              const isCall = n.type === 'CALL_ALERT';

              return (
                <div
                  key={n._id}
                  className={`p-5 rounded-3xl border transition-all flex items-start space-x-4 ${
                    isEmergency
                      ? 'bg-rose-50/70 border-rose-200'
                      : !n.isRead
                      ? 'bg-white border-slate-300 shadow-sm'
                      : 'bg-slate-50/60 border-slate-200 opacity-90'
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl shrink-0 ${
                      isEmergency
                        ? 'bg-rose-600 text-white'
                        : isCall
                        ? 'bg-[#1E8A38] text-white'
                        : 'bg-[#F36F21] text-white'
                    }`}
                  >
                    {isEmergency ? (
                      <ShieldAlert className="w-5 h-5" />
                    ) : isCall ? (
                      <Phone className="w-5 h-5" />
                    ) : (
                      <MessageSquare className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-black text-sm text-slate-900">{n.title}</h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium mt-1.5 leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-200/60">
                      {n.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
