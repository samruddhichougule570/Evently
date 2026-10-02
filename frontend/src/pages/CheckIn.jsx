// This code is used for the CheckIn page (admin only): scan attendees' QR tickets at the entrance to mark attendance.
// Three ways to check someone in: live camera scan, upload a photo/screenshot of the QR, or type the ticket code.
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import {
    ScanLine, Camera, CameraOff, Keyboard, ImageUp, CheckCircle2, AlertTriangle, XCircle, Users, Loader2, ArrowLeft
} from 'lucide-react';

const API_URL = 'http://localhost:5000';

const CheckIn = () => {
    const [searchParams] = useSearchParams();
    const [events, setEvents] = useState([]);
    const [eventId, setEventId] = useState(searchParams.get('event') || '');
    const [registrations, setRegistrations] = useState([]);
    const [result, setResult] = useState(null); // { type: 'success' | 'warning' | 'error', message, name? }
    const [scanning, setScanning] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [manualCode, setManualCode] = useState('');
    const [loadingEvents, setLoadingEvents] = useState(true);

    const scannerRef = useRef(null); // the live Html5Qrcode camera instance
    const lastScanRef = useRef({ code: '', at: 0 }); // stops one QR from being submitted 10 times a second
    const eventIdRef = useRef(eventId); // lets the camera callback always see the latest selected event

    useEffect(() => {
        eventIdRef.current = eventId;
    });

    // Load all events for the dropdown; default to the one closest to today
    useEffect(() => {
        const loadEvents = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/api/events`);
                setEvents(data);
                setEventId((current) => {
                    if (current) return current;
                    if (!data.length) return '';
                    const now = Date.now();
                    return [...data].sort((a, b) => Math.abs(new Date(a.date) - now) - Math.abs(new Date(b.date) - now))[0]._id;
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingEvents(false);
            }
        };
        loadEvents();
    }, []);

    const loadRegistrations = useCallback(async (id) => {
        if (!id) return;
        try {
            const { data } = await axios.get(`${API_URL}/api/registrations/event/${id}`);
            setRegistrations(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        setResult(null);
        setRegistrations([]);
        loadRegistrations(eventId);
    }, [eventId, loadRegistrations]);

    // Send one ticket code to the server
    const submitCode = useCallback(async (raw) => {
        const code = String(raw || '').trim();
        if (!code) return;
        try {
            const { data } = await axios.post(`${API_URL}/api/registrations/checkin`, {
                ticketCode: code,
                eventId: eventIdRef.current
            });
            setResult({ type: 'success', message: data.message, name: data.name, detail: data.paymentStatus === 'paid' ? 'Ticket paid' : 'Free entry' });
            loadRegistrations(eventIdRef.current);
        } catch (err) {
            const body = err.response?.data;
            if (err.response?.status === 409) {
                setResult({
                    type: 'warning',
                    message: body.message,
                    name: body.name,
                    detail: body.checkedInAt ? `Earlier check-in at ${new Date(body.checkedInAt).toLocaleTimeString()}` : ''
                });
            } else {
                setResult({ type: 'error', message: body?.message || 'Check-in failed. Is the server running?' });
            }
        }
    }, [loadRegistrations]);

    // ---- Camera ----
    const handleScan = useCallback((text) => {
        const now = Date.now();
        if (text === lastScanRef.current.code && now - lastScanRef.current.at < 4000) return; // same QR still in front of the camera
        lastScanRef.current = { code: text, at: now };
        submitCode(text);
    }, [submitCode]);

    const startCamera = async () => {
        setCameraError('');
        setScanning(true); // show the video box first so the scanner has a visible element to attach to
        try {
            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 240, height: 240 } },
                handleScan,
                () => {} // "no QR in this frame" fires constantly - ignore it
            );
        } catch {
            scannerRef.current = null;
            setScanning(false);
            setCameraError('Could not open the camera. Allow camera permission in the browser, or use the upload / manual options below.');
        }
    };

    const stopCamera = async () => {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        if (scanner) {
            try {
                await scanner.stop();
                scanner.clear();
            } catch {
                // already stopped
            }
        }
        setScanning(false);
    };

    // Turn the camera off if the admin leaves this page
    useEffect(() => () => {
        const scanner = scannerRef.current;
        if (scanner) scanner.stop().then(() => scanner.clear()).catch(() => {});
    }, []);

    // ---- Upload a photo / screenshot of a QR ----
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const decoder = new Html5Qrcode('qr-file-decoder', false);
        let text;
        try {
            text = await decoder.scanFile(file, false);
        } catch {
            setResult({ type: 'error', message: 'No QR code found in that image. Try a clearer picture.' });
            return;
        }
        try {
            decoder.clear();
        } catch {
            // cleanup problems don't matter - the QR was already read
        }
        submitCode(text);
    };

    // ---- Manual entry ----
    const handleManualSubmit = (e) => {
        e.preventDefault();
        submitCode(manualCode);
        setManualCode('');
    };

    const attendedList = registrations
        .filter((r) => r.attended)
        .sort((a, b) => new Date(b.checkedInAt || 0) - new Date(a.checkedInAt || 0));
    const selectedEvent = events.find((e) => e._id === eventId);

    const resultStyles = {
        success: { box: 'bg-green-50 border-green-200 text-green-800', Icon: CheckCircle2, icon: 'text-green-500' },
        warning: { box: 'bg-amber-50 border-amber-200 text-amber-800', Icon: AlertTriangle, icon: 'text-amber-500' },
        error: { box: 'bg-red-50 border-red-200 text-red-800', Icon: XCircle, icon: 'text-red-500' }
    };

    if (loadingEvents) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-indigo-600 h-10 w-10" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-4">
                <ArrowLeft size={16} /> Back to dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 mb-2">
                <ScanLine className="text-indigo-600" /> QR Check-in
            </h1>
            <p className="text-slate-500 mb-6">Scan an attendee's ticket to mark them as present. Each ticket works once.</p>

            {/* Event picker */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Event being checked in</label>
                <select
                    value={eventId}
                    onChange={(e) => { stopCamera(); setEventId(e.target.value); }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                    {events.length === 0 && <option value="">No events available</option>}
                    {events.map((ev) => (
                        <option key={ev._id} value={ev._id}>
                            {ev.title} — {new Date(ev.date).toLocaleDateString()}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Scanner */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Camera size={18} className="text-indigo-500" /> Scan a ticket</h2>

                    <div id="qr-reader" className={`overflow-hidden rounded-xl bg-slate-900 ${scanning ? '' : 'hidden'}`} />
                    {!scanning && (
                        <div className="rounded-xl bg-slate-100 h-48 flex flex-col items-center justify-center text-slate-400 mb-1">
                            <CameraOff size={36} className="mb-2" />
                            <span className="text-sm">Camera is off</span>
                        </div>
                    )}
                    {cameraError && <p className="text-red-500 text-xs mt-3">{cameraError}</p>}

                    <button
                        onClick={scanning ? stopCamera : startCamera}
                        disabled={!eventId}
                        className={`w-full mt-4 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 ${scanning ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                        {scanning ? 'Stop camera' : 'Start camera'}
                    </button>

                    <div className="grid sm:grid-cols-2 gap-3 mt-4">
                        {/* Upload */}
                        <label className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer ${!eventId ? 'opacity-50 pointer-events-none' : ''}`}>
                            <ImageUp size={16} /> Upload QR image
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                    </div>
                    <div id="qr-file-decoder" className="hidden" />

                    {/* Manual entry */}
                    <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
                        <div className="relative flex-1">
                            <Keyboard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                placeholder="Type ticket code (EVT-XXXXXXXX)"
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <button type="submit" disabled={!eventId || !manualCode.trim()} className="px-4 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-50">
                            Check in
                        </button>
                    </form>

                    {/* Result of the last scan */}
                    {result && (() => {
                        const { box, Icon, icon } = resultStyles[result.type];
                        return (
                            <div className={`mt-5 border rounded-xl p-4 flex items-start gap-3 ${box}`}>
                                <Icon size={24} className={`${icon} shrink-0`} />
                                <div>
                                    <p className="font-bold">{result.message}</p>
                                    {result.detail && <p className="text-sm opacity-80 mt-0.5">{result.detail}</p>}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Live attendance */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h2 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><Users size={18} className="text-indigo-500" /> Attendance</h2>
                    {selectedEvent && <p className="text-sm text-slate-500 mb-4">{selectedEvent.title}</p>}

                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-extrabold text-slate-900">{attendedList.length}</span>
                        <span className="text-slate-500 mb-1">of {registrations.length} checked in</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
                        <div
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: registrations.length ? `${(attendedList.length / registrations.length) * 100}%` : '0%' }}
                        />
                    </div>

                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Recent check-ins</h3>
                    {attendedList.length === 0 ? (
                        <p className="text-sm text-slate-400">Nobody has been checked in yet.</p>
                    ) : (
                        <ul className="space-y-2 max-h-72 overflow-y-auto">
                            {attendedList.map((r) => (
                                <li key={r._id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{r.user?.name}</p>
                                        <p className="text-xs text-slate-500">{r.user?.email}</p>
                                    </div>
                                    <span className="text-xs text-slate-500">
                                        {r.checkedInAt ? new Date(r.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'manual'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckIn;
