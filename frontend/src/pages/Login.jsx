// This code is used for the Login page to display specific views to the user.
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { getEmailError } from '../utils/validators';

// The demo-credentials shortcut is only compiled into DEVELOPMENT builds (npm run dev).
// In a production build (npm run build) import.meta.env.DEV is false, so the button - and the admin login it
// reveals - simply doesn't exist for visitors.
const SHOW_DEMO_LOGIN = import.meta.env.DEV;
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || 'password123';

const inputClass = (hasError) =>
    `w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 ${
        hasError
            ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
            : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'
    }`;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname; // page the ProtectedRoute bounced them from

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Check the format before bothering the server
        const errors = {
            email: getEmailError(email),
            password: password ? '' : 'Please enter your password'
        };
        setFieldErrors(errors);
        if (errors.email || errors.password) return;

        setSubmitting(true);
        try {
            const data = await login(email.trim(), password);
            if (from) {
                navigate(from, { replace: true });
            } else if (data.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
            <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">Welcome Back</h2>
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setFieldErrors((f) => ({ ...f, email: email ? getEmailError(email) : '' }))}
                        className={inputClass(fieldErrors.email)}
                        placeholder="you@example.com"
                        autoComplete="email"
                    />
                    {fieldErrors.email && <p className="text-red-500 text-xs mt-1.5">{fieldErrors.email}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`${inputClass(fieldErrors.password)} pr-12`}
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {fieldErrors.password && <p className="text-red-500 text-xs mt-1.5">{fieldErrors.password}</p>}
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                    {submitting ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign In'}
                </button>
            </form>
            <p className="mt-8 text-center text-slate-500 text-sm">
                Don't have an account? <Link to="/register" className="text-indigo-600 hover:underline font-medium">Register</Link>
            </p>

            {SHOW_DEMO_LOGIN && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="text-center text-xs text-slate-500 mb-3">Demo accounts (development build only)</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => { setEmail('admin@example.com'); setPassword(DEMO_PASSWORD); setFieldErrors({}); }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-xl transition-colors text-sm border border-slate-200"
                        >
                            Fill Admin
                        </button>
                        <button
                            type="button"
                            onClick={() => { setEmail('demo@example.com'); setPassword(DEMO_PASSWORD); setFieldErrors({}); }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-xl transition-colors text-sm border border-slate-200"
                        >
                            Fill Attendee
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
