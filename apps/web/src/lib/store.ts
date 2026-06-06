import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  description?: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string, description?: string) =>
    useToastStore.getState().push({ message, description, tone: "success" }),
  error: (message: string, description?: string) =>
    useToastStore.getState().push({ message, description, tone: "error" }),
  info: (message: string, description?: string) =>
    useToastStore.getState().push({ message, description, tone: "info" }),
};

// ----- Command palette (cmd+k) global open state -----
interface PaletteState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const usePaletteStore = create<PaletteState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
