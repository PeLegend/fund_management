import { Policy } from '../types/policy.types';
import { ArrowRight } from 'lucide-react';

const ACCENT_COLORS = [
  'bg-revolut-teal',
  'bg-revolut-pink',
  'bg-revolut-light-blue',
  'bg-revolut-brown',
  'bg-revolut-light-green',
  'bg-revolut-warning',
  'bg-revolut-primary',
  'bg-revolut-yellow',
];

interface PolicyCardProps {
  policy: Policy;
  featured?: boolean;
  onClick?: () => void;
}

export default function PolicyCard({ policy, featured = false, onClick }: PolicyCardProps) {
  const cardClass = featured 
    ? 'glass-panel border-primary/40 bg-primary/5 text-white shadow-2xl hover:-translate-y-2' 
    : 'glass-panel border-white/5 bg-white/5 text-white hover:shadow-xl hover:-translate-y-1';

  return (
    <div
      onClick={onClick}
      className={`${cardClass} rounded-[32px] p-6 sm:p-8 md:p-10 flex flex-col h-full transition-all duration-500 cursor-pointer group`}
    >
      <div className="flex justify-between items-start mb-10">
        <div>
          <h3 className="text-3xl font-display font-semibold tracking-tight leading-tight mb-2 group-hover:text-primary transition-colors">
            {policy.policy_code}
          </h3>
          <p className={`text-sm font-medium ${featured ? 'text-white/60' : 'text-white/40'} tracking-widest uppercase`}>
            {policy.name}
          </p>
        </div>
        {featured && (
          <div className="bg-primary/20 text-primary-300 text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest border border-primary/30">
            Prime
          </div>
        )}
      </div>

      <div className="flex-grow mb-10">
        <div className="w-full h-[1px] bg-white/10 mb-6" />
        
        {/* Allocation Bar */}
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5 mb-6">
          {policy.policy_stocks.map((ps, idx) => {
            const colorClass = ACCENT_COLORS[idx % ACCENT_COLORS.length];
            return (
              <div
                key={ps.id}
                className={`${colorClass} h-full transition-all`}
                style={{ width: `${Number(ps.weight)}%` }}
                title={`${ps.stock?.stock_code || 'N/A'}: ${ps.weight}%`}
              />
            );
          })}
        </div>

        {/* Stock List Preview */}
        <div className="space-y-4">
          {policy.policy_stocks.map((ps, idx) => {
            const colorClass = ACCENT_COLORS[idx % ACCENT_COLORS.length];
            return (
              <div key={ps.id} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
                  <span className="font-mono text-sm font-semibold text-white">{ps.stock?.stock_code || 'N/A'}</span>
                  <span className="text-xs text-white/40 truncate max-w-[120px]">{ps.stock?.name || 'Stock'}</span>
                </div>
                <span className="font-mono text-sm font-bold text-primary">{Number(ps.weight)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between opacity-50 group-hover:opacity-100 transition-opacity">
        <span className="text-sm font-bold uppercase tracking-widest">Explore</span>
        <ArrowRight className="w-5 h-5" />
      </div>
    </div>
  );
}

