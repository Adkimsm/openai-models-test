import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-lg border border-gray-4 bg-gray-1 px-3 py-1 text-sm text-gray-12 transition-colors outline-none placeholder:text-gray-8 focus-visible:border-gray-8 focus-visible:ring-2 focus-visible:ring-gray-8/20 disabled:cursor-not-allowed disabled:opacity-50 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-12 aria-invalid:border-red-11 aria-invalid:ring-2 aria-invalid:ring-red-11/20 dark:bg-gray-3 dark:placeholder:text-gray-9",
        className
      )}
      {...props} />
  );
}

export { Input }
