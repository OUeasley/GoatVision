import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import '../styles/LoginPage.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isPending && session) {
      navigate('/');
    }
  }, [session, isPending, navigate]);
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const { data, error: signInError } = await authClient.signIn.email({
        email,
        password,
      });
      
      if (signInError) {
        setError(signInError.message || 'Login failed. Please check credentials.');
        console.error('Login error:', signInError);
      } else if (data) {
        console.log('Login successful, user:', data.user);
      } else {
        setError('Login attempt returned an unexpected state.');
      }
    } catch (err: any) {
      setError('An unexpected error occurred during login.');
      console.error('Unexpected login error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isPending) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="login-container">
      <div className="login-card">
        <h1>GoatVision</h1>
        <h2>Monitoring Dashboard</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button" 
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="login-help">
          <p>Demo credentials: admin@admin.com / Admin123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 