import { Portfolio } from '../types/portfolio.types';

export interface StockHolding {
  stockCode: string;
  stockName: string;
  weight: number;
  invested: number;
  currentValue: number;
  gainAmount: number;
  gainPercent: number;
  colorClass: string;
}

export interface PortfolioPerformance {
  totalInvested: number;
  currentValue: number;
  gainAmount: number;
  gainPercent: number;
  holdings: StockHolding[];
  pendingAmount: number;
}

// Yield rates mapped by policy code
const POLICY_YIELD_RATES: Record<string, number> = {
  KMASTER: 0.1482, // +14.82% yield (Thai Equities)
  TMBUSB: 0.0245,  // +2.45% yield (Fixed Income)
  SCBDV: 0.0860,   // +8.60% yield (Dividends)
};

// Stock-specific yields under policies for realism
const STOCK_YIELD_MAP: Record<string, Record<string, number>> = {
  KMASTER: {
    PTT: 0.155,
    SCB: 0.220,
    CPALL: 0.080,
  },
  TMBUSB: {
    KBANK: 0.021,
    BBL: 0.030,
    ADVANC: 0.018,
  },
  SCBDV: {
    TRUE: 0.112,
    DTAC: 0.045,
    PTT: 0.090,
  },
};

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

export function calculatePortfolioPerformance(portfolio: Portfolio): PortfolioPerformance {
  const orders = portfolio.orders || [];

  // Calculate completed investments
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const totalInvested = completedOrders.reduce((sum, o) => sum + Number(o.amount), 0);

  // Calculate pending investments
  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING');
  const pendingAmount = pendingOrders.reduce((sum, o) => sum + Number(o.amount), 0);

  const policyCode = portfolio.policy.policy_code;
  const policyYield = POLICY_YIELD_RATES[policyCode] ?? 0.0530; // default 5.3%

  const currentValue = totalInvested * (1 + policyYield);
  const gainAmount = currentValue - totalInvested;
  const gainPercent = totalInvested > 0 ? (gainAmount / totalInvested) * 100 : 0;

  // Holdings positions breakdown
  const holdings: StockHolding[] = portfolio.policy.policy_stocks.map((ps, idx) => {
    const stockCode = ps.stock.stock_code;
    const stockName = ps.stock.name;
    const weight = Number(ps.weight);
    const stockWeightFraction = weight / 100;

    const stockInvested = totalInvested * stockWeightFraction;

    // Find stock specific yield or fallback to policy yield
    const stockYield = STOCK_YIELD_MAP[policyCode]?.[stockCode] ?? policyYield;
    const stockValue = stockInvested * (1 + stockYield);
    const stockGainAmount = stockValue - stockInvested;
    const stockGainPercent = stockYield * 100;

    return {
      stockCode,
      stockName,
      weight,
      invested: stockInvested,
      currentValue: stockValue,
      gainAmount: stockGainAmount,
      gainPercent: stockGainPercent,
      colorClass: ACCENT_COLORS[idx % ACCENT_COLORS.length],
    };
  });

  return {
    totalInvested,
    currentValue,
    gainAmount,
    gainPercent,
    holdings,
    pendingAmount,
  };
}


export function generatePerformanceHistory(
  portfolio: Portfolio,
  interval: '1W' | '1M' | '1Y',
  pointsCount = 12
): number[] {
  const orders = portfolio.orders || [];
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  
  if (completedOrders.length === 0) {
    return Array(pointsCount).fill(0);
  }
  
  // Sort completed orders by created_at (ascending) to identify the first/earliest order
  const sortedOrders = [...completedOrders].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  const now = Date.now();
  
  // Define the time window for the interval
  let durationMs = 30 * 24 * 60 * 60 * 1000; // default 1M (30 days)
  if (interval === '1W') {
    durationMs = 7 * 24 * 60 * 60 * 1000;
  } else if (interval === '1Y') {
    durationMs = 365 * 24 * 60 * 60 * 1000;
  }
  
  const startTime = now - durationMs;
  const policyCode = portfolio.policy.policy_code;
  const policyYield = POLICY_YIELD_RATES[policyCode] ?? 0.0530;
  
  const points: number[] = [];
  
  for (let i = 0; i < pointsCount; i++) {
    // Calculate timestamp for this point
    const t = startTime + (durationMs * i) / (pointsCount - 1);
    
    // Filter completed orders completed at or before t
    const activeOrders = sortedOrders.filter(o => new Date(o.created_at).getTime() <= t);
    
    if (activeOrders.length === 0) {
      points.push(0);
      continue;
    }
    
    // The first order in the entire portfolio
    const firstOrder = sortedOrders[0];
    const firstOrderCreatedAt = new Date(firstOrder.created_at).getTime();
    
    let totalValAtT = 0;
    
    // Sum values of active orders at time t
    activeOrders.forEach(o => {
      const amount = Number(o.amount);
      if (o.id === firstOrder.id) {
        // First order grows linearly from its completion time to today (now)
        const timeDiffTotal = now - firstOrderCreatedAt;
        const timeDiffAtT = t - firstOrderCreatedAt;
        const growthFactor = timeDiffTotal > 0 ? Math.min(1, Math.max(0, timeDiffAtT / timeDiffTotal)) : 1;
        
        totalValAtT += amount * (1 + policyYield * growthFactor);
      } else {
        // Subsequent orders have 0% yield
        totalValAtT += amount;
      }
    });
    
    points.push(totalValAtT);
  }
  
  return points;
}
