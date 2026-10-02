// This code is used for the ProtectedRoute component - a guard that wraps pages which need a login (or admin role).
// The backend already blocks the API calls; this stops the PAGE itself from even opening for the wrong person.
import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user } = useContext(AuthContext);
    const location = useLocation();

    // Not logged in -> go to login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Logged in but not an admin -> back to home
    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
