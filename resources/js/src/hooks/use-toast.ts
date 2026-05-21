import * as React from "react"

export interface Toast {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}

export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  return {
    toasts,
    toast: (props: Omit<Toast, "id">) => {},
    dismiss: (id?: string) => {},
  }
}
