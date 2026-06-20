import { Badge } from './ui/badge';
import { OrderStatus } from '../types/order.types';

const statusConfig: Record<OrderStatus, { label: string; variant: 'pending' | 'processing' | 'completed' | 'failed' }> = {
  PENDING: { label: 'Pending', variant: 'pending' },
  PROCESSING: { label: 'Processing', variant: 'processing' },
  COMPLETED: { label: 'Completed', variant: 'completed' },
  FAILED: { label: 'Failed', variant: 'failed' },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
