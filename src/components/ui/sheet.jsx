"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { XIcon } from "lucide-react"

function Sheet({ ...props }) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetPortal({ ...props }) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetClose({ ...props }) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-gray-12/40 backdrop-blur-sm duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({ className, children, side = "left", ...props }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex h-full w-72 flex-col bg-gray-1 border-gray-4 shadow-xl duration-150 outline-none data-open:animate-in data-closed:animate-out",
          side === "left" && "left-0 top-0 border-r data-open:slide-in-from-left data-closed:slide-out-to-left",
          side === "right" && "right-0 top-0 border-l data-open:slide-in-from-right data-closed:slide-out-to-right",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          data-slot="sheet-close"
          className="absolute top-3 right-3 p-1 rounded-md hover:bg-gray-3 text-gray-9 hover:text-gray-12 transition-colors"
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-2 p-4 border-b border-gray-4", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-base font-medium text-gray-12", className)}
      {...props}
    />
  )
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose }
