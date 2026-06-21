import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import MobileNav from './MobileNav';
import { LogOut } from 'lucide-react';
import { useEffect } from 'react';

const navItems = [
  { to: '/policies', label: 'Policies' },
  { to: '/portfolios', label: 'Portfolios' },
  { to: '/orders', label: 'Orders' },
  { to: '/chatbot', label: 'AI Advisor' },
];

export default function Layout() {
  const { customerCode, customerName, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Lock the body always to the dark theme variables
    document.body.classList.remove('bg-canvas-light', 'text-zinc-900');
    document.body.classList.add('bg-canvas-dark', 'text-white');
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-700 ease-in-out">
      {/* Global Noise Overlay */}
      <div className="noise-overlay" />

      {/* Global Header wrapper */}
      <header className="fixed top-0 left-0 w-full z-40 bg-black/50 border-b border-white/5 text-white backdrop-blur-xl transition-all duration-500">
        <nav className="h-20 flex items-center justify-between px-6 lg:px-16">
          <div className="flex items-center gap-12">
            {/* Logo brand mark */}
            <button 
              onClick={() => navigate('/')} 
              className="font-bold text-2xl tracking-tighter flex items-center gap-3 hover:opacity-75 transition-opacity"
            >
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shadow-[0_0_15px_rgba(73,79,223,0.5)]">
                <span className="text-white text-sm font-bold">R</span>
              </div>
              <span>Fund Management</span>
            </button>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-4 text-sm font-semibold tracking-wide">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `transition-all duration-300 font-semibold px-4 py-1.5 rounded-full ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-6">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase hidden sm:block text-white/60">
              {customerCode ? `${customerCode} ${customerName ? `• ${customerName}` : ''}` : ''}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="rounded-full h-10 w-10 transition-colors text-white/60 hover:text-white hover:bg-white/5"
            >
              <LogOut className="h-4.5 w-4.5" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Main Outlet Container (Pad navbar top + bottom for mobile nav) */}
      <main className="flex-1 flex flex-col pt-20 pb-20 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />
    </div>
  );
}

