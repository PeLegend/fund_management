import { Stock } from '../types/stock.types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StockPriceCardProps {
  stock: Stock;
}

export default function StockPriceCard({ stock }: StockPriceCardProps) {
  const priceChange = Number(stock.price_change);
  const priceChangePercent = Number(stock.price_change_percent);
  const isUp = priceChange > 0;
  const isDown = priceChange < 0;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
            {stock.stock_code}
          </span>
          <p className="text-sm text-white/60">{stock.name}</p>
        </div>
        <div className={`p-2 rounded-full ${isUp ? 'bg-green-500/10' : isDown ? 'bg-red-500/10' : 'bg-white/5'}`}>
          {isUp ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : isDown ? (
            <TrendingDown className="w-4 h-4 text-red-400" />
          ) : (
            <Minus className="w-4 h-4 text-white/40" />
          )}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-bold font-mono">
          ฿{stock.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-white/40'}`}>
            {isUp ? '+' : ''}{priceChange.toFixed(2)}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isUp ? 'bg-green-500/10 text-green-400' : isDown ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-white/40'
          }`}>
            {isUp ? '+' : ''}{priceChangePercent.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
