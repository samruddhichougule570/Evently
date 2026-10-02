// This code is used for the EventCard component to render reusable UI parts.
import { Link } from 'react-router-dom';
import { Calendar, Tag, User, Phone, Ticket, Armchair, Lock, CheckCircle } from 'lucide-react';
import { isPastEvent } from '../utils/dates';

const EventCard = ({ event }) => {
    const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const isPast = isPastEvent(event.date);
    const entryLabel = event.entryFee && event.entryFee > 0 ? `₹${event.entryFee}` : 'Free';

    // Seats: capacity 0 means unlimited. registeredCount is kept live by Socket.io (see Home.jsx).
    // Seat info only matters for events that can still be booked - it is hidden for past events.
    const hasLimit = event.capacity > 0;
    const seatsLeft = hasLimit ? Math.max(event.capacity - (event.registeredCount || 0), 0) : null;
    const isFull = !isPast && hasLimit && seatsLeft === 0;

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col ${isPast ? 'opacity-95' : ''}`}>
            <Link to={`/event/${event._id}`} className="aspect-[4/3] overflow-hidden relative block">
                {event.imageUrl ? (
                    <img
                        src={event.imageUrl}
                        alt={event.title}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isPast ? 'grayscale-[35%]' : ''}`}
                    />
                ) : (
                    <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-300">
                        <Tag size={48} />
                    </div>
                )}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-indigo-600 shadow-sm">
                    {event.category}
                </div>
                {isPast && (
                    <div className="absolute top-4 right-4 bg-slate-800/80 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                        Completed
                    </div>
                )}
                {isFull && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                        Full
                    </div>
                )}
            </Link>

            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">{event.title}</h3>

                <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-grow">
                    {event.description}
                </p>

                {/* Coordinator, phone, seats & entry fee */}
                <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-1.5">
                    {event.coordinatorName && (
                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <User size={14} className="text-indigo-500 shrink-0" />
                            <span><span className="text-slate-400">Coord:</span> {event.coordinatorName}</span>
                        </div>
                    )}
                    {event.coordinatorPhone && (
                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <Phone size={14} className="text-indigo-500 shrink-0" />
                            <span>{event.coordinatorPhone}</span>
                        </div>
                    )}

                    {/* Past events: no "199 of 200 seats left" - it makes no sense once the event is over */}
                    {isPast ? (
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <CheckCircle size={14} className="text-slate-400 shrink-0" />
                            <span>Event completed{event.registeredCount > 0 ? ` · ${event.registeredCount} registered` : ''}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <Armchair size={14} className="text-indigo-500 shrink-0" />
                            <span>
                                {hasLimit
                                    ? (isFull ? 'No seats left' : `${seatsLeft} of ${event.capacity} seats left`)
                                    : 'Open seating'}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <Ticket size={14} className="text-indigo-500 shrink-0" />
                            <span>Entry: {entryLabel}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <Calendar size={14} className="text-indigo-500" />
                            <span>{formattedDate}</span>
                        </div>
                    </div>
                </div>

                {isPast ? (
                    <div className="mt-auto">
                        {/* Yellow "Registration Closed" button - not clickable, just like the reference design */}
                        <div
                            aria-disabled="true"
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-300 to-yellow-400 text-amber-900/80 font-bold py-2.5 rounded-xl shadow-sm cursor-not-allowed select-none"
                        >
                            <Lock size={16} /> Registration Closed
                        </div>
                        <Link to={`/event/${event._id}`} className="block text-center text-sm text-indigo-600 hover:underline mt-3">
                            View details & feedback
                        </Link>
                    </div>
                ) : (
                    <Link
                        to={`/event/${event._id}`}
                        className="mt-auto items-center justify-center flex bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white font-medium py-2.5 rounded-xl transition-colors"
                    >
                        {isFull ? 'View Details (Full)' : 'View Details & Register'}
                    </Link>
                )}
            </div>
        </div>
    );
};

export default EventCard;
