import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { authApi, parseApiError } from '../api/client';

export default function LoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authApi.login(email, password);
      login(result.access_token, result.user.email);
      navigate('/');
    } catch (err) {
      const apiError = parseApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-dark">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(73,79,223,0.4)]">
            <span className="text-white text-xl font-bold">R</span>
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-white mb-2">Admin Panel</h1>
          <p className="text-white/40 text-sm">Sign in to manage the fund system</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="admin@fund.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="Enter password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 font-semibold">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white hover:bg-primary-deep font-bold rounded-full py-3.5 text-sm transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-white/20 text-xs mt-8">
          Default: admin@fund.com / admin123
        </p>
      </div>
    </div>
  );
}
