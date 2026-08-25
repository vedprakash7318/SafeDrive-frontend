import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Package,
  Calendar,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  FileText,
  DollarSign
} from 'lucide-react';
import { API_BASE } from '../config/api';
import UserNavbar from '../components/UserNavbar';
import AppLoader from '../components/AppLoader';

export default function Transactions() {
  const navigate = useNavigate();
  const token = localStorage.getItem('safe_drive_user_token');
  const storedUser = JSON.parse(localStorage.getItem('safe_drive_user_data') || '{}');

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchFinancialRecords = async () => {
      setLoading(true);
      try {
        const [ordersRes, ledgerRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/user/orders`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE}/user/ledger`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (ordersRes.status === 'fulfilled' && ordersRes.value.data.success) {
          setOrders(ordersRes.value.data.orders || []);
        }

        if (ledgerRes.status === 'fulfilled' && ledgerRes.value.data.success) {
          // Filter ledger for real paid financial transactions (Renewals / Booster Purchases)
          const realTransactions = (ledgerRes.value.data.transactions || []).filter(
            (tx) => tx.source === 'RENEWAL' || tx.source === 'PURCHASE'
          );
          setLedger(realTransactions);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialRecords();
  }, [token, navigate]);

  // Combine and format real transactions
  const financialRecords = [];

  // 1. Paid Product / Kit Orders
  orders
    .filter((o) => o.paymentStatus === 'PAID')
    .forEach((o) => {
      const qty = o.quantity || 1;
      const totalAmt = o.amount || 0;
      const unitRate = o.unitPrice || Math.round(totalAmt / qty);

      financialRecords.push({
        id: o._id,
        type: 'KIT_ORDER',
        title: `Vehicle Safety Kit Purchase (${o.productName || o.qrFor || 'Standard Kit'})`,
        productName: o.productName || 'Smart Vehicle QR Safety Kit',
        qrFor: o.qrFor || 'Vehicle',
        quantity: qty,
        unitPrice: unitRate,
        amount: totalAmt,
        date: o.createdAt,
        status: 'PAID',
        method: o.paymentMethod || 'Online (Prepaid)',
        refNumber: o.orderNumber || o.razorpayPaymentId || `ORD-${o._id.toString().slice(-8).toUpperCase()}`,
        allocatedQRs: o.allocatedQRIds || [],
        deliveryStatus: o.deliveryStatus || 'PROCESSING',
        deliveryAddress: o.deliveryAddress,
        city: o.city,
        state: o.state,
        pincode: o.pincode
      });
    });

  // 2. Paid Renewals & Boosters from Ledger
  ledger.forEach((tx) => {
    financialRecords.push({
      id: tx._id,
      type: tx.source === 'RENEWAL' ? 'SUBSCRIPTION_RENEWAL' : 'QUOTA_BOOSTER',
      title: tx.reason || (tx.source === 'RENEWAL' ? 'Annual Subscription Renewal (+365 Days)' : 'Quota Booster Pack'),
      productName: tx.source === 'RENEWAL' ? 'Annual Protection Extension' : 'Quota Booster',
      quantity: 1,
      unitPrice: tx.amount || (tx.source === 'RENEWAL' ? 199 : 49),
      amount: tx.amount || (tx.source === 'RENEWAL' ? 199 : 49),
      date: tx.createdAt,
      status: 'PAID',
      method: 'Online Payment',
      refNumber: `TXN-${tx._id.toString().slice(-8).toUpperCase()}`,
      allocatedQRs: tx.qrId ? [tx.qrId] : []
    });
  });

  // Sort newest first
  financialRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Filter records
  const filteredRecords = financialRecords.filter((item) => {
    if (filter === 'KIT') return item.type === 'KIT_ORDER';
    if (filter === 'RENEWAL') return item.type === 'SUBSCRIPTION_RENEWAL';
    if (filter === 'BOOSTER') return item.type === 'QUOTA_BOOSTER';
    return true;
  });

  const totalSpent = financialRecords.reduce((sum, item) => sum + (item.amount || 0), 0);

  if (loading) {
    return <AppLoader message="Loading your financial payments and billing history..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#F36F21] selection:text-white">
      <UserNavbar user={storedUser} ordersCount={orders.length} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold text-[#1E8A38] mb-2">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Billing & Payments Ledger</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900">Payment & Transaction History</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent per-kit breakdown, unit pricing, order invoices, and renewal receipts.
            </p>
          </div>

          {/* Lifetime Spent Summary */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Money Paid</span>
            <span className="text-2xl font-black text-slate-900">₹{totalSpent}</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { key: 'ALL', label: `All Invoices (${financialRecords.length})` },
            { key: 'KIT', label: `Kit Orders (${financialRecords.filter(f => f.type === 'KIT_ORDER').length})` },
            { key: 'RENEWAL', label: `Renewals (${financialRecords.filter(f => f.type === 'SUBSCRIPTION_RENEWAL').length})` },
            { key: 'BOOSTER', label: `Boosters (${financialRecords.filter(f => f.type === 'QUOTA_BOOSTER').length})` }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                filter === tab.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center mx-auto border border-slate-200">
              <CreditCard className="w-8 h-8 text-[#F36F21]" />
            </div>
            <h3 className="font-black text-lg text-slate-900">No Transactions Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              You haven't made any purchases under this filter category yet.
            </p>
            <Link
              to="/store"
              className="inline-block bg-[#1E8A38] hover:bg-[#16702c] text-white text-xs font-black px-6 py-3 rounded-2xl shadow-md transition"
            >
              Explore Safety Kits Store →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm hover:border-[#F36F21]/60 transition space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black text-slate-900">{item.title}</span>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-lg border border-slate-200">
                        {item.refNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center space-x-2">
                      <span>📅 {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>💳 {item.method}</span>
                    </p>
                  </div>

                  <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
                    <span className="text-xl font-black text-slate-900">₹{item.amount}</span>
                    <span className="text-[10px] font-black uppercase text-[#1E8A38] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      ✓ {item.status}
                    </span>
                  </div>
                </div>

                {/* Per-Kit Quantity & Cost Breakdown Grid */}
                {item.type === 'KIT_ORDER' && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">Detailed Purchase Breakdown:</span>
                      <span className="text-[11px] font-bold text-slate-500">
                        <strong>{item.quantity} Kit{item.quantity > 1 ? 's' : ''}</strong> ordered
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Quantity</span>
                        <span className="text-sm font-black text-slate-900 mt-0.5 block">{item.quantity} Units</span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Price Per Kit</span>
                        <span className="text-sm font-black text-[#F36F21] mt-0.5 block">₹{item.unitPrice} / kit</span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Doorstep Delivery</span>
                        <span className="text-sm font-black text-[#1E8A38] mt-0.5 block">FREE (₹0)</span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Paid</span>
                        <span className="text-sm font-black text-slate-900 mt-0.5 block">₹{item.amount}</span>
                      </div>
                    </div>

                    {/* Shipping Address Note */}
                    {item.deliveryAddress && (
                      <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                        <span>
                          <strong>Delivery To:</strong> {item.deliveryAddress}, {item.city} {item.pincode}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          {item.deliveryStatus}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Subscriptions / Booster breakdown */}
                {item.type !== 'KIT_ORDER' && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-700 block">{item.title}</span>
                      <span className="text-[11px] text-slate-400">100% Secure cloud activation applied directly to your QR wallet.</span>
                    </div>
                    <span className="text-base font-black text-slate-900">₹{item.amount}</span>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
