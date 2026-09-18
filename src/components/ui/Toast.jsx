import { useState, useCallback, createContext, useContext } from "react";
import { FiCheckCircle, FiInfo, FiAlertCircle } from "react-icons/fi";

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
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 items-center pointer-events-none w-full max-w-sm px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-sm font-medium
              backdrop-blur-xl shadow-2xl
              animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)]
              pointer-events-auto border
              ${
                toast.type === "success"
                  ? "bg-emerald-950/80 text-emerald-100 border-emerald-500/30 shadow-emerald-900/20"
                  : toast.type === "error"
                    ? "bg-red-950/80 text-red-100 border-red-500/30 shadow-red-900/20"
                    : "bg-slate-900/90 text-slate-100 border-white/10 shadow-black/40"
              }
            `}
          >
            <div className="shrink-0">
              {toast.type === "success" && <FiCheckCircle className="text-emerald-400" size={18} />}
              {toast.type === "error" && <FiAlertCircle className="text-red-400" size={18} />}
              {toast.type === "info" && <FiInfo className="text-cyan-400" size={18} />}
            </div>
            <p className="flex-1 text-left">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
