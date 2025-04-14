import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import '../styles/LoginPage.css'; // Reuse login page styles for now

const SignUpPage: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  // Redirect if already authenticated
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
      const { data, error: signUpError } = await authClient.signUp.email(
        {
          name,
          email,
          password,
        },
        {
          // Optional callbacks
          onRequest: (ctx) => {
            console.log('Sign up request started...');
          },
          onSuccess: (ctx) => {
            console.log('Sign up successful, user:', ctx.data?.user);
            // By default, Better Auth signs the user in after sign up.
            // The useSession hook in App.tsx should detect the new session and handle redirection.
            // navigate('/'); // Might not be needed if useSession handles redirect
          },
          onError: (ctx) => {
            console.error('Sign up error details:', ctx.error);
            setError(ctx.error.message || 'Sign up failed. Please try again.');
          },
        }
      );

      // Fallback error handling if onError callback doesn't fire or isn't sufficient
      if (signUpError && !error) {
          setError(signUpError.message || 'Sign up failed. Please try again.');
      }

    } catch (err: any) {
      // Catch unexpected errors during the async operation itself
      setError('An unexpected error occurred during sign up.');
      console.error('Unexpected sign up error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent rendering form while checking session
  if (isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div className="login-container"> {/* Reusing login styles */} 
      <div className="login-card">
        <h1>Create Account</h1>
        <h2>GoatVision Monitoring</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
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
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="login-button" // Reusing login button style
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="login-help"> {/* Reusing login help style */} 
          <p>Already have an account? <Link to="/login">Log In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage; 