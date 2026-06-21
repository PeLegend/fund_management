import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-white/5 text-white/70 border-white/10',
        pending: 'bg-revolut-warning/10 text-revolut-warning border-revolut-warning/20',
        processing: 'bg-revolut-primary/20 text-white border-revolut-primary/30',
        completed: 'bg-revolut-teal/10 text-revolut-teal border-revolut-teal/20',
        failed: 'bg-revolut-danger/10 text-revolut-danger border-revolut-danger/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
