import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { customersApi, parseApiError } from '../api/client';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a customer code');
      return;
    }

    if (isRegistering) {
      const cleanName = name.trim();
      if (!cleanName) {
        setError('Please enter your name');
        return;
      }

      setIsLoading(true);
      try {
        const customer = await customersApi.register(cleanCode, cleanName);
        login(customer.customer_code, customer.name);
        navigate('/');
      } catch (err) {
        const apiError = parseApiError(err);
        if (apiError.statusCode === 409) {
          setError('Customer code is already registered. Please choose another code.');
        } else {
          setError(apiError.message || 'An error occurred during registration.');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      try {
        const customer = await customersApi.getByCode(cleanCode);
        login(customer.customer_code, customer.name);
        navigate('/');
      } catch (err) {
        const apiError = parseApiError(err);
        if (apiError.statusCode === 404) {
          setError('Customer code not found in database. Please register first.');
        } else {
          setError(apiError.message || 'An error occurred during sign in.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-black font-sans antialiased text-white relative">
      {/* Global Noise Overlay */}
      <div className="noise-overlay" />

      {/* Left side: Premium brand display */}
      <div className="hidden lg:flex lg:flex-col justify-between p-16 relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-900" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />

        {/* Top brand */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shadow-[0_0_15px_rgba(73,79,223,0.5)]">
            <span className="text-white text-sm font-bold">R</span>
          </div>
          <span className="font-display font-bold tracking-tight text-xl text-white select-none">
            Fund Management
          </span>
        </div>

        {/* Display Typography Hero Title */}
        <div className="space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl lg:text-7xl font-display font-semibold tracking-tight leading-[1.0] text-white">
            Fund<br />
            <span className="text-zinc-500">Manager</span>
          </h2>
          <p className="text-lg text-zinc-400 font-light leading-relaxed max-w-md">
            Curated investment policies. Real-time portfolio auto-allocations. Deploy your capital with institutional precision.
          </p>
        </div>

        {/* Trust markers */}
        <div className="flex gap-10 relative z-10">
          <div>
            <p className="text-2xl font-bold tracking-tight font-display text-white">0.00%</p>
            <p className="text-xs text-zinc-500 font-medium mt-1">Hidden Fees</p>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight font-display text-white">100%</p>
            <p className="text-xs text-zinc-500 font-medium mt-1">Auto Allocation</p>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight font-display text-white">Secured</p>
            <p className="text-xs text-zinc-500 font-medium mt-1">Fintech Core</p>
          </div>
        </div>
      </div>

      {/* Right side: Login form container */}
      <div className="flex flex-col justify-center px-6 py-12 md:px-16 bg-zinc-950 lg:border-l lg:border-zinc-900 relative z-10">
        <div className="w-full max-w-md mx-auto space-y-8">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shadow-[0_0_15px_rgba(73,79,223,0.5)]">
              <span className="text-white text-sm font-bold">R</span>
            </div>
            <span className="font-display font-bold tracking-tight text-white select-none">
              Fund Management
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-3xl font-semibold tracking-tight text-white">
              {isRegistering ? 'Register' : 'Sign In'}
            </h3>
            <p className="text-sm text-zinc-400">
              {isRegistering
                ? 'Create a new Customer Code and Name to get started'
                : 'Enter your Customer Code to access your portfolios'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="customer_code" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Customer Code
              </Label>
              <Input
                id="customer_code"
                placeholder="e.g. C001"
                value={code}
                disabled={isLoading}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                className="h-12 bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-all text-base rounded-lg"
              />
            </div>

            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="customer_name" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Full Name
                </Label>
                <Input
                  id="customer_name"
                  placeholder="e.g. Somchai Jaidee"
                  value={name}
                  disabled={isLoading}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  className="h-12 bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-all text-base rounded-lg"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="w-full h-12 font-semibold text-black rounded-lg transition-transform hover:bg-zinc-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  {isRegistering ? 'Registering...' : 'Signing In...'}
                </>
              ) : (
                isRegistering ? 'Register' : 'Continue'
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-zinc-400 mt-4">
            {isRegistering ? (
              <p>
                Already have a Customer Code?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setError(null);
                  }}
                  className="text-primary hover:underline font-semibold focus:outline-none"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                Don't have a Customer Code?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setError(null);
                  }}
                  className="text-primary hover:underline font-semibold focus:outline-none"
                >
                  Register here
                </button>
              </p>
            )}
          </div>

          {!isRegistering && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Demo Access Codes</p>
              <div className="flex gap-2">
                <span
                  onClick={() => setCode('C001')}
                  className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white transition-colors"
                >
                  C001
                </span>
                <span
                  onClick={() => setCode('C002')}
                  className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white transition-colors"
                >
                  C002
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Use code C001 (Somchai) or C002 (Somying) to experience automated order processing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

