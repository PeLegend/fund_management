import { NavLink } from 'react-router-dom';
import { PieChart, Briefcase, ArrowLeftRight, Sparkles } from 'lucide-react';

const navItems = [
  { to: '/policies', label: 'Policies', icon: PieChart },
  { to: '/portfolios', label: 'Portfolios', icon: Briefcase },
  { to: '/orders', label: 'Orders', icon: ArrowLeftRight },
  { to: '/chatbot', label: 'AI', icon: Sparkles },
];

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-t border-white/10 lg:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-white/60 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
