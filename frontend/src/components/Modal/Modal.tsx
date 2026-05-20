import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { backdropVariant, modalVariant } from '../../constants/animation';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  closeButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { width: '400px', maxHeight: '500px' },
  md: { width: '600px', maxHeight: '700px' },
  lg: { width: '800px', maxHeight: '85vh' },
};

const Modal = React.memo<ModalProps>(({
  isOpen,
  onClose,
  title,
  children,
  closeButton = true,
  size = 'md',
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="modal-backdrop"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={backdropVariant}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: colors.bg.overlay,
              backdropFilter: 'blur(4px)',
              zIndex: 999,
            }}
          />

          {/* Modal Container */}
          <motion.div
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            {/* Modal Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariant}
              onClick={(e) => e.stopPropagation()}
              style={{
                pointerEvents: 'auto',
                ...sizeMap[size],
              }}
              className="glass-elevated modal-content"
            >
              {/* Header */}
              {(title || closeButton) && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: spacing.md,
                    borderBottom: `1px solid rgba(24, 72, 200, 0.1)`,
                  }}
                >
                  {title && (
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: 700,
                        color: colors.text.primary,
                      }}
                    >
                      {title}
                    </h2>
                  )}
                  {closeButton && (
                    <button
                      onClick={onClose}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: colors.text.secondary,
                        cursor: 'pointer',
                        fontSize: '24px',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = colors.text.primary)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = colors.text.secondary)
                      }
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              <div
                style={{
                  paddingTop: spacing.md,
                  overflowY: 'auto',
                  maxHeight: size === 'sm' ? '400px' : size === 'md' ? '600px' : 'calc(85vh - 80px)',
                }}
              >
                {children}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

Modal.displayName = 'Modal';
export default Modal;
