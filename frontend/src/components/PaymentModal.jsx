// This code is used for the PaymentModal component - the checkout step for paid events.
// It is a SIMULATED gateway (no real money moves). To go live, replace the fake delay in handlePay with
// Razorpay/Stripe Checkout and let the backend verify the gateway's signature before creating the registration.
import { useState } from 'react';
import { X, CreditCard, Smartphone, Landmark, ShieldCheck, Loader2 } from 'lucide-react';

const METHODS = [
    { id: 'UPI', label: 'UPI', icon: Smartphone },
    { id: 'Card', label: 'Credit / Debit Card', icon: CreditCard },
    { id: 'NetBanking', label: 'Net Banking', icon: Landmark }
];

const PaymentModal = ({ eventTitle, amount, onClose, onSuccess }) => {
    const [method, setMethod] = useState('UPI');
    const [processing, setProcessing] = useState(false);

    const handlePay = () => {
        setProcessing(true);
        // Pretend the gateway is talking to the bank for a moment
        setTimeout(() => onSuccess(method), 1500);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-indigo-900 text-white px-6 py-5 flex justify-between items-start">
                    <div>
                        <p className="text-indigo-200 text-xs uppercase tracking-wide">Checkout</p>
                        <p className="font-bold text-lg">{eventTitle}</p>
                    </div>
                    {!processing && (
                        <button onClick={onClose} className="text-indigo-200 hover:text-white"><X size={20} /></button>
                    )}
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-center mb-5">
                        <span className="text-slate-500">Entry fee</span>
                        <span className="text-2xl font-extrabold text-slate-900">₹{amount}</span>
                    </div>

                    <div className="space-y-2 mb-5">
                        {METHODS.map((m) => (
                            <button
                                key={m.id}
                                disabled={processing}
                                onClick={() => setMethod(m.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${method === m.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
                            >
                                <m.icon size={18} className="text-indigo-600" />
                                <span className="text-sm font-medium text-slate-700">{m.label}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handlePay}
                        disabled={processing}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {processing ? <><Loader2 size={18} className="animate-spin" /> Processing payment...</> : `Pay ₹${amount}`}
                    </button>

                    <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-4">
                        <ShieldCheck size={14} /> Demo gateway - no real money is charged
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
