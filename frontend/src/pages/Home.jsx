// This code is used for the Home page to display specific views to the user.
// Features: server-side search (debounced), category + status filters kept in the URL (shareable links),
// and live seat counts pushed by Socket.io.
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import EventCard from '../components/EventCard';
import useDebounce from '../hooks/useDebounce';
import useSeatUpdates from '../hooks/useSeatUpdates';
import { Loader2, Search, X } from 'lucide-react';

const API_URL = 'http://localhost:5000';
const CATEGORIES = ['All', 'Birthday', 'Anniversary', 'Professional Events', 'Celebration'];
const STATUSES = [
    { value: '', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' }
];

const Home = () => {
    // Filters live in the URL (?search=yoga&category=Anniversary&status=upcoming) so a filtered view can be bookmarked / shared
    const [searchParams, setSearchParams] = useSearchParams();
    const category = searchParams.get('category') || 'All';
    const status = searchParams.get('status') || '';
    const urlSearch = searchParams.get('search') || '';

    // The text box updates instantly; the API is only called after the user pauses typing (400ms)
    const [searchText, setSearchText] = useState(urlSearch);
    const debouncedSearch = useDebounce(searchText, 400);

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Keep the URL in sync with the filters
    const updateParam = useCallback((key, value) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (value && value !== 'All') next.set(key, value);
            else next.delete(key);
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    useEffect(() => {
        updateParam('search', debouncedSearch.trim());
    }, [debouncedSearch, updateParam]);

    // Fetch whenever a filter changes (search only changes after the debounce)
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/api/events`, {
                    params: { search: urlSearch, category, status }
                });
                setEvents(data);
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [urlSearch, category, status]);

    // Live seats: when anyone registers/cancels, the server broadcasts and we patch that one card
    useSeatUpdates(({ eventId, registeredCount, capacity }) => {
        setEvents((prev) => prev.map((e) => (e._id === eventId ? { ...e, registeredCount, capacity } : e)));
    });

    const hasFilters = urlSearch || category !== 'All' || status;
    const clearFilters = () => {
        setSearchText('');
        setSearchParams({}, { replace: true });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-indigo-600 h-10 w-10" />
            </div>
        );
    }

    return (
        <div>
            {/* Hero Section */}
            <div className="text-center mb-10 mt-8">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                    Discover Amazing <span className="text-indigo-600">Events</span>
                </h1>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                    Explore our curated list of birthdays, anniversaries, and professional events. Join us to celebrate and connect.
                </p>
            </div>

            {/* Search + filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-10 flex flex-col md:flex-row gap-3">
                <div className="relative flex-grow">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Search events, descriptions or speakers..."
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
                <select
                    value={category}
                    onChange={(e) => updateParam('category', e.target.value)}
                    className="px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-500"
                >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'All' ? 'All categories' : c}</option>)}
                </select>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                    {STATUSES.map((s) => (
                        <button
                            key={s.label}
                            onClick={() => updateParam('status', s.value)}
                            className={`px-4 py-3 text-sm font-medium transition-colors ${status === s.value ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
                {hasFilters && (
                    <button onClick={clearFilters} className="flex items-center justify-center gap-1 px-4 py-3 text-sm text-slate-500 hover:text-red-500">
                        <X size={16} /> Clear
                    </button>
                )}
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.length > 0 ? (
                    events.map((event) => (
                        <EventCard key={event._id} event={event} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-slate-500 text-lg">
                            {hasFilters ? 'No events match your search.' : 'No events found. Check back later!'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
