"use client"

import { Toaster as Sonner, toast as sonnerToast } from "sonner"
import { cn } from "@/lib/utils"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toaster]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toaster]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

function toast({
  title,
  description,
  variant = "default",
  action,
  ...props
}: {
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success" | "info"
  action?: React.ReactNode
}) {
  return sonnerToast(title, {
    description,
    action,
    className: cn(
      variant === "destructive" && "border-destructive bg-destructive text-destructive-foreground",
      variant === "success" && "border-green-500 bg-green-50 text-green-900 dark:bg-green-900/30 dark:text-green-400",
      variant === "info" && "border-electric-blue bg-electric-blue/10 text-electric-blue"
    ),
    ...props,
  })
}

export { Toaster, toast }
