// Floating WhatsApp support widget.
// Shows a green chat bubble (bottom-right, visible on every page). Clicking it opens a
// panel listing every event that has a coordinator assigned; clicking an event opens a
// WhatsApp chat with that event's coordinator via a wa.me deep link.
import { useState } from 'react';
import axios from 'axios';
import { MessageCircle, X, User } from 'lucide-react';

const API_URL = 'http://localhost:5000';

// Cycled background colors for the little icon chip next to each event, purely decorative
const CHIP_COLORS = [
    'bg-indigo-50 text-indigo-600',
    'bg-emerald-50 text-emerald-600',
    'bg-amber-50 text-amber-600',
    'bg-pink-50 text-pink-600',
    'bg-sky-50 text-sky-600',
];

const SupportWidget = () => {
    const [open, setOpen] = useState(false);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load coordinators the first time the panel is opened
    const loadCoordinators = () => {
        setLoading(true);
        axios.get(`${API_URL}/api/events`)
            .then(({ data }) => {
                // Only show events that actually have a coordinator contact set
                setEvents(data.filter((e) => e.coordinatorPhone));
            })
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    };

    const togglePanel = () => {
        if (!open && events.length === 0) loadCoordinators();
        setOpen((o) => !o);
    };

    const openWhatsApp = (event) => {
        const phone = event.coordinatorPhone.replace(/\D/g, '');
        const text = encodeURIComponent(
            `Hi ${event.coordinatorName || ''}, I have a question about "${event.title}" on Evently.`
        );
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Panel */}
            {open && (
                <div className="mb-4 w-80 max-h-[28rem] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-indigo-900 text-white px-5 py-4 flex items-start justify-between">
                        <div>
                            <p className="font-bold text-lg">Support Team</p>
                            <p className="text-indigo-200 text-xs mt-0.5">Evently Help Desk</p>
                        </div>
                        <button onClick={() => setOpen(false)} className="text-indigo-200 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-3 space-y-2">
                        {loading && (
                            <p className="text-center text-slate-400 text-sm py-6">Loading coordinators...</p>
                        )}
                        {!loading && events.length === 0 && (
                            <p className="text-center text-slate-400 text-sm py-6">No event coordinators available right now.</p>
                        )}
                        {!loading && events.map((event, idx) => (
                            <button
                                key={event._id}
                                onClick={() => openWhatsApp(event)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                            >
                                <span className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${CHIP_COLORS[idx % CHIP_COLORS.length]}`}>
                                    <User size={18} />
                                </span>
                                <span className="min-w-0">
                                    <span className="block font-semibold text-slate-800 text-sm truncate">{event.title}</span>
                                    <span className="block text-slate-400 text-xs truncate">{event.coordinatorName || 'Event Coordinator'}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Toggle button */}
            <button
                onClick={togglePanel}
                aria-label="Chat with an event coordinator on WhatsApp"
                className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 flex items-center justify-center transition-transform hover:scale-105"
            >
                {open ? <X size={24} /> : <MessageCircle size={26} />}
            </button>
        </div>
    );
};

export default SupportWidget;
