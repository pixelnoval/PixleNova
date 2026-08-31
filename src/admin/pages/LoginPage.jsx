import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="a-login-screen">
      <div className="a-login-card">
        <div className="a-login-brand">
          <span className="a-brand">PIXLENOVA</span>
          <span className="a-brand-sub">Admin Portal</span>
        </div>

        <form className="a-login-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="a-alert a-alert--error" role="alert">
              {error}
            </div>
          )}

          <div className="a-field">
            <label htmlFor="login-email" className="a-label">Email</label>
            <input
              id="login-email"
              className="a-input"
              type="email"
              autoComplete="email"
              required
              placeholder="admin@pixlenova.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="a-field">
            <label htmlFor="login-password" className="a-label">Password</label>
            <input
              id="login-password"
              className="a-input"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            className="a-btn a-btn--primary a-btn--full"
            type="submit"
            disabled={loading || !email || !password}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="a-login-footer">
          PixleNova Admin — access restricted
        </p>
      </div>
    </div>
  );
}
