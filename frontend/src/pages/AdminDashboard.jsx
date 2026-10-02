// This code is used for the AdminDashboard page to display specific views to the user.
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Trash2, Plus, MessageSquare, Calendar as CalendarIcon, Loader2, Users, CheckCircle, Circle, X, ScanLine } from 'lucide-react';

const API_URL = 'http://localhost:5000';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeTab, setActiveTab] = useState('events'); // events, msgs, add, participants
    const [loading, setLoading] = useState(true);

    // Add-event form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [category, setCategory] = useState('Professional Events');
    const [image, setImage] = useState(null);
    const [sessions, setSessions] = useState([]); // [{title, speaker, startTime, endTime}]
    const [coordinatorName, setCoordinatorName] = useState('');
    const [coordinatorPhone, setCoordinatorPhone] = useState('');
    const [entryFee, setEntryFee] = useState('');
    const [capacity, setCapacity] = useState('');

    // Participants panel state
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [participantsLoading, setParticipantsLoading] = useState(false);

    // Auth now travels in the HTTP-only cookie (axios.defaults.withCredentials), so no headers are needed
    const config = {};

    const fetchData = async () => {
        setLoading(true);
        try {
            // Concurrently fetch standard events and protected admin messages
            const [eventsRes, msgsRes] = await Promise.all([
                axios.get(`${API_URL}/api/events`),
                axios.get(`${API_URL}/api/messages`, config)
            ]);
            setEvents(eventsRes.data);
            setMessages(msgsRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    // Handler to delete an event via the API with user confirmation
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this event?')) return;
        try {
            // Send authorized delete request to backend and refresh displayed list
            await axios.delete(`${API_URL}/api/events/${id}`, config);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    // Session field helpers for the Add Event form
    const addSessionRow = () => {
        setSessions([...sessions, { title: '', speaker: '', startTime: '', endTime: '' }]);
    };
    const updateSessionRow = (index, field, value) => {
        const updated = [...sessions];
        updated[index][field] = value;
        setSessions(updated);
    };
    const removeSessionRow = (index) => {
        setSessions(sessions.filter((_, i) => i !== index));
    };

    // Handler for the Add Event Form submit action
    const handleAddEvent = async (e) => {
        e.preventDefault();
        try {
            // Build multipart/form-data to support file uploads along with text fields
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('date', date);
            formData.append('category', category);
            formData.append('sessions', JSON.stringify(sessions.filter(s => s.title && s.speaker)));
            formData.append('coordinatorName', coordinatorName);
            formData.append('coordinatorPhone', coordinatorPhone);
            formData.append('entryFee', entryFee || 0);
            formData.append('capacity', capacity || 0);
            if (image) formData.append('image', image);

            await axios.post(`${API_URL}/api/events`, formData, config);

            // Reset and switch tab
            setTitle(''); setDescription(''); setDate(''); setImage(null); setSessions([]);
            setCoordinatorName(''); setCoordinatorPhone(''); setEntryFee(''); setCapacity('');
            setActiveTab('events');
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Error adding event');
        }
    };

    // Open the Participants panel for a given event
    const openParticipants = async (event) => {
        setSelectedEvent(event);
        setActiveTab('participants');
        setParticipantsLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/api/registrations/event/${event._id}`, config);
            setRegistrations(data);
        } catch (error) {
            console.error(error);
        } finally {
            setParticipantsLoading(false);
        }
    };

    // Toggle a participant's attendance
    const toggleAttendance = async (registrationId) => {
        try {
            const { data } = await axios.put(`${API_URL}/api/registrations/${registrationId}/attendance`, {}, config);
            setRegistrations(registrations.map(r => (r._id === registrationId ? { ...r, attended: data.attended, checkedInAt: data.checkedInAt } : r)));
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-indigo-600 h-10 w-10" />
            </div>
        );
    }

    if (user?.role !== 'admin') {
        return <div className="text-center mt-20 text-red-600 font-bold text-2xl">Access Denied</div>;
    }

    return (
        <div className="max-w-6xl mx-auto mt-8">
            <h1 className="text-3xl font-extrabold text-slate-800 mb-8">Admin Dashboard</h1>

            <div className="flex gap-4 mb-8 flex-wrap">
                <button
                    onClick={() => setActiveTab('events')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${activeTab === 'events' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                    <CalendarIcon size={18} /> Manage Events
                </button>
                <button
                    onClick={() => setActiveTab('add')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${activeTab === 'add' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                    <Plus size={18} /> Add Event
                </button>
                <button
                    onClick={() => setActiveTab('msgs')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${activeTab === 'msgs' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                    <MessageSquare size={18} /> Contact Messages
                </button>
                <Link
                    to="/admin/checkin"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors bg-white text-slate-600 hover:bg-slate-50"
                >
                    <ScanLine size={18} /> QR Check-in
                </Link>
            </div>

            {/* Events List View */}
            {activeTab === 'events' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100 uppercase tracking-wide">
                                <th className="p-4 rounded-tl-2xl">Event</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Seats</th>
                                <th className="p-4 text-right rounded-tr-2xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map(ev => (
                                <tr key={ev._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-semibold text-slate-800">{ev.title}</td>
                                    <td className="p-4 text-slate-500"><span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs">{ev.category}</span></td>
                                    <td className="p-4 text-slate-500">{new Date(ev.date).toLocaleDateString()}</td>
                                    <td className="p-4 text-slate-500 text-sm">
                                        {ev.registeredCount || 0} / {ev.capacity > 0 ? ev.capacity : '∞'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => openParticipants(ev)}
                                            className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg transition-colors mr-2"
                                            title="View participants"
                                        >
                                            <Users size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ev._id)}
                                            className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {events.length === 0 && (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No events found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Participants View */}
            {activeTab === 'participants' && selectedEvent && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{selectedEvent.title}</h2>
                            <p className="text-sm text-slate-500">{registrations.length} participant(s) registered</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                to={`/admin/checkin?event=${selectedEvent._id}`}
                                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                            >
                                <ScanLine size={16} /> Scan tickets
                            </Link>
                            <button onClick={() => setActiveTab('events')} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {participantsLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-600" /></div>
                    ) : registrations.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">No one has registered for this event yet.</p>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-500 text-sm border-b border-slate-100 uppercase tracking-wide">
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Ticket</th>
                                    <th className="p-3">Payment</th>
                                    <th className="p-3 text-right">Attendance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registrations.map(reg => (
                                    <tr key={reg._id} className="border-b border-slate-50">
                                        <td className="p-3 font-medium text-slate-800">{reg.user?.name}</td>
                                        <td className="p-3 text-slate-500">{reg.user?.email}</td>
                                        <td className="p-3 font-mono text-xs text-slate-500">{reg.ticketCode}</td>
                                        <td className="p-3 text-sm text-slate-500">
                                            {reg.paymentStatus === 'paid' ? `₹${reg.amountPaid} · ${reg.paymentMethod}` : 'Free'}
                                        </td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={() => toggleAttendance(reg._id)}
                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${reg.attended ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-500'}`}
                                            >
                                                {reg.attended ? <CheckCircle size={16} /> : <Circle size={16} />}
                                                {reg.attended ? 'Attended' : 'Mark attended'}
                                            </button>
                                            {reg.attended && reg.checkedInAt && (
                                                <p className="text-xs text-slate-400 mt-1">{new Date(reg.checkedInAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Contact Messages View */}
            {activeTab === 'msgs' && (
                <div className="grid gap-4">
                    {messages.map(msg => (
                        <div key={msg._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg">{msg.name}</h4>
                                    <p className="text-indigo-600 text-sm font-medium">{msg.email}</p>
                                </div>
                                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{new Date(msg.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-600 bg-slate-50 p-4 rounded-xl">{msg.message}</p>
                        </div>
                    ))}
                    {messages.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-2xl">
                            <MessageSquare className="mx-auto text-slate-300 h-12 w-12 mb-3" />
                            <p className="text-slate-500">No messages yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add Event Form */}
            {activeTab === 'add' && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-2xl">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Create New Event</h2>
                    <form onSubmit={handleAddEvent} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} required rows="4" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white">
                                    <option value="Birthday">Birthday</option>
                                    <option value="Anniversary">Anniversary</option>
                                    <option value="Professional Events">Professional Events</option>
                                    <option value="Celebration">Celebration</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Coordinator Name</label>
                                <input value={coordinatorName} onChange={e => setCoordinatorName(e.target.value)} placeholder="e.g. Rahul Mehta" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Coordinator WhatsApp</label>
                                <input value={coordinatorPhone} onChange={e => setCoordinatorPhone(e.target.value)} placeholder="91XXXXXXXXXX" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Entry Fee (₹)</label>
                                <input type="number" min="0" value={entryFee} onChange={e => setEntryFee(e.target.value)} placeholder="0 = Free" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Capacity (seats)</label>
                                <input type="number" min="0" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="0 = Unlimited" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Event Image</label>
                            <input type="file" onChange={e => setImage(e.target.files[0])} accept="image/*" className="w-full px-4 py-3 rounded-xl border border-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                        </div>

                        {/* Sessions & Speakers */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-slate-700">Sessions & Speakers</label>
                                <button type="button" onClick={addSessionRow} className="text-indigo-600 text-sm font-medium flex items-center gap-1 hover:text-indigo-700">
                                    <Plus size={14} /> Add Session
                                </button>
                            </div>
                            <div className="space-y-3">
                                {sessions.map((s, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-xl">
                                        <input
                                            placeholder="Session title"
                                            value={s.title}
                                            onChange={e => updateSessionRow(idx, 'title', e.target.value)}
                                            className="col-span-4 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                        />
                                        <input
                                            placeholder="Speaker"
                                            value={s.speaker}
                                            onChange={e => updateSessionRow(idx, 'speaker', e.target.value)}
                                            className="col-span-3 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                        />
                                        <input
                                            placeholder="Start (e.g. 10:00 AM)"
                                            value={s.startTime}
                                            onChange={e => updateSessionRow(idx, 'startTime', e.target.value)}
                                            className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                        />
                                        <input
                                            placeholder="End (optional)"
                                            value={s.endTime}
                                            onChange={e => updateSessionRow(idx, 'endTime', e.target.value)}
                                            className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                        />
                                        <button type="button" onClick={() => removeSessionRow(idx)} className="col-span-1 text-red-400 hover:text-red-600 flex justify-center">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                {sessions.length === 0 && (
                                    <p className="text-xs text-slate-400">Optional — add a schedule with speakers if this event has multiple sessions.</p>
                                )}
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl mt-4 transition-colors">Submit Event</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
