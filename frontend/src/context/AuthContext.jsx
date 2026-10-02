// This code is used for the AuthContext context provider to manage global state.
// The JWT now lives in an HTTP-only cookie set by the server, so JavaScript (and any injected script) can never read it.
// localStorage only keeps the harmless profile (name/email/role) so the UI can render instantly on reload.
import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Make every axios call send the auth cookie to the API
axios.defaults.withCredentials = true;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On first load: show the saved profile, then ask the server if the cookie session is still valid
    useEffect(() => {
        const restoreSession = async () => {
            const saved = localStorage.getItem('userInfo');
            if (saved) {
                setUser(JSON.parse(saved));
                try {
                    const { data } = await axios.get(`${API_URL}/api/auth/me`);
                    setUser(data);
                    localStorage.setItem('userInfo', JSON.stringify(data));
                } catch (err) {
                    // Only log out when the server says the session is invalid (not when the server is simply offline)
                    if (err.response && err.response.status === 401) {
                        setUser(null);
                        localStorage.removeItem('userInfo');
                    }
                }
            }
            setLoading(false);
        };
        restoreSession();
    }, []);

    const login = async (email, password) => {
        const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, password });
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
        return data; // to be used for redirecting
    };

    const register = async (name, email, password) => {
        const { data } = await axios.post(`${API_URL}/api/auth/register`, { name, email, password });
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
        return data;
    };

    // Logout must hit the server too, because only the server can clear an HTTP-only cookie
    const logout = async () => {
        try {
            await axios.post(`${API_URL}/api/auth/logout`);
        } catch {
            // even if the request fails, clear the local state
        }
        setUser(null);
        localStorage.removeItem('userInfo');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
