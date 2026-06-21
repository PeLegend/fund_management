import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-button text-sm font-semibold transition-all duration-100 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] active:-translate-y-[0.5px]',
  {
    variants: {
      variant: {
        default: 'bg-white text-black hover:bg-zinc-200 border border-transparent',
        primary: 'bg-primary text-white hover:bg-primary-deep border border-transparent',
        destructive: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30',
        outline: 'border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10',
        outlineDark: 'border border-white/10 bg-transparent text-white hover:bg-white/5',
        secondary: 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-transparent',
        ghost: 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent',
      },
      size: {
        default: 'h-12 px-6',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-14 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
