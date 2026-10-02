// This code is used for the MyEvents page, showing a logged-in user's own registrations - each one is a QR ticket.
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Loader2, CheckCircle, XCircle, Ticket } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import TicketQR from '../components/TicketQR';
import { isPastEvent } from '../utils/dates';

const API_URL = 'http://localhost:5000';

const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

const MyEvents = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyEvents = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/api/registrations/my`);
                // Ignore registrations whose event was deleted; upcoming events first (soonest first), then past ones
                const valid = data.filter((r) => r.event);
                const upcoming = valid.filter((r) => !isPastEvent(r.event.date)).sort((a, b) => new Date(a.event.date) - new Date(b.event.date));
                const past = valid.filter((r) => isPastEvent(r.event.date)).sort((a, b) => new Date(b.event.date) - new Date(a.event.date));
                setRegistrations([...upcoming, ...past]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchMyEvents();
    }, [user, authLoading]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-indigo-600 h-10 w-10" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">My Registered Events</h1>
            <p className="text-slate-500 mb-8">Each registration is your entry ticket - show the QR code at the entrance.</p>

            {registrations.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-500">
                    You haven't registered for any events yet. <Link to="/" className="text-indigo-600 hover:underline">Browse events</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {registrations.map((reg) => {
                        const past = isPastEvent(reg.event.date);
                        return (
                            <div
                                key={reg._id}
                                className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:shadow-sm transition-shadow"
                            >
                                <div className="min-w-0">
                                    <Link to={`/event/${reg.event._id}`} className="font-bold text-lg text-slate-800 hover:text-indigo-600 transition-colors">
                                        {reg.event.title}
                                    </Link>
                                    <p className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                        <Calendar size={14} /> {formatDate(reg.event.date)}
                                    </p>
                                    <p className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                        <Ticket size={14} />
                                        {reg.paymentStatus === 'paid' ? `Paid ₹${reg.amountPaid} via ${reg.paymentMethod}` : 'Free entry'}
                                    </p>

                                    <div className="mt-3">
                                        {reg.attended ? (
                                            <span className="inline-flex items-center gap-1.5 text-green-600 text-sm font-semibold">
                                                <CheckCircle size={16} /> Attended
                                                {reg.checkedInAt && (
                                                    <span className="text-slate-400 font-normal">
                                                        · checked in {new Date(reg.checkedInAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </span>
                                                )}
                                            </span>
                                        ) : past ? (
                                            <span className="inline-flex items-center gap-1.5 text-slate-400 text-sm">
                                                <XCircle size={16} /> Not checked in
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-indigo-600 text-sm font-medium bg-indigo-50 px-3 py-1 rounded-full">
                                                Upcoming · not checked in yet
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* The QR is only useful for events that haven't happened yet */}
                                {!past && reg.ticketCode && <TicketQR code={reg.ticketCode} size={110} />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyEvents;
