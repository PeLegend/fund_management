import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { LayoutDashboard, Users, TrendingUp, FileText, Briefcase, ShoppingCart, LogOut } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/stocks', label: 'Stocks', icon: TrendingUp },
  { to: '/policies', label: 'Policies', icon: FileText },
  { to: '/portfolios', label: 'Portfolios', icon: Briefcase },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
];

export default function AdminLayout() {
  const { adminEmail, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-canvas-dark text-white">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-surface-deep border-r border-white/10 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white text-sm font-bold">R</span>
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight block">Fund Management</span>
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Admin Panel</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/20 text-primary-300 border border-primary/30'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40 font-mono truncate">{adminEmail}</span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
