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

interface OrderTableProps {
  orders: Order[];
  onCancel: (orderCode: string) => void;
}

export default function OrderTable({ orders, onCancel }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-white/5 p-12 text-center max-w-md mx-auto text-white">
        <p className="font-semibold">No orders yet</p>
        <p className="text-xs text-white/50 mt-1">Deploy capital to see your transactions listed here.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl animate-in fade-in duration-300 text-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-white text-sm font-semibold tracking-wide uppercase">
              <th className="p-8">Reference ID & Allocation</th>
              <th className="p-8">Capital (THB)</th>
              <th className="p-8">Status</th>
              <th className="p-8">Created</th>
              <th className="p-8 text-right">Operation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-white/5 transition-colors">
                <td className="p-8">
                  <div className="space-y-3">
                    <span className="font-mono text-base font-bold text-white block">{order.order_code}</span>
                    {/* Visual Allocation Badges */}
                    {order.order_stocks && order.order_stocks.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {order.order_stocks.map((os) => (
                          <span
                            key={os.id}
                            className="inline-flex items-center text-[10px] font-mono font-bold text-white/60 bg-white/5 border border-white/10 rounded px-2.5 py-1"
                            title={`${os.stock?.name || 'Stock'} (${Number(os.weight)}%)`}
                          >
                            {os.stock?.stock_code || 'N/A'}
                            <span className="text-white/30 mx-1.5">·</span>
                            {Number(os.allocated_amount).toLocaleString()} ฿
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-8 font-mono font-bold text-white text-lg">
                  ฿{Number(order.amount).toLocaleString()}
                </td>
                <td className="p-8">
                  <StatusBadge status={order.status} />
                </td>
                <td className="p-8 text-xs font-mono text-white/40 font-semibold">
                  {new Date(order.created_at).toLocaleString('th-TH')}
                </td>
                <td className="p-8 text-right">
                  {order.status === 'PENDING' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-10 px-5 text-xs font-bold rounded-full bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition-transform"
                        >
                          Terminate
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-[24px] border-white/10 glass-panel text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-display text-xl font-bold text-white">
                            Cancel Order
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-white/60">
                            Are you sure you want to cancel order <span className="font-mono font-bold text-white">{order.order_code}</span>? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                          <AlertDialogCancel className="rounded-full border-white/10 text-white hover:bg-white/5 bg-transparent">
                            Keep Order
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onCancel(order.order_code)}
                            className="rounded-full bg-red-500 text-white hover:bg-red-600 border border-transparent font-semibold"
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
    </div>
  );
}


