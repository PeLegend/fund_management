import { Order } from '../types/order.types';
import StatusBadge from './StatusBadge';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface OrderTableProps {
  orders: Order[];
  onCancel: (orderCode: string) => void;
}

export default function OrderTable({ orders, onCancel }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 text-center max-w-md mx-auto text-white">
        <p className="font-semibold text-sm">No orders yet</p>
        <p className="text-xs text-white/40 mt-1">Execute a trade to see your transactions here.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden text-white">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.03] text-white">
              <th className="px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Reference & Allocation</th>
              <th className="px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Capital</th>
              <th className="px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Status</th>
              <th className="px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Created</th>
              <th className="px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-white/[0.03] transition-colors">
                <td className="px-5 py-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${
                        order.order_type === 'SELL' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {order.order_type === 'SELL' ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                      </span>
                      <span className="font-mono text-sm font-bold text-white">{order.order_code}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        order.order_type === 'SELL'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {order.order_type}
                      </span>
                    </div>
                    {order.order_stocks && order.order_stocks.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {order.order_stocks.map((os) => (
                          <span
                            key={os.id}
                            className="inline-flex items-center text-[9px] font-mono font-bold text-white/50 bg-white/[0.04] border border-white/[0.06] rounded px-2 py-0.5"
                          >
                            {os.stock?.stock_code}
                            <span className="text-white/20 mx-1">·</span>
                            {Number(os.allocated_amount).toLocaleString()} ฿
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 font-mono font-bold text-white text-sm">
                  ฿{Number(order.amount).toLocaleString()}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-5 py-4 text-[11px] font-mono text-white/40">
                  {new Date(order.created_at).toLocaleString('th-TH')}
                </td>
                <td className="px-5 py-4 text-right">
                  {order.status === 'PENDING' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 px-4 text-[10px] font-bold rounded-full bg-red-500/80 text-white hover:bg-red-600 active:scale-[0.98] transition-transform"
                        >
                          Terminate
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl border-white/10 glass-panel text-white max-w-sm mx-4">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-display text-lg font-bold text-white">
                            Cancel Order
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-white/60 text-sm">
                            Cancel order <span className="font-mono font-bold text-white">{order.order_code}</span>? This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                          <AlertDialogCancel className="rounded-full border-white/10 text-white hover:bg-white/5 bg-transparent text-sm">
                            Keep Order
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onCancel(order.order_code)}
                            className="rounded-full bg-red-500 text-white hover:bg-red-600 border border-transparent font-semibold text-sm"
                          >
                            Cancel Order
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden divide-y divide-white/[0.04]">
        {orders.map((order) => (
          <div key={order.id} className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${
                  order.order_type === 'SELL' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {order.order_type === 'SELL' ? (
                    <ArrowDownRight className="w-3 h-3" />
                  ) : (
                    <ArrowUpRight className="w-3 h-3" />
                  )}
                </span>
                <span className="font-mono text-sm font-bold text-white">{order.order_code}</span>
              </div>
              <StatusBadge status={order.status} />
            </div>

            {/* Amount and Type */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  order.order_type === 'SELL'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {order.order_type}
                </span>
                <span className="font-mono font-bold text-white">
                  ฿{Number(order.amount).toLocaleString()}
                </span>
              </div>
              {order.status === 'PENDING' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 px-3 text-[10px] font-bold rounded-full bg-red-500/80 text-white hover:bg-red-600 active:scale-[0.98] transition-transform"
                    >
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl border-white/10 glass-panel text-white max-w-sm mx-4">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-display text-lg font-bold text-white">
                        Cancel Order
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-white/60 text-sm">
                        Cancel order <span className="font-mono font-bold text-white">{order.order_code}</span>? This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel className="rounded-full border-white/10 text-white hover:bg-white/5 bg-transparent text-sm">
                        Keep Order
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onCancel(order.order_code)}
                        className="rounded-full bg-red-500 text-white hover:bg-red-600 border border-transparent font-semibold text-sm"
                      >
                        Cancel Order
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* Allocation Badges */}
            {order.order_stocks && order.order_stocks.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {order.order_stocks.map((os) => (
                  <span
                    key={os.id}
                    className="inline-flex items-center text-[9px] font-mono font-bold text-white/50 bg-white/[0.04] border border-white/[0.06] rounded px-2 py-0.5"
                  >
                    {os.stock?.stock_code}
                    <span className="text-white/20 mx-1">·</span>
                    {Number(os.allocated_amount).toLocaleString()} ฿
                  </span>
                ))}
              </div>
            )}

            {/* Timestamp */}
            <p className="text-[10px] font-mono text-white/30">
              {new Date(order.created_at).toLocaleString('th-TH')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}


