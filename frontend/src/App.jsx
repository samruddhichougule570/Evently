import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import EventDetails from './pages/EventDetails';
import MyEvents from './pages/MyEvents';
// The scanner library is big, so this page is only downloaded when an admin actually opens it
const CheckIn = lazy(() => import('./pages/CheckIn'));
import Contact from './pages/Contact';
import About from './pages/About';
import SupportWidget from './components/SupportWidget';
import ProtectedRoute from './components/ProtectedRoute';
import { CalendarDays, Globe, Mail, Share2, MapPin, Phone } from 'lucide-react';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

          <Navbar />

          <main className="flex-grow container mx-auto px-4 py-8">
            <Suspense fallback={<div className="text-center text-slate-400 py-20">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/checkin" element={<ProtectedRoute adminOnly><CheckIn /></ProtectedRoute>} />
              <Route path="/event/:id" element={<EventDetails />} />
              <Route path="/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
            </Routes>
            </Suspense>
          </main>

          {/* Footer */}
          <footer className="bg-[#0B1224] text-slate-300 mt-auto">
            <div className="container mx-auto px-4 py-14">

              <div className="grid md:grid-cols-3 gap-10">

                {/* Branding */}
                <div>
                  <div className="flex items-center gap-2 text-white mb-3">
                    <CalendarDays className="h-7 w-7 text-amber-400" />
                    <span className="text-2xl font-extrabold tracking-tight">
                      Evently
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                    Organized around one simple idea <br></br> making event registration, sessions and feedback effortless for everyone.
                  </p>
                  <div className="flex gap-3 mt-5">
                    <a href="#" aria-label="Website" className="bg-slate-800 hover:bg-amber-500 hover:text-slate-900 p-2.5 rounded-full transition-colors">
                      <Globe size={16} />
                    </a>
                    <a href="#" aria-label="Social" className="bg-slate-800 hover:bg-amber-500 hover:text-slate-900 p-2.5 rounded-full transition-colors">
                      <Share2 size={16} />
                    </a>
                    <a href="mailto:samruddhi.chougule@evently.com" aria-label="Email" className="bg-slate-800 hover:bg-amber-500 hover:text-slate-900 p-2.5 rounded-full transition-colors">
                      <Mail size={16} />
                    </a>
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <h3 className="text-white font-bold mb-4 text-lg">Quick Links</h3>
                  <ul className="space-y-2.5 text-sm list-disc list-inside marker:text-slate-600">
                    <li><a href="/" className="underline underline-offset-2 hover:text-amber-400 transition-colors">Home</a></li>
                    <li><a href="/about" className="underline underline-offset-2 hover:text-amber-400 transition-colors">About</a></li>
                    <li><a href="/contact" className="underline underline-offset-2 hover:text-amber-400 transition-colors">Contact</a></li>
                    <li><a href="/my-events" className="underline underline-offset-2 hover:text-amber-400 transition-colors">My Events</a></li>
                  </ul>
                </div>

                {/* Location & Contact */}
                <div>
                  <h3 className="text-white font-bold mb-4 text-lg">Location & Contact</h3>
                  <ul className="space-y-3 text-sm text-slate-400">
                    <li className="flex items-start gap-2">
                      <MapPin size={16} className="text-amber-400 mt-0.5 shrink-0" />
                      <span>101 Evently Tower, Tech Park, City Center</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Phone size={16} className="text-amber-400 shrink-0" />
                      <a href="tel:+918766065795" className="hover:text-amber-400 transition-colors">+91 8766065795</a>
                    </li>
                    <li className="flex items-center gap-2">
                      <Mail size={16} className="text-amber-400 shrink-0" />
                      <span>samruddhi.chougule@evently.com</span>
                    </li>
                  </ul>
                </div>

              </div>

              {/* Bottom line */}
              <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                <p>© {new Date().getFullYear()} Evently. All rights reserved.</p>
                <p>Designed with ❤️ by Samruddhi</p>
              </div>

            </div>
          </footer>

          {/* Floating WhatsApp support widget — always available, on top of the footer */}
          <SupportWidget />

        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;