"use client"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"

import { cn } from "@/lib/utils"

function Progress({
  className,
  children,
  value,
  ...props
}) {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn("flex flex-wrap gap-3", className)}
      {...props}>
      {children}
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  );
}

function ProgressTrack({
  className,
  ...props
}) {
  return (
    <ProgressPrimitive.Track
      className={cn(
        "relative flex h-2 w-full items-center overflow-x-hidden rounded-full bg-gray-3",
        className
      )}
      data-slot="progress-track"
      {...props} />
  );
}

function ProgressIndicator({
  className,
  ...props
}) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn("h-full rounded-full bg-gray-12 transition-all", className)}
      {...props} />
  );
}

function ProgressLabel({
  className,
  ...props
}) {
  return (
    <ProgressPrimitive.Label
      className={cn("text-sm font-medium text-gray-12", className)}
      data-slot="progress-label"
      {...props} />
  );
}

function ProgressValue({
  className,
  ...props
}) {
  return (
    <ProgressPrimitive.Value
      className={cn("ml-auto text-sm text-gray-9 tabular-nums", className)}
      data-slot="progress-value"
      {...props} />
  );
}

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
}
