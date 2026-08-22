import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  User,
  MapPin,
  RefreshCw,
  ArrowRight,
  CreditCard,
  Check,
  AlertTriangle,
  QrCode,
  Edit2,
} from 'lucide-react';
import { API_BASE } from '../config/api';

export default function CheckoutModal({ product, onClose, onPurchaseSuccess }) {
  // Step: 1 = Details, 2 = Email OTP, 3 = Payment Processing, 4 = Success
  const [step, setStep] = useState(1);

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  // Logged-in State detection
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [editAddressMode, setEditAddressMode] = useState(false);

  // OTP State
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');

  // Payment & Order State
  const [processingPayment, setProcessingPayment] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('safe_drive_user_token');
      const storedUser = JSON.parse(localStorage.getItem('safe_drive_user_data') || 'null');
      if (storedToken && storedUser) {
        setIsLoggedIn(true);
        setForm({
          name: storedUser.name || '',
          email: storedUser.email || '',
          phone: storedUser.phone || '',
          address: storedUser.address || '',
          city: storedUser.city || '',
          state: storedUser.state || '',
          pincode: storedUser.pincode || '',
          landmark: storedUser.landmark || ''
        });
      }
    } catch (err) {
      console.error('Error reading logged in user data:', err);
    }
  }, []);

  // Handle Step 1 Submit -> Send OTP to Mobile Number
  const handleProceedToOTP = async (e) => {
    if (e) e.preventDefault();
    if (!form.name || !form.phone || !form.address) {
      setGeneralError('Please fill in all required contact and delivery fields.');
      return;
    }
    setGeneralError('');
    setSendingOtp(true);
    try {
      const res = await axios.post(`${API_BASE}/purchase/send-otp`, {
        phone: form.phone,
        email: form.email,
        name: form.name
      });
      if (res.data.success) {
        setOtpSuccessMsg(res.data.message || `OTP sent to mobile ${form.phone}`);
        setOtp('123456'); // Auto-fill test OTP for immediate checkout
        setStep(2);
      }
    } catch (err) {
      setGeneralError(err.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle Step 2 Submit -> Verify Mobile OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      setOtpError('Please enter verification code');
      return;
    }
    setOtpError('');
    setVerifyingOtp(true);
    try {
      const res = await axios.post(`${API_BASE}/purchase/verify-otp`, {
        phone: form.phone,
        email: form.email,
        otp
      });
      if (res.data.success) {
        // Proceed to Razorpay Payment
        initiateRazorpayPayment();
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Handle Resend OTP
  const handleResendOTP = async () => {
    setSendingOtp(true);
    setOtpError('');
    try {
      const res = await axios.post(`${API_BASE}/purchase/send-otp`, {
        phone: form.phone,
        email: form.email,
        name: form.name
      });
      if (res.data.success) {
        setOtpSuccessMsg('A new verification code has been dispatched.');
        setOtp('123456');
      }
    } catch (err) {
      setOtpError('Could not resend OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle Step 3 -> Razorpay Order Creation & Checkout
  const initiateRazorpayPayment = async () => {
    setProcessingPayment(true);
    setGeneralError('');
    try {
      // 1. Call Backend to create order
      const orderRes = await axios.post(`${API_BASE}/purchase/create-order`, {
        productId: product._id,
        email: form.email,
        phone: form.phone,
        name: form.name
      });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Could not create order.');
      }

      const { orderId, amount, isLive, isSimulated, keyId } = orderRes.data;

      // 2. Open Razorpay Checkout Modal
      if (window.Razorpay && (isLive || !isSimulated) && keyId && keyId !== 'rzp_test_simulation') {
        const options = {
          key: keyId,
          amount: amount, // Backend sends exact amount in paise
          currency: 'INR',
          name: 'Safe Drive',
          description: `Purchase ${product.name}`,
          order_id: orderId,
          prefill: {
            name: form.name,
            email: form.email,
            contact: form.phone
          },
          theme: {
            color: '#1D56A5'
          },
          handler: async function (response) {
            await handleCompletePurchase({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
          },
          modal: {
            ondismiss: function () {
              setProcessingPayment(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setGeneralError(`Payment Failed: ${response.error?.description || 'Payment rejected'}`);
          setProcessingPayment(false);
        });
        rzp.open();
      } else {
        // Instant Sandbox/Simulated Flow
        await handleCompletePurchase({
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_order_id: orderId,
          razorpay_signature: 'simulated_test_sig'
        });
      }
    } catch (err) {
      setGeneralError(err.response?.data?.message || err.message || 'Error initializing payment.');
      setProcessingPayment(false);
    }
  };

  // Complete & Allocate QR on Backend
  const handleCompletePurchase = async (paymentDetails) => {
    try {
      const res = await axios.post(`${API_BASE}/purchase/complete`, {
        productId: product._id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        ...paymentDetails
      });

      if (res.data.success) {
        setOrderResult(res.data);
        setStep(4); // Success screen

        // Auto Login User in Frontend
        if (res.data.token && res.data.user) {
          localStorage.setItem('safe_drive_user_token', res.data.token);
          localStorage.setItem('safe_drive_user_data', JSON.stringify(res.data.user));
        }

        if (onPurchaseSuccess) {
          onPurchaseSuccess(res.data);
        }
      }
    } catch (err) {
      setGeneralError(err.response?.data?.message || 'Failed to complete order registration.');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl my-6">
        
        {/* Modal Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1D56A5] text-white flex items-center justify-center font-black shadow-md shadow-[#1D56A5]/25 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 leading-tight">
                {step === 4 ? 'Purchase Complete!' : 'Secure Checkout'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {product.name} • <strong className="text-[#1D56A5]">₹{product.price}</strong> ({product.copiesPerSet} Stickers)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner */}
        {generalError && (
          <div className="mb-5 p-3.5 bg-red-50 border border-[#E94E1A]/30 rounded-2xl text-[#E94E1A] text-xs font-semibold flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* STEP 1: CONTACT & DELIVERY DETAILS */}
        {step === 1 && (
          <div>
            {isLoggedIn && !editAddressMode ? (
              /* FAST CHECKOUT FOR LOGGED IN USERS */
              <div className="space-y-5">
                <div className="bg-[#E9DFEE]/50 border border-[#1D56A5]/25 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-[#1D56A5]/15">
                    <span className="text-xs font-bold text-[#1D56A5] flex items-center space-x-1.5">
                      <User className="w-4 h-4" />
                      <span>Account Profile</span>
                    </span>
                    <span className="text-[10px] font-bold text-[#259A3A] bg-emerald-50 border border-[#259A3A]/25 px-2 py-0.5 rounded-full">
                      ✓ Logged In
                    </span>
                  </div>

                  <div className="text-sm font-black text-slate-900">{form.name}</div>
                  <div className="text-xs text-slate-600 font-mono space-y-0.5">
                    <div>📱 {form.phone}</div>
                    <div>✉️ {form.email}</div>
                  </div>

                  <div className="pt-2 border-t border-[#1D56A5]/15 flex justify-between items-start">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        Shipping Address:
                      </div>
                      <div className="text-xs text-slate-800 font-medium">
                        {form.address || 'Address not specified'}
                        {form.landmark && <span className="text-slate-500"> (Near {form.landmark})</span>}
                        {form.city && `, ${form.city}`}
                        {form.state && `, ${form.state}`}
                        {form.pincode && ` - ${form.pincode}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditAddressMode(true)}
                      className="text-[11px] text-[#1D56A5] hover:underline font-bold flex items-center space-x-1 whitespace-nowrap ml-2"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Address</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Payable:</div>
                    <div className="text-2xl font-black text-[#1D56A5]">₹{product.price}</div>
                  </div>
                  <div className="text-[10px] text-slate-500 text-right font-medium">
                    Includes {product.copiesPerSet} Stickers <br />
                    + 1-Year Protection Quota
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToOTP}
                  disabled={sendingOtp}
                  className="w-full bg-[#1D56A5] hover:bg-[#164382] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-[#1D56A5]/25 transition flex items-center justify-center space-x-2 text-xs disabled:opacity-50"
                >
                  {sendingOtp ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send Mobile OTP & Pay</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* GUEST / EDIT ADDRESS FORM */
              <form onSubmit={handleProceedToOTP} className="space-y-4">
                {isLoggedIn && (
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700">Updating Delivery Details:</span>
                    <button
                      type="button"
                      onClick={() => setEditAddressMode(false)}
                      className="text-xs text-[#1D56A5] font-bold hover:underline"
                    >
                      Cancel Edit
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-[#1D56A5] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="optional@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-[#1D56A5] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Phone / Mobile *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="10-digit Mobile"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 text-sm font-mono focus:bg-white focus:outline-none focus:border-[#1D56A5] transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Delivery Address *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <textarea
                      rows="2"
                      required
                      placeholder="House / Flat No., Building, Street Area"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-[#1D56A5] transition"
                    />
                  </div>
                </div>

                {/* Landmark & Pincode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Landmark (Nearby)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near City Mall / Opp Temple"
                      value={form.landmark}
                      onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-[#1D56A5] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Pincode / Postal Code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength="6"
                      placeholder="6-digit Pincode (e.g. 226001)"
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm font-mono focus:bg-white focus:outline-none focus:border-[#1D56A5] transition"
                    />
                  </div>
                </div>

                {/* City & State */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lucknow"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-[#1D56A5] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Uttar Pradesh"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-[#1D56A5] transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sendingOtp}
                  className="w-full bg-[#1D56A5] hover:bg-[#164382] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-[#1D56A5]/25 transition flex items-center justify-center space-x-2 text-xs mt-2 disabled:opacity-50"
                >
                  {sendingOtp ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Continue & Verify Mobile</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* STEP 2: EMAIL OTP VERIFICATION */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-5 text-center">
            {otpSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-[#259A3A]/30 rounded-2xl text-[#259A3A] text-xs font-semibold">
                {otpSuccessMsg}
              </div>
            )}

            {otpError && (
              <div className="p-3 bg-red-50 border border-[#E94E1A]/30 rounded-2xl text-[#E94E1A] text-xs font-semibold">
                {otpError}
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <Phone className="w-8 h-8 text-[#1D56A5] mx-auto mb-2" />
              <h4 className="font-bold text-slate-900 text-sm">Enter Mobile Verification Code</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Verification code for mobile: <strong className="text-slate-900 font-mono">{form.phone}</strong>
              </p>
            </div>

            <div>
              <input
                type="text"
                maxLength="6"
                autoFocus
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-48 mx-auto bg-slate-50 border-2 border-[#1D56A5] rounded-2xl py-3 text-center text-3xl font-black font-mono tracking-widest text-slate-900 focus:bg-white focus:outline-none shadow-sm"
                placeholder="123456"
              />
              <p className="text-[11px] text-slate-400 mt-2 font-medium">Default Test OTP: <span className="font-mono font-bold text-[#1D56A5]">123456</span></p>
            </div>

            <div className="flex items-center justify-between text-xs px-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-500 hover:text-slate-800 font-semibold"
              >
                ← Back to Details
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={sendingOtp}
                className="text-[#1D56A5] font-bold hover:underline"
              >
                Resend Code
              </button>
            </div>

            <button
              type="submit"
              disabled={verifyingOtp || processingPayment || otp.length < 6}
              className="w-full bg-[#1D56A5] hover:bg-[#164382] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-[#1D56A5]/25 transition flex items-center justify-center space-x-2 text-xs disabled:opacity-50"
            >
              {verifyingOtp || processingPayment ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <span>Verify Code & Pay ₹{product.price}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: ORDER SUCCESS */}
        {step === 4 && orderResult && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-[#259A3A] rounded-3xl flex items-center justify-center mx-auto shadow-md shadow-[#259A3A]/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900">Payment Successful!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your QR safety kit has been allocated and linked to your account.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Product:</span>
                <span>{product.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount Paid:</span>
                <span className="font-bold text-[#1D56A5]">₹{product.price}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Allocated Stickers:</span>
                <span className="font-mono font-bold text-slate-900">
                  {orderResult.allocatedQRs?.map((q) => q.copyCode).join(', ')}
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#E9DFEE]/60 border border-[#1D56A5]/25 rounded-2xl text-xs text-[#1D56A5] font-semibold">
              ✉️ Confirmation invoice has been dispatched to <strong>{form.email}</strong>.
            </div>

            <button
              onClick={() => {
                onClose();
                window.location.href = '/dashboard';
              }}
              className="w-full bg-[#1D56A5] hover:bg-[#164382] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-[#1D56A5]/25 transition flex items-center justify-center space-x-2 text-xs"
            >
              <span>Go to My Dashboard & Activate QR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
