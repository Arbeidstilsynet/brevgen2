import { createContext, use, useRef, useState } from "react";

type ToastVariant = "info" | "success" | "warning" | "error";

interface ToastContextValue {
  variant: ToastVariant;
  message: string | null;
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
  const [toastVariant, setToastVariant] = useState<ToastVariant>("info");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearToast = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setToastMessage(null);
  };

  const addToast = (variant: ToastVariant, message: string, timeout?: number) => {
    timeout ??= variant === "error" ? 10_000 : 3000;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setToastVariant(variant);
    setToastMessage(message);

    timeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      timeoutRef.current = null;
    }, timeout);
  };

  return (
    <ToastContext value={{ message: toastMessage, variant: toastVariant, clearToast, addToast }}>
      {children}
    </ToastContext>
  );
}
