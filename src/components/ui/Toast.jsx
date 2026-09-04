import { useState, useEffect, useCallback, createContext, useContext } from "react";

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              px-5 py-3 rounded-2xl text-sm font-medium
              backdrop-blur-xl shadow-2xl
              animate-[slideUp_0.3s_ease-out]
              pointer-events-auto
              ${
                toast.type === "success"
                  ? "bg-emerald-500/90 text-white"
                  : toast.type === "error"
                    ? "bg-red-500/90 text-white"
                    : "bg-slate-800/90 text-slate-100 border border-white/10"
              }
            `}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
