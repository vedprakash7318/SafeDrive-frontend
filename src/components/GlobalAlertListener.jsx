import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  Volume2,
  VolumeX,
  ShieldAlert,
  Car,
  CheckCircle,
  ExternalLink,
  PhoneCall,
  X
} from 'lucide-react';
import { API_BASE } from '../config/api';
import { requestFcmToken, setupOnMessageListener } from '../config/firebase';

export default function GlobalAlertListener() {
  const location = useLocation();
  const isScannerPage = location.pathname.startsWith('/q/');

  const [activeAlert, setActiveAlert] = useState(null);
  const [isPlayingSound, setIsPlayingSound] = useState(false);

  const lastAlertIdRef = useRef(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const sirenIntervalRef = useRef(null);
  const isAudioUnlockedRef = useRef(false);

  // Stop sound if navigating to public scanner page
  useEffect(() => {
    if (isScannerPage) {
      stopSound();
      setActiveAlert(null);
    }
  }, [isScannerPage]);

  // Initialize Audio
  useEffect(() => {
    try {
      const audio = new Audio('/ring1.mp3');
      audio.loop = true;
      audioRef.current = audio;
    } catch (e) {
      console.warn('Audio init error:', e);
    }

    // Unlock browser audio policy on first user interaction
    const unlockAudio = () => {
      if (isAudioUnlockedRef.current) return;
      isAudioUnlockedRef.current = true;
      
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          if (!audioContextRef.current) {
            audioContextRef.current = new AudioCtx();
          }
          if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
          }
        }
      } catch (e) {}

      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }).catch(() => {});
      }

      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      stopSound();
    };
  }, []);

  // Web Audio Fallback Siren Synthesizer
  const startSynthesizedSiren = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);

      let toggle = false;
      const playBeep = () => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(toggle ? 880 : 587.33, ctx.currentTime); // A5 and D5 siren
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
          toggle = !toggle;
        } catch (e) {}
      };

      playBeep();
      sirenIntervalRef.current = setInterval(playBeep, 450);
    } catch (e) {}
  };

  const stopSynthesizedSiren = () => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
  };

  // Play Sound Engine
  const playSound = () => {
    setIsPlayingSound(true);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If HTML5 audio is blocked by autoplay policy, fallback to Web Audio synthesizer
          startSynthesizedSiren();
        });
      }
    } else {
      startSynthesizedSiren();
    }
  };

  // Stop Sound Engine
  const stopSound = () => {
    setIsPlayingSound(false);
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {}
    }
    stopSynthesizedSiren();
  };

  // Handle incoming alert
  const triggerIncomingAlert = (notification) => {
    if (!notification || !notification._id) return;
    if (lastAlertIdRef.current === notification._id) return;

    lastAlertIdRef.current = notification._id;
    setActiveAlert(notification);
    playSound();

    // Show Native Browser Notification if supported
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title || 'SafeDrive Vehicle Alert', {
          body: notification.message || 'Incoming notification for your vehicle.',
          icon: '/favicon.svg'
        });
      }
    } catch (e) {}
  };

  // Dismiss alert
  const handleDismiss = async () => {
    stopSound();
    if (activeAlert?._id) {
      const token = localStorage.getItem('safe_drive_user_token');
      if (token) {
        try {
          await axios.put(`${API_BASE}/user/notifications/${activeAlert._id}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (e) {}
      }
    }
    setActiveAlert(null);
  };

  // 1. Setup Firebase FCM Listener & Registration (Owner portal only)
  useEffect(() => {
    if (isScannerPage) return;
    const token = localStorage.getItem('safe_drive_user_token');
    if (!token) return;

    // Request FCM Token and register on backend
    requestFcmToken().then(async (fcmToken) => {
      if (fcmToken) {
        try {
          await axios.post(`${API_BASE}/user/fcm-token`, { fcmToken }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (e) {}
      }
    }).catch(() => {});

    // Setup foreground message listener
    const unsubscribe = setupOnMessageListener((payload) => {
      if (payload?.notification) {
        triggerIncomingAlert({
          _id: payload.messageId || `fcm_${Date.now()}`,
          title: payload.notification.title,
          message: payload.notification.body,
          vehicleNumber: payload.data?.vehicleNumber,
          createdAt: new Date().toISOString()
        });
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isScannerPage]);

  // 2. Continuous Polling Listener for In-App Push Alerts (Real-time every 2.5s on Owner Portal)
  useEffect(() => {
    if (isScannerPage) return;
    const token = localStorage.getItem('safe_drive_user_token');
    if (!token) return;

    // Initialize baseline on first load to only ring for NEW incoming alerts
    let baselineChecked = false;
    let baselineTimestamp = Date.now();

    const checkLatestNotifications = async () => {
      if (isScannerPage) return;
      const currentToken = localStorage.getItem('safe_drive_user_token');
      if (!currentToken) return;

      try {
        const res = await axios.get(`${API_BASE}/user/notifications`, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });

        if (res.data.success && Array.isArray(res.data.notifications) && res.data.notifications.length > 0) {
          const latest = res.data.notifications[0];

          if (!baselineChecked) {
            // First run: establish baseline
            lastAlertIdRef.current = latest._id;
            baselineChecked = true;
            return;
          }

          // Trigger ringtone if a new unread notification arrived
          if (
            latest._id !== lastAlertIdRef.current &&
            !latest.isRead &&
            new Date(latest.createdAt).getTime() >= (baselineTimestamp - 10000)
          ) {
            triggerIncomingAlert(latest);
          }
        }
      } catch (err) {
        // Silent polling failure
      }
    };

    checkLatestNotifications();
    const interval = setInterval(checkLatestNotifications, 2500);

    return () => clearInterval(interval);
  }, [isScannerPage]);

  if (isScannerPage || !activeAlert) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-9999 animate-fadeIn">
      <div className="bg-white border-2 border-[#F36F21] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 text-center relative overflow-hidden">
        
        {/* Animated Background Ring Pulse */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/10 rounded-full animate-ping pointer-events-none" />
        
        {/* Siren Icon with Ringing Waves */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-[#F36F21] text-white flex items-center justify-center shadow-lg shadow-red-500/30 z-10 animate-bounce">
            <Bell className="w-8 h-8" />
          </div>
        </div>

        {/* Header Titles */}
        <div className="space-y-1">
          <span className="text-[11px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200 inline-block animate-pulse">
            🚨 Incoming Instant Vehicle Alert
          </span>
          <h3 className="text-xl font-black text-slate-900 pt-1">
            {activeAlert.title || 'SafeDrive Vehicle Alert'}
          </h3>
        </div>

        {/* Alert Details Card */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 text-left shadow-md">
          {activeAlert.vehicleNumber && (
            <div className="flex items-center space-x-2 text-xs text-slate-300 pb-1.5 border-b border-slate-800">
              <Car className="w-4 h-4 text-[#F36F21]" />
              <span className="font-bold">Vehicle:</span>
              <span className="font-mono font-black text-white">{activeAlert.vehicleNumber}</span>
            </div>
          )}

          <div className="text-sm font-bold text-amber-300 leading-snug">
            "{activeAlert.message || 'Someone scanned your vehicle protection tag and sent an alert.'}"
          </div>

          <div className="text-[10px] text-slate-400 font-mono pt-1">
            Received: Just now • Ringtone Active
          </div>
        </div>

        {/* Audio Ringing Status Indicator */}
        <div className="flex items-center justify-center space-x-2 text-xs font-bold text-slate-600 bg-slate-100 py-2 rounded-xl">
          <Volume2 className="w-4 h-4 text-red-600 animate-pulse" />
          <span>Loud Alert Ringtone is Playing</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3.5 rounded-2xl text-xs shadow-lg shadow-red-600/30 transition flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          >
            <VolumeX className="w-4 h-4" />
            <span>🔕 Stop Sound & Dismiss Alert</span>
          </button>

          <Link
            to="/notifications"
            onClick={handleDismiss}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition block text-center"
          >
            View All Notifications →
          </Link>
        </div>

      </div>
    </div>
  );
}
