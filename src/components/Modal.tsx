import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, CheckCircle2, Info, HelpCircle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'confirm';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel'
}: ModalProps) {
  
  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={32} />,
    error: <AlertCircle className="text-red-500" size={32} />,
    info: <Info className="text-blue-500" size={32} />,
    confirm: <HelpCircle className="text-amber-500" size={32} />
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={type !== 'confirm' ? onClose : undefined}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-surface border border-border rounded-[32px] shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-accent rounded-2xl">
                  {icons[type]}
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-text-sub hover:text-text-main transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-2xl font-serif font-bold text-text-main mb-3 leading-tight font-italic">
                {title}
              </h3>
              <p className="text-text-sub font-medium leading-relaxed">
                {message}
              </p>

              <div className="mt-10 flex gap-3">
                {type === 'confirm' && (
                  <button
                    onClick={onClose}
                    className="flex-1 py-4 bg-accent text-text-main rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (onConfirm) onConfirm();
                    else onClose();
                  }}
                  className={`flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-md active:scale-[0.98] ${
                    type === 'error' ? 'bg-red-500 text-white' : 
                    type === 'confirm' ? 'bg-red-500 text-white' :
                    'bg-primary text-white'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
