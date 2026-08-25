import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  FileText,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  QrCode,
  Sparkles,
  MapPin,
  Phone,
  User,
  RotateCcw,
  Printer,
  Check,
  ArrowRight
} from 'lucide-react';
import { API_BASE } from '../config/api';
import UserNavbar from '../components/UserNavbar';
import AppLoader from '../components/AppLoader';

export default function Orders() {
  const navigate = useNavigate();
  const token = localStorage.getItem('safe_drive_user_token');
  const user = JSON.parse(localStorage.getItem('safe_drive_user_data') || '{}');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${API_BASE}/user/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setOrders(res.data.orders || []);
        }
      } catch (err) {
        console.error('Fetch orders error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, navigate]);

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#F36F21] selection:text-white">
      <UserNavbar user={user} ordersCount={orders.length} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 p-6 rounded-3xl shadow-sm gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold text-[#1E8A38] mb-2">
              <Package className="w-3.5 h-3.5" />
              <span>Purchase History & Tracking</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900">My Order Invoices</h1>
            <p className="text-xs text-slate-500 mt-0.5">Track your kit deliveries, item quantities, pricing breakdown, and invoices.</p>
          </div>

          <Link
            to="/store"
            className="bg-[#1E8A38] hover:bg-[#16702c] text-white text-xs font-black px-5 py-3 rounded-2xl shadow-md transition flex items-center space-x-2 shrink-0 active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Order New Safety Kit</span>
          </Link>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="bg-white border border-slate-200 p-8 rounded-3xl text-center shadow-sm">
            <AppLoader message="Loading your order invoices..." fullScreen={false} />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-orange-50 text-[#F36F21] rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="font-black text-lg text-slate-900">No Orders Placed Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              You haven't ordered any SafeDrive safety tags yet. Explore our store to protect your car, bike, or commercial vehicle today.
            </p>
            <div className="pt-2">
              <Link
                to="/store"
                className="inline-flex items-center space-x-2 bg-[#F36F21] hover:bg-[#d85810] text-white font-black px-6 py-3 rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                <span>Browse Store Products →</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const qty = Math.max(1, order.quantity || 1);
              const totalAmount = order.amount || order.totalAmount || 190;
              const unitPrice = order.unitPrice || order.metadata?.unitPrice || Math.round(totalAmount / qty);
              const copiesCount = (order.metadata?.copiesPerSet || 2) * qty;
              const initialCalls = (order.metadata?.initialCalls || 10) * qty;
              const initialMessages = (order.metadata?.initialMessages || 20) * qty;

              const deliveryStatus = order.deliveryStatus || 'PROCESSING';
              const deliveryColor =
                deliveryStatus === 'DELIVERED'
                  ? 'bg-emerald-50 text-[#1E8A38] border-emerald-200'
                  : deliveryStatus === 'DISPATCHED' || deliveryStatus === 'SHIPPED'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-[#F36F21] border-amber-200';

              return (
                <div
                  key={order._id}
                  className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition space-y-5"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-base text-slate-900 font-mono">
                          Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${deliveryColor}`}>
                          {deliveryStatus === 'PROCESSING' ? '📦 Order Confirmed' : deliveryStatus}
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-50 text-[#1E8A38] border border-emerald-200 px-2 py-0.5 rounded-full">
                          ✓ PAID
                        </span>

                        {/* Kit Claim Status Pill */}
                        {order.isClaimed || (order.claimedCount || 0) >= qty ? (
                          <span className="text-[10px] font-bold bg-emerald-50 text-[#1E8A38] border border-emerald-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                            <span>🛡️ All {qty} Kits Activated</span>
                          </span>
                        ) : (order.claimedCount || 0) > 0 ? (
                          <span className="text-[10px] font-bold bg-blue-50 text-[#1D56A5] border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                            <span>🛡️ {order.claimedCount} Activated • ⏳ {order.pendingCount || (qty - order.claimedCount)} Pending</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-amber-50 text-[#F36F21] border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                            <span>⏳ {qty} Kits Pending Activation</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-1 flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Paid Amount</span>
                      <div className="text-2xl font-black text-[#1E8A38]">
                        ₹{totalAmount}
                      </div>
                    </div>
                  </div>

                  {/* Order Item Details Grid */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
                        {order.qrFor?.toLowerCase() === 'bike' ? '🏍️' : '🚗'}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-black text-sm text-slate-900">
                            {order.productName || 'SafeDrive Vehicle Protection Tag Kit'}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-50 text-[#F36F21] border border-orange-200 rounded-md">
                            🏷️ For {order.qrFor || 'Vehicle'}
                          </span>
                        </div>
                        
                        {/* Per-Kit Quantity and Rate Details */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
                          <span className="font-bold text-slate-900">
                            Quantity: <span className="text-[#F36F21] font-black font-mono">{qty} Unit{qty > 1 ? 's' : ''}</span>
                          </span>
                          <span>•</span>
                          <span className="font-bold text-slate-900">
                            Rate: <span className="font-black font-mono text-slate-900">₹{unitPrice} / kit set</span>
                          </span>
                          <span>•</span>
                          <span className="text-slate-500 font-mono">
                            Subtotal: ₹{unitPrice} × {qty} = <strong>₹{totalAmount}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-slate-200 w-full md:w-auto">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Doorstep Delivery</span>
                      <span className="text-xs font-bold text-[#1E8A38]">FREE ₹0</span>
                    </div>
                  </div>

                  {/* Kit Activation Slots Progress Box */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                    <div className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-100">
                      <span className="font-black text-slate-800 flex items-center space-x-1.5">
                        <QrCode className="w-4 h-4 text-[#F36F21]" />
                        <span>Safety Kit Sets Status ({qty} Total Sets):</span>
                      </span>
                      <span className="text-[11px] font-bold font-mono text-slate-600">
                        {order.claimedCount || 0} of {qty} Activated
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {Array.from({ length: qty }).map((_, idx) => {
                        const isThisClaimed = idx < (order.claimedCount || 0);
                        const linkedQR = order.allocatedQRIds && order.allocatedQRIds[idx];
                        const displayTagId = linkedQR?.productId || (isThisClaimed ? order.claimedProductId : null);

                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border flex justify-between items-center transition ${
                              isThisClaimed
                                ? 'bg-emerald-50/60 border-emerald-200 text-slate-900'
                                : 'bg-amber-50/50 border-amber-200/80 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <span className="text-base">{isThisClaimed ? '🛡️' : '⏳'}</span>
                              <div>
                                <div className="font-bold text-xs flex items-center space-x-1.5">
                                  <span>Kit Set #{idx + 1}</span>
                                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                                    isThisClaimed ? 'bg-[#1E8A38] text-white' : 'bg-amber-200 text-amber-900'
                                  }`}>
                                    {isThisClaimed ? 'Activated' : 'Pending'}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {isThisClaimed
                                    ? `Tag ID: ${displayTagId || 'Active'}`
                                    : 'Scan package QR to activate'}
                                </div>
                              </div>
                            </div>

                            {isThisClaimed && displayTagId ? (
                              <Link
                                to={`/qr-details/${displayTagId}`}
                                className="text-[10px] font-black bg-[#1E8A38] hover:bg-[#16702c] text-white px-3 py-1.5 rounded-lg transition shadow-xs"
                              >
                                View Tag →
                              </Link>
                            ) : (
                              <span className="text-[10px] font-bold text-[#F36F21] bg-white border border-amber-200 px-2 py-0.5 rounded-md">
                                Ready to Claim
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Delivery Address & Tracking Information */}
                  {(order.deliveryAddress || order.city) && (
                    <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                      <div className="flex items-start space-x-2.5">
                        <MapPin className="w-4 h-4 text-[#F36F21] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-black text-slate-800">Delivery Address: </span>
                          <span className="text-slate-600">
                            {order.deliveryAddress}, {order.city}, {order.state} - <strong>{order.pincode}</strong>
                            {order.landmark && ` (Near: ${order.landmark})`}
                          </span>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Recipient: {order.customerName} • +91 {order.customerPhone}
                          </div>
                        </div>
                      </div>

                      {order.trackingNumber && (
                        <div className="text-right shrink-0 bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-mono text-[11px]">
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Tracking #</span>
                          <span className="font-bold text-slate-800">{order.trackingNumber}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons: Order Again & View Invoice */}
                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(order)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View & Download Invoice Receipt</span>
                    </button>

                    <Link
                      to="/store"
                      className="bg-[#F36F21] hover:bg-[#d85810] text-white font-black px-5 py-2.5 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Order Again (Buy Same Kit) →</span>
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* INVOICE MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 my-6">
            
            {/* Invoice Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <img
                  src="/Safe Drive Tag Logo.jpg.jpeg"
                  alt="SafeDrive"
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/favicon.svg';
                  }}
                />
                <div>
                  <h3 className="font-black text-base text-slate-900 leading-tight">Tax Invoice Receipt</h3>
                  <p className="text-[10px] text-slate-400 font-mono">SafeDrive Vehicle Protection Systems</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Order Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Invoice Number</span>
                <span className="font-black text-slate-900 font-mono">{selectedInvoice.orderNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Invoice Date</span>
                <span className="font-bold text-slate-800">
                  {new Date(selectedInvoice.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Billed To</span>
                <span className="font-bold text-slate-800">{selectedInvoice.customerName}</span>
                <p className="text-[10px] text-slate-500 font-mono">+91 {selectedInvoice.customerPhone}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Status</span>
                <span className="font-bold text-[#1E8A38] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block text-[10px]">
                  ✓ PAID ONLINE
                </span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-black uppercase text-slate-400 pb-1 border-b border-slate-100">
                <span>Description</span>
                <span>Amount</span>
              </div>

              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                <div>
                  <div className="font-bold text-slate-900">{selectedInvoice.productName || 'SafeDrive Vehicle Protection Tag Kit'}</div>
                  <div className="text-[10px] text-slate-500">
                    Category: {selectedInvoice.qrFor || 'Vehicle'} • Qty: {selectedInvoice.quantity || 1} Set{selectedInvoice.quantity > 1 ? 's' : ''} @ ₹{selectedInvoice.unitPrice || Math.round(selectedInvoice.amount / (selectedInvoice.quantity || 1))} / kit
                  </div>
                </div>
                <div className="font-mono font-bold text-slate-900">
                  ₹{selectedInvoice.amount}
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-500 py-1">
                <span>Delivery & Doorstep Shipping</span>
                <span className="text-[#1E8A38] font-bold">FREE ₹0</span>
              </div>

              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                <span>Total Amount Paid</span>
                <span className="text-[#1E8A38] font-mono text-base">₹{selectedInvoice.amount}</span>
              </div>
            </div>

            {/* Delivery Destination */}
            {selectedInvoice.deliveryAddress && (
              <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                <span className="font-bold text-slate-800 block text-[10px] uppercase">Shipping Destination:</span>
                <p>{selectedInvoice.deliveryAddress}, {selectedInvoice.city}, {selectedInvoice.state} - {selectedInvoice.pincode}</p>
              </div>
            )}

            {/* Print & Close Actions */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintInvoice}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
