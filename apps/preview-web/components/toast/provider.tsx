import { createContext, use, useState } from "react";

type ToastVariant = "info" | "success" | "warning" | "error";

interface ToastContextValue {
  variant: ToastVariant;
  message: string;
  addToast: (variant: ToastVariant, message: string, timeout?: number) => void;
  clearToast: () => void;
}

const defaultValue: ToastContextValue = {
  message: "",
  variant: "info" as ToastVariant,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  addToast: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  clearToast: () => {},
};

const ToastContext = createContext(defaultValue);
export const useToast = () => use(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariant] = useState<ToastVariant>("info");
  const [message, setMessage] = useState<string>("");

  const addToast = (variant: ToastVariant, message: string, timeout = 3000) => {
    setVariant(variant);
    setMessage(message);
    setTimeout(() => setMessage(""), timeout);
  };

  const clearToast = () => setMessage("");

  return <ToastContext value={{ message, variant, clearToast, addToast }}>{children}</ToastContext>;
}
