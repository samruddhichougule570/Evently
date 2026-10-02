// This code is used for the Register page to display specific views to the user.
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Check, Circle, Loader2 } from 'lucide-react';
import { PASSWORD_RULES, isPasswordValid, getNameError, getEmailError } from '../utils/validators';

const inputClass = (hasError) =>
    `w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 ${
        hasError
            ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
            : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'
    }`;

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [touched, setTouched] = useState({}); // which fields the user has already left (errors only show after that)
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const errors = {
        name: getNameError(name),
        email: getEmailError(email),
        password: isPasswordValid(password) ? '' : 'Password does not meet all the rules below',
        confirm: confirm === password ? '' : 'Passwords do not match'
    };
    const touch = (field) => setTouched((t) => ({ ...t, [field]: true }));
    const showError = (field) => touched[field] && errors[field];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Reveal every error at once if the form is not valid
        if (errors.name || errors.email || errors.password || errors.confirm) {
            setTouched({ name: true, email: true, password: true, confirm: true });
            return;
        }

        setSubmitting(true);
        try {
            await register(name.trim(), email.trim(), password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to register');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
            <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">Create an Account</h2>
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => touch('name')}
                        className={inputClass(showError('name'))}
                        autoComplete="name"
                    />
                    {showError('name') && <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => touch('email')}
                        className={inputClass(showError('email'))}
                        placeholder="you@example.com"
                        autoComplete="email"
                    />
                    {showError('email') && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={() => touch('password')}
                            className={`${inputClass(showError('password'))} pr-12`}
                            autoComplete="new-password"
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

                    {/* Live checklist: each rule turns green as soon as it is satisfied */}
                    <ul className="mt-3 space-y-1">
                        {PASSWORD_RULES.map((rule) => {
                            const passed = rule.test(password);
                            return (
                                <li key={rule.id} className={`flex items-center gap-2 text-xs ${passed ? 'text-green-600' : 'text-slate-400'}`}>
                                    {passed ? <Check size={14} /> : <Circle size={10} className="ml-0.5 mr-0.5" />}
                                    {rule.label}
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        onBlur={() => touch('confirm')}
                        className={inputClass(showError('confirm'))}
                        autoComplete="new-password"
                    />
                    {showError('confirm') && <p className="text-red-500 text-xs mt-1.5">{errors.confirm}</p>}
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                    {submitting ? <><Loader2 size={18} className="animate-spin" /> Creating account...</> : 'Register'}
                </button>
            </form>
            <p className="mt-8 text-center text-slate-500 text-sm">
                Already have an account? <Link to="/login" className="text-indigo-600 hover:underline font-medium">Log In</Link>
            </p>
        </div>
    );
};

export default Register;
