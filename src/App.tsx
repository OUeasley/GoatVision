import React, { createContext, ReactNode, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { authClient } from './lib/auth-client';

// Import pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import SignUpPage from './pages/SignUpPage';

// Define types for auth context
interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  user: User | null;
  loading: boolean;
}

// Create auth context with default values
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  logout: async () => {},
  user: null,
  loading: true
});

// Props for ProtectedRoute component
interface ProtectedRouteProps {
  children: ReactNode;
}

function App() {
  const { data: session, isPending, error, refetch } = authClient.useSession();

  const isAuthenticated = !!session && !isPending && !error;
  const user: User | null = useMemo(() => {
    if (session?.user) {
      return {
        id: session.user.id,
        username: session.user.name || session.user.email || 'Unknown User'
      };
    }
    return null;
  }, [session]);

  const logout = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    if (isPending) {
      return <div>Loading...</div>;
    }
    if (error || !session) {
      return <Navigate to="/login" />;
    }
    return <>{children}</>;
  };

  const authContextValue = useMemo(() => ({
    isAuthenticated,
    logout,
    user,
    loading: isPending
  }), [isAuthenticated, user, isPending, logout]);

  return (
    <AuthContext.Provider value={authContextValue}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App; 