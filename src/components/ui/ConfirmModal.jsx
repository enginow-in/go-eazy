import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

export const ConfirmModal = ({ open, title, message, onConfirm, onCancel, danger = false }) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              {danger && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              <Button
                variant={danger ? 'danger' : 'primary'}
                onClick={onConfirm}
              >
                Confirm
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
