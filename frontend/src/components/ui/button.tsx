import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-button text-sm font-semibold transition-all duration-100 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-revolut-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] active:-translate-y-[0.5px]',
  {
    variants: {
      variant: {
        default: 'bg-black text-white hover:bg-zinc-900 border border-transparent', // button-dark
        primary: 'bg-white text-black hover:bg-zinc-200 border border-transparent', // button-primary
        destructive: 'bg-revolut-danger text-white hover:bg-red-600 border border-transparent',
        outline: 'border border-revolut-border bg-white text-revolut-ink hover:bg-revolut-surface-soft', // button-outline-light
        outlineDark: 'border border-white bg-black text-white hover:bg-zinc-950', // button-outline-dark
        secondary: 'bg-revolut-surface-soft text-revolut-ink hover:bg-zinc-200 border border-transparent', // button-soft
        ghost: 'text-revolut-ink hover:bg-revolut-surface-soft hover:text-black border border-transparent',
      },
      size: {
        default: 'h-12 px-6', // 48px height
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
