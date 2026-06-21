import { Holding } from '../types/portfolio.types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ProfitLossTableProps {
  holdings: Holding[];
}

export default function ProfitLossTable({ holdings }: ProfitLossTableProps) {
  if (holdings.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5">
        <p className="text-white/30 text-center text-sm">No holdings yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Stock</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Units</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Buy Price</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Current</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Invested</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Value</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest">P/L</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => {
              const isProfit = holding.gain_amount >= 0;
              return (
                <tr key={holding.stock_code} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-semibold text-white">{holding.stock_code}</span>
                      <span className="text-white/30 ml-2 text-xs">{holding.stock_name}</span>
                    </div>
                  </td>
                  <td className="text-right px-4 py-3 font-mono text-white/70">
                    {holding.units.toFixed(2)}
                  </td>
                  <td className="text-right px-4 py-3 font-mono text-white/70">
                    ฿{holding.purchase_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-right px-4 py-3 font-mono text-white/70">
                    ฿{holding.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-right px-4 py-3 font-mono text-white/70">
                    ฿{holding.invested_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-right px-4 py-3 font-mono font-semibold text-white">
                    ฿{holding.current_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-right px-4 py-3">
                    <div className={`flex items-center justify-end gap-1 ${isProfit ? 'text-revolut-teal' : 'text-revolut-danger'}`}>
                      {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <div className="text-right">
                        <div className="font-mono font-semibold text-xs">
                          {isProfit ? '+' : ''}฿{holding.gain_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-white/40">
                          ({isProfit ? '+' : ''}{holding.gain_percent.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-white/[0.04]">
        {holdings.map((holding) => {
          const isProfit = holding.gain_amount >= 0;
          return (
            <div key={holding.stock_code} className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white">{holding.stock_code}</span>
                  <span className="text-white/30 ml-2 text-xs">{holding.stock_name}</span>
                </div>
                <div className={`flex items-center gap-1 ${isProfit ? 'text-revolut-teal' : 'text-revolut-danger'}`}>
                  {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span className="font-mono font-semibold text-xs">
                    {isProfit ? '+' : ''}{holding.gain_percent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Value Row */}
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Value</p>
                  <p className="font-mono font-semibold text-white">
                    ฿{holding.current_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">P/L</p>
                  <p className={`font-mono font-semibold text-xs ${isProfit ? 'text-revolut-teal' : 'text-revolut-danger'}`}>
                    {isProfit ? '+' : ''}฿{holding.gain_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.04]">
                <div>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Units</p>
                  <p className="font-mono text-xs text-white/60">{holding.units.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Buy</p>
                  <p className="font-mono text-xs text-white/60">฿{holding.purchase_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Current</p>
                  <p className="font-mono text-xs text-white/60">฿{holding.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
