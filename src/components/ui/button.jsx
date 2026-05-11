import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:border-gray-8 focus-visible:ring-2 focus-visible:ring-gray-8/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-gray-12 text-gray-1 hover:bg-gray-11 border-gray-12",
        secondary:
          "bg-gray-1 text-gray-11 border-gray-4 hover:bg-gray-2 hover:border-gray-5",
        error:
          "bg-red-11 text-red-1 border-red-11 hover:bg-red-12",
        ghost:
          "bg-transparent text-gray-11 hover:bg-gray-3",
        outline:
          "bg-transparent text-gray-11 border-gray-4 hover:bg-gray-2",
      },
      size: {
        sm: "h-8 gap-1.5 rounded-md px-3 text-sm",
        md: "h-9 gap-2 rounded-lg px-4 text-sm",
        lg: "h-10 gap-2 rounded-lg px-5 text-sm",
        icon: "size-9 rounded-lg",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
