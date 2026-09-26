import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-orange-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-800 border-t-transparent"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (requiredRole === 'superadmin' && user.role !== 'superadmin') {
        return <Navigate to="/" replace />;
    }

    if (requiredRole === 'admin' && user.role !== 'admin' && user.role !== 'superadmin') {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
