// This code is used for the EventDetails page to display specific views to the user.
import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Tag, ArrowLeft, Loader2, Users, Star, Mic, Armchair, Ticket, Lock, CheckCircle, QrCode } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import TicketQR from '../components/TicketQR';
import useSeatUpdates from '../hooks/useSeatUpdates';
import { isPastEvent } from '../utils/dates';
import { loadRazorpayScript } from '../utils/razorpay';

const API_URL = 'http://localhost:5000';

const EventDetails = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Registration state
    const [myRegistration, setMyRegistration] = useState(null); // the user's own registration for this event (or null)
    const [showPayment, setShowPayment] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [regMessage, setRegMessage] = useState('');

    // Feedback state
    const [feedbackData, setFeedbackData] = useState({ feedback: [], averageRating: null, count: 0 });
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState('');

    const fetchEvent = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/events/${id}`);
            setEventData(data);
        } catch {
            setError('Event not found.');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyRegistrations = async () => {
        if (!user) return;
        try {
            const { data } = await axios.get(`${API_URL}/api/registrations/my`);
            setMyRegistration(data.find((r) => r.event && r.event._id === id) || null);
        } catch {
            // silently ignore - not critical to page load
        }
    };

    const fetchFeedback = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/feedback/event/${id}`);
            setFeedbackData(data);
        } catch {
            // silently ignore
        }
    };

    useEffect(() => {
        fetchEvent();
        fetchFeedback();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        fetchMyRegistrations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, id]);

    // Live seats: update this page's counter when anyone registers/cancels
    useSeatUpdates(({ eventId, registeredCount, capacity }) => {
        if (eventId === id) {
            setEventData((prev) => (prev ? { ...prev, registeredCount, capacity } : prev));
        }
    });

    // Sends the registration to the server. `payment` is only used for paid events:
    //   demo gateway -> { paymentMethod: 'UPI' }
    //   Razorpay     -> { razorpay_order_id, razorpay_payment_id, razorpay_signature } (the server verifies these)
    const submitRegistration = async (payment = {}) => {
        setRegistering(true);
        setRegMessage('');
        try {
            await axios.post(`${API_URL}/api/registrations`, { eventId: id, ...payment });
            await fetchMyRegistrations();
            setRegMessage('You are registered for this event! Your QR ticket is below.');
        } catch (err) {
            setRegMessage(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setRegistering(false);
            setShowPayment(false);
        }
    };

    // Opens the real Razorpay checkout (test mode with test keys, live mode with live keys)
    const payWithRazorpay = async () => {
        setRegistering(true);
        setRegMessage('');
        try {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) throw new Error('Could not load Razorpay. Please check your internet connection.');

            // The server creates the order - so the amount comes from OUR database, not from the browser
            const { data: order } = await axios.post(`${API_URL}/api/payments/order`, { eventId: id });

            const checkout = new window.Razorpay({
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                order_id: order.orderId,
                name: 'Evently',
                description: order.eventTitle,
                prefill: { name: user.name, email: user.email },
                theme: { color: '#4f46e5' },
                // Payment done -> send the proof to our server, which verifies the signature before issuing the ticket
                handler: (response) => submitRegistration({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                }),
                modal: { ondismiss: () => setRegistering(false) }
            });
            checkout.on('payment.failed', (response) => {
                setRegMessage(response.error?.description || 'Payment failed. Please try again.');
                setRegistering(false);
            });
            checkout.open();
        } catch (err) {
            setRegMessage(err.response?.data?.message || err.message || 'Could not start the payment.');
            setRegistering(false);
        }
    };

    const handleRegister = async () => {
        if (!user) {
            navigate('/login', { state: { from: { pathname: `/event/${id}` } } });
            return;
        }
        // Free event -> register straight away
        if (!(eventData.entryFee > 0)) {
            submitRegistration();
            return;
        }
        // Paid event -> ask the server which gateway is active: real Razorpay, or the built-in demo checkout
        try {
            const { data: config } = await axios.get(`${API_URL}/api/payments/config`);
            if (config.mode === 'razorpay') payWithRazorpay();
            else setShowPayment(true);
        } catch {
            setRegMessage('Could not start the payment. Please try again.');
        }
    };

    const handleCancelRegistration = async () => {
        setRegistering(true);
        setRegMessage('');
        try {
            await axios.delete(`${API_URL}/api/registrations/${id}`);
            setMyRegistration(null);
            setRegMessage('Registration cancelled.');
        } catch (err) {
            setRegMessage(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setRegistering(false);
        }
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        setFeedbackMessage('');
        try {
            await axios.post(`${API_URL}/api/feedback`, { eventId: id, rating, comment });
            setFeedbackMessage('Thanks for your feedback!');
            setComment('');
            fetchFeedback();
        } catch (err) {
            setFeedbackMessage(err.response?.data?.message || 'Could not submit feedback.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-indigo-600 h-10 w-10" />
            </div>
        );
    }

    if (error || !eventData) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">{error}</h2>
                <Link to="/" className="text-indigo-600 hover:underline">Back to Home</Link>
            </div>
        );
    }

    const eventDate = new Date(eventData.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const isPast = isPastEvent(eventData.date);

    // Seats & fee (capacity 0 = unlimited)
    const isRegistered = !!myRegistration;
    const hasLimit = eventData.capacity > 0;
    const seatsLeft = hasLimit ? Math.max(eventData.capacity - (eventData.registeredCount || 0), 0) : null;
    const isFull = hasLimit && seatsLeft === 0;
    const hasGivenFeedback = !!user && feedbackData.feedback.some((f) => f.user?._id === user._id);

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
            <div className="h-64 md:h-96 w-full relative bg-slate-100">
                {eventData.imageUrl ? (
                    <img
                        src={eventData.imageUrl}
                        alt={eventData.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <Tag size={64} className="mb-4 opacity-50" />
                        <span>No image available</span>
                    </div>
                )}
                <Link to="/" className="absolute top-6 left-6 bg-white/80 hover:bg-white backdrop-blur-md p-2 rounded-full text-slate-800 hover:text-indigo-600 transition-colors shadow-sm">
                    <ArrowLeft />
                </Link>
            </div>

            <div className="p-8 md:p-12">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <span className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-semibold">
                        {eventData.category}
                    </span>
                    <span className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                        <Calendar size={16} className="text-indigo-500" />
                        {formattedDate}
                    </span>
                    {isPast && (
                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-semibold">
                            Past Event
                        </span>
                    )}
                    {feedbackData.averageRating && (
                        <span className="flex items-center gap-1 text-amber-500 font-semibold text-sm">
                            <Star size={16} fill="currentColor" />
                            {feedbackData.averageRating} ({feedbackData.count})
                        </span>
                    )}
                </div>

                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">{eventData.title}</h1>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 mb-6">
                    <span className="flex items-center gap-2">
                        <Ticket size={16} className="text-indigo-500" />
                        Entry: {eventData.entryFee > 0 ? `₹${eventData.entryFee}` : 'Free'}
                    </span>
                    <span className="flex items-center gap-2">
                        <Armchair size={16} className="text-indigo-500" />
                        {hasLimit ? (isFull ? 'No seats left' : `${seatsLeft} of ${eventData.capacity} seats left`) : 'Open seating'}
                    </span>
                </div>

                {/* Register / Cancel button - only makes sense for future events */}
                {!isPast && (
                    <div className="mb-8">
                        {isRegistered ? (
                            <button
                                onClick={handleCancelRegistration}
                                disabled={registering}
                                className="bg-white border-2 border-red-500 text-red-500 hover:bg-red-50 font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {registering ? 'Please wait...' : '✓ Registered — Cancel'}
                            </button>
                        ) : (
                            <button
                                onClick={handleRegister}
                                disabled={registering || isFull}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {registering
                                    ? 'Please wait...'
                                    : isFull
                                        ? 'Event Full'
                                        : eventData.entryFee > 0 ? `Register & Pay ₹${eventData.entryFee}` : 'Register for this Event'}
                            </button>
                        )}
                        {isRegistered && myRegistration.paymentStatus === 'paid' && (
                            <p className="text-xs text-slate-400 mt-2">Paid ₹{myRegistration.amountPaid} via {myRegistration.paymentMethod} · Ref {myRegistration.paymentRef}</p>
                        )}
                        {regMessage && <p className="text-sm text-slate-500 mt-2">{regMessage}</p>}
                    </div>
                )}

                {/* Past event: same yellow "Registration Closed" look as the event cards */}
                {isPast && (
                    <div className="mb-8">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-300 to-yellow-400 text-amber-900/80 font-bold px-6 py-3 rounded-xl shadow-sm cursor-not-allowed select-none">
                            <Lock size={18} /> Registration Closed
                        </div>
                        {isRegistered && (
                            <p className={`flex items-center gap-2 text-sm mt-3 ${myRegistration.attended ? 'text-green-600' : 'text-slate-500'}`}>
                                <CheckCircle size={16} />
                                {myRegistration.attended ? 'You attended this event' : 'You were registered but were not checked in'}
                            </p>
                        )}
                    </div>
                )}

                {/* QR ticket: shown to registered users for upcoming events. The admin scans it at the entrance. */}
                {!isPast && isRegistered && myRegistration.ticketCode && (
                    <div className="mb-10 bg-indigo-50/60 border border-indigo-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
                        <TicketQR code={myRegistration.ticketCode} size={150} />
                        <div className="text-center sm:text-left">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-2">
                                <QrCode size={20} className="text-indigo-500" /> Your entry ticket
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                                Show this QR code at the entrance. The organiser scans it to mark your attendance.
                            </p>
                            {myRegistration.attended ? (
                                <p className="inline-flex items-center gap-1.5 text-green-600 text-sm font-semibold mt-3">
                                    <CheckCircle size={16} /> Checked in
                                </p>
                            ) : (
                                <p className="text-xs text-slate-400 mt-3">Not checked in yet · one scan per ticket</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="prose prose-indigo max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap mb-10">
                    {eventData.description}
                </div>

                {/* Sessions & Speakers */}
                {eventData.sessions && eventData.sessions.length > 0 && (
                    <div className="mb-10">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Mic size={20} className="text-indigo-500" /> Sessions & Speakers
                        </h3>
                        <div className="space-y-3">
                            {eventData.sessions.map((s) => (
                                <div key={s._id} className="bg-slate-50 p-4 rounded-xl flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-slate-800">{s.title}</p>
                                        <p className="text-sm text-slate-500">Speaker: {s.speaker}</p>
                                    </div>
                                    <span className="text-sm text-slate-500 font-medium whitespace-nowrap">
                                        {s.startTime}{s.endTime ? ` - ${s.endTime}` : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Post-event feedback */}
                {isPast && (
                    <div className="border-t border-slate-100 pt-8">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Users size={20} className="text-indigo-500" /> Feedback
                        </h3>

                        {user && isRegistered && !myRegistration.attended && (
                            <p className="bg-amber-50 text-amber-700 text-sm p-4 rounded-xl mb-6">
                                Feedback opens once the organiser marks you as attended.
                            </p>
                        )}

                        {hasGivenFeedback && (
                            <p className="bg-green-50 text-green-700 text-sm p-4 rounded-xl mb-6">You've already shared your feedback - thank you!</p>
                        )}

                        {user && isRegistered && myRegistration.attended && !hasGivenFeedback && (
                            <form onSubmit={handleFeedbackSubmit} className="bg-slate-50 p-5 rounded-2xl mb-6">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Your rating</label>
                                <div className="flex gap-1 mb-3">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <button
                                            type="button"
                                            key={n}
                                            onClick={() => setRating(n)}
                                        >
                                            <Star size={22} className={n <= rating ? 'text-amber-500' : 'text-slate-300'} fill={n <= rating ? 'currentColor' : 'none'} />
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Share your thoughts about this event..."
                                    className="w-full border border-slate-200 rounded-xl p-3 text-sm mb-3"
                                    rows={3}
                                />
                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-xl text-sm">
                                    Submit Feedback
                                </button>
                                {feedbackMessage && <p className="text-sm text-slate-500 mt-2">{feedbackMessage}</p>}
                            </form>
                        )}

                        <div className="space-y-3">
                            {feedbackData.feedback.length === 0 && (
                                <p className="text-slate-400 text-sm">No feedback yet.</p>
                            )}
                            {feedbackData.feedback.map((f) => (
                                <div key={f._id} className="bg-white border border-slate-100 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-slate-800 text-sm">{f.user?.name || 'Anonymous'}</span>
                                        <span className="flex items-center text-amber-500 text-xs">
                                            <Star size={12} fill="currentColor" /> {f.rating}
                                        </span>
                                    </div>
                                    {f.comment && <p className="text-sm text-slate-600">{f.comment}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showPayment && (
                <PaymentModal
                    eventTitle={eventData.title}
                    amount={eventData.entryFee}
                    onClose={() => setShowPayment(false)}
                    onSuccess={(method) => submitRegistration({ paymentMethod: method })}
                />
            )}
        </div>
    );
};

export default EventDetails;
