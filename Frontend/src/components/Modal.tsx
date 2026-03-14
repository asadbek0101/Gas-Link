import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen &&
      <>
          <motion.div
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm transition-all" />

          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 20
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: {
                type: 'spring',
                duration: 0.5,
                bounce: 0.3
              }
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 20
            }}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto relative flex flex-col max-h-[90vh]">

              {/* Accent Strip */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#1E3A5F] to-blue-600" />

              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                  {title}
                </h3>
                <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200">

                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto custom-scrollbar">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      }
    </AnimatePresence>);

}