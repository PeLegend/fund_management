import { OrderStatus } from '../types/admin.types';

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  PROCESSING: { label: 'Processing', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  COMPLETED: { label: 'Completed', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  FAILED: { label: 'Failed', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${config.className}`}>
      {config.label}
    </span>
  );
}
