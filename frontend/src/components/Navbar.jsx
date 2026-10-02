// This code is used for the Navbar component to render reusable UI parts.
import { useContext } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CalendarDays, LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Shared class function for nav links: highlights the active route in indigo with an underline
    const navLinkClass = ({ isActive }) =>
        `relative pb-1 transition-colors ${
            isActive
                ? 'text-indigo-600 font-semibold after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 after:bg-indigo-600 after:rounded-full'
                : 'text-slate-600 hover:text-indigo-600'
        }`;

    return (
        <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2 text-indigo-600">
                    <CalendarDays className="h-8 w-8" />
                    <span className="text-2xl font-bold tracking-tight">Evently</span>
                </Link>

                <nav className="hidden md:flex items-center gap-8 font-medium">
                    <NavLink to="/" end className={navLinkClass}>Home</NavLink>
                    <NavLink to="/about" className={navLinkClass}>About</NavLink>
                    <NavLink to="/contact" className={navLinkClass}>Contact</NavLink>
                    {user && (
                        <NavLink to="/my-events" className={navLinkClass}>My Events</NavLink>
                    )}
                    {user?.role === 'admin' && (
                        <NavLink
                            to="/admin"
                            className={({ isActive }) =>
                                `px-3 py-1.5 rounded-full transition-colors ${
                                    isActive
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                }`
                            }
                        >
                            Admin Dashboard
                        </NavLink>
                    )}
                    {user?.role === 'admin' && (
                        <NavLink to="/admin/checkin" className={navLinkClass}>QR Check-in</NavLink>
                    )}
                </nav>

                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                <UserIcon size={16} />
                                {user.name}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-4">
                            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium px-4 py-2">
                                Login
                            </Link>
                            <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-full transition-all shadow-md hover:shadow-lg">
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
