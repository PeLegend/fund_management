import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePolicies } from '../hooks/usePolicies';
import { useStockPrices } from '../hooks/useStockPrices';
import PolicyCard from '../components/PolicyCard';
import { X, Info, TrendingUp, TrendingDown } from 'lucide-react';

export default function PoliciesPage() {
  const { policies, loading, error } = usePolicies();
  const { stocks } = useStockPrices();
  const navigate = useNavigate();
  const [selectedPolicyCode, setSelectedPolicyCode] = useState<string | null>(null);

  // Helper to get stock price by code
  const getStockPrice = (stockCode: string) => {
    return stocks.find(s => s.stock_code === stockCode);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="space-y-8 animate-pulse">
          {/* Header skeleton */}
          <div className="space-y-3">
            <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
            <div className="h-4 w-96 bg-zinc-900/50 rounded-lg" />
          </div>
          {/* Grid skeleton */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2 h-64 bg-zinc-900 rounded-2xl" />
            <div className="h-64 bg-zinc-900 rounded-2xl" />
            <div className="h-48 bg-zinc-900 rounded-2xl" />
            <div className="h-48 bg-zinc-900 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-6">
          <h3 className="font-display font-semibold text-red-600 text-lg mb-1">Failed to load policies</h3>
          <p className="text-sm text-red-800">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  const selectedPolicy = policies.find(p => p.policy_code === selectedPolicyCode);

  return (
    <>
      <div className="mx-auto max-w-[1600px] px-6 lg:px-16 pt-16 pb-24 space-y-16 view-animate">
        {/* Clean Page Header matching mockup exactly */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 pb-8 border-b border-white/10">
          <div className="max-w-3xl">
            <span className="text-primary font-bold tracking-widest uppercase text-xs mb-3 block">
              Investment Catalog
            </span>
            <h2 className="display-section text-3xl sm:text-5xl md:text-7xl lg:text-8xl text-white leading-none">
              Strategic<br />Allocations.
            </h2>
          </div>
          <p className="text-white/60 text-lg max-w-md font-light leading-relaxed">
            เลือกนโยบายที่ถูกคัดสรรมาอย่างประณีต ระบบจะบริหารพอร์ตของคุณโดยอัตโนมัติตามสัดส่วนที่กำหนด
          </p>
        </div>

        {/* Balanced Grid */}
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {policies.map((policy, idx) => (
            <PolicyCard 
              key={policy.id} 
              policy={policy} 
              featured={idx === 0} 
              onClick={() => setSelectedPolicyCode(policy.policy_code)}
            />
          ))}
        </div>
      </div>

      {/* Slide-over Drawer Backdrop */}
      {selectedPolicy && (
        <div
          onClick={() => setSelectedPolicyCode(null)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md transition-opacity duration-500"
        />
      )}

      {/* Slide-over Detail Drawer (Dark Glass Panel) */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-lg glass-panel text-white transform transition-transform duration-700 ease-in-out flex flex-col border-l border-white/10 ${
        selectedPolicy ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {selectedPolicy && (
          <>
            {/* Drawer Header */}
            <div className="p-6 sm:p-8 md:p-10 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-3xl font-display font-semibold tracking-tight">{selectedPolicy.name}</h3>
              <button 
                onClick={() => setSelectedPolicyCode(null)} 
                className="text-white/50 hover:text-white transition-all duration-300 hover:rotate-90 bg-white/5 p-2 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 sm:p-8 md:p-10 flex-grow overflow-y-auto space-y-8">
              <div className="mb-6">
                <span className="px-4 py-2 bg-primary/20 text-primary-300 text-xs font-bold uppercase tracking-widest rounded-full border border-primary/30">
                  {selectedPolicy.policy_code}
                </span>
              </div>

              <h4 className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4 border-b border-white/10 pb-4">
                Allocation Blueprint
              </h4>

              <div className="space-y-6">
                {selectedPolicy.policy_stocks.map((ps) => {
                  const stockData = getStockPrice(ps.stock.stock_code);
                  const stockPriceChange = stockData ? Number(stockData.price_change) : 0;
                  const stockPriceChangePercent = stockData ? Number(stockData.price_change_percent) : 0;
                  const isUp = stockPriceChange > 0;
                  const isDown = stockPriceChange < 0;

                  return (
                    <div key={ps.id} className="flex justify-between items-center py-4 border-b border-white/10 last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm text-white/70">
                          {ps.stock.stock_code[0]}
                        </div>
                        <div>
                          <span className="font-bold text-lg text-white block">{ps.stock.stock_code}</span>
                          <span className="text-xs text-white/40 block">{ps.stock.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-xl text-primary-300">{Number(ps.weight)}%</span>
                        {stockData && (
                          <div className="mt-1">
                            <div className="font-mono text-sm font-semibold">
                              ฿{stockData.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div className={`text-xs font-semibold flex items-center justify-end gap-1 ${isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-white/40'}`}>
                              {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : null}
                              {isUp ? '+' : ''}{stockPriceChangePercent.toFixed(2)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fund Details */}
              <h4 className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4 border-b border-white/10 pb-4">
                Fund Details
              </h4>

              <div className="space-y-0 rounded-2xl border border-white/10 overflow-hidden">
                {[
                  { label: 'บลจ', value: 'Example Asset Management' },
                  { label: 'ประเภทกอง', value: 'Global Equity Fund' },
                  { label: 'ค่าความเสี่ยง', value: '6 - กองทุนรวมหุ้น' },
                  { label: 'นโยบายค่าเงิน', value: 'ป้องกันความเสี่ยงอัตราแลกเปลี่ยนตามดุลยพินิจ' },
                  { label: 'นโยบายการจ่ายปันผล', value: 'ไม่จ่ายปันผล' },
                  { label: 'ค่าธรรมเนียมขาย', value: '1.5%' },
                  { label: 'ค่าธรรมเนียมรับซื้อคืน', value: '0%' },
                  { label: 'ค่าธรรมเนียมการจัดการ', value: '1.25% ต่อปี' },
                  { label: 'ลงทุนครั้งแรกขั้นต่ำ', value: '1,000 บาท' },
                  { label: 'วันที่จดทะเบียนกองทุน', value: '15 ม.ค. 67' },
                  { label: 'มูลค่าทรัพย์สินสุทธิ', value: '500,000,000.00 บาท' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-start py-4 px-6 border-b border-white/5 last:border-0 bg-white/[0.02]">
                    <span className="text-sm text-white/40 flex-shrink-0 mr-4">{item.label}</span>
                    <span className="text-sm text-white/80 font-medium text-right">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Info Note Panel */}
              <div className="p-8 bg-black/40 rounded-[24px] border border-white/5 flex gap-4">
                <Info className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <p className="text-sm text-white/70 leading-relaxed font-light">
                  ระบบจะคำนวณและกระจายเงินลงทุนไปยังสินทรัพย์ด้านบนโดยอัตโนมัติ ตามสัดส่วนอัลกอริทึมที่ถูกกำหนดไว้ เพื่อรักษาสมดุลของพอร์ตโฟลิโอคุณ
                </p>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 sm:p-8 md:p-10 border-t border-white/10 bg-black/20">
              <button
                onClick={() => {
                  setSelectedPolicyCode(null);
                  navigate('/portfolios');
                }}
                className="w-full bg-white text-black hover:bg-zinc-200 font-bold rounded-full py-5 text-lg transition-transform active:scale-[0.98] duration-150 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                Deploy Strategy
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

