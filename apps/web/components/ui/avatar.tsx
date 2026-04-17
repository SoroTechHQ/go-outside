"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-secondary)] text-xs font-semibold",
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

const avatarStatusVariants = cva(
  "absolute rounded-full border-2 border-[var(--bg-card)]",
  {
    variants: {
      status: {
        online: "bg-green-500",
        offline: "bg-gray-400",
        busy: "bg-yellow-500",
        away: "bg-blue-500",
      },
      size: {
        sm: "size-2 bottom-0 right-0",
        md: "size-2.5 bottom-0 right-0",
        lg: "size-3 bottom-0.5 right-0.5",
      },
    },
    defaultVariants: {
      status: "offline",
      size: "md",
    },
  },
);

type AvatarStatusProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof avatarStatusVariants>;

function AvatarStatus({ className, status, size, ...props }: AvatarStatusProps) {
  return (
    <span
      className={cn(avatarStatusVariants({ status, size }), className)}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarStatus, avatarStatusVariants };
