import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Universal Layout with Fixed Shared Header and Footer
import MainLayout from './components/MainLayout';

// Modular Page Components
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Store from './pages/Store';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import PublicQRScan from './pages/PublicQRScan';
import QRDetailsPage from './pages/QRDetailsPage';
import Transactions from './pages/Transactions';
import Contact from './pages/Contact';
import GlobalAlertListener from './components/GlobalAlertListener';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Global Real-Time Notification & Ringtone Listener */}
        <GlobalAlertListener />

        <Routes>
          {/* All Main Pages wrapped in Fixed Global Layout (Same Header & Footer) */}
          <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/store" element={<Store />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/qr-details/:id" element={<QRDetailsPage />} />
        </Route>

        {/* Public Vehicle Scanner (Dedicated Standalone Screen) */}
        <Route path="/q/:token" element={<PublicQRScan />} />

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </AuthProvider>
  );
}
