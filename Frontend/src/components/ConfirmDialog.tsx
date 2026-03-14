import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: "danger" | "warning";
}

export function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message,
  confirmText = "Delete", cancelText = "Cancel",
  loading = false, variant = "danger"
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", duration: 0.5, bounce: 0.3 } }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    variant === "danger" ? "bg-red-100" : "bg-amber-100"}`}>
                    <AlertTriangle size={24} className={variant === "danger" ? "text-red-600" : "text-amber-600"} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                      <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                        <X size={18} />
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{message}</p>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 flex justify-end gap-3">
                <button onClick={onClose} disabled={loading}
                  className="px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium text-sm disabled:opacity-50">
                  {cancelText}
                </button>
                <button onClick={onConfirm} disabled={loading}
                  className={`px-4 py-2.5 text-white rounded-xl transition-colors font-medium text-sm disabled:opacity-50 flex items-center gap-2 ${
                    variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}`}>
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
