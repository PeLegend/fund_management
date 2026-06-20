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
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onCancel: (orderCode: string) => void;
}

const statusIcons = {
  PENDING: Clock,
  PROCESSING: Loader2,
  COMPLETED: CheckCircle,
  FAILED: XCircle,
};

export default function OrderCard({ order, onCancel }: OrderCardProps) {
  const StatusIcon = statusIcons[order.status];

  return (
    <div className="group bg-white rounded-xl p-5 transition-all duration-200 hover:bg-zinc-50/80">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Status Icon */}
          <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            order.status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
            order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-600' :
            order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
            'bg-red-100 text-red-600'
          }`}>
            <StatusIcon className={`h-4 w-4 ${order.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
          </div>

          {/* Order Info */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-zinc-900">{order.order_code}</span>
              <StatusBadge status={order.status} />
            </div>

            {/* Stock breakdown */}
            {order.order_stocks && order.order_stocks.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {order.order_stocks.map((os) => (
                  <span
                    key={os.id}
                    className="inline-flex items-center text-[10px] font-mono font-semibold text-zinc-500 bg-zinc-100 rounded px-2 py-0.5"
                  >
                    {os.stock.stock_code}
                    <span className="text-zinc-400 mx-1">&middot;</span>
                    {Number(os.allocated_amount).toLocaleString()} ฿
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-zinc-400 font-medium">
              {new Date(order.created_at).toLocaleString('th-TH')}
            </p>
          </div>
        </div>

        {/* Amount & Actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="font-mono text-lg font-bold text-zinc-900">
            ฿{Number(order.amount).toLocaleString()}
          </span>

          {order.status === 'PENDING' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                >
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-xl border-zinc-200">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display text-xl font-bold text-zinc-900">
                    Cancel Order
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-500">
                    Are you sure you want to cancel order <span className="font-mono font-bold text-zinc-900">{order.order_code}</span>? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="rounded-lg border-zinc-200 text-zinc-900 hover:bg-zinc-50">
                    Keep Order
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onCancel(order.order_code)}
                    className="rounded-lg bg-red-600 text-white hover:bg-red-700 border border-transparent font-semibold"
                  >
                    Cancel Order
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}
