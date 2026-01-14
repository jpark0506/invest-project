import { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  showCloseButton = true,
}: ModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        className={`relative bg-surface rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden animate-slide-up ${className}`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="sticky top-0 bg-surface px-5 py-4 border-b border-border flex items-center justify-between">
            {title && (
              <h3 className="text-lg font-bold text-text-primary">{title}</h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background transition-colors text-text-secondary"
                aria-label="Close"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="overflow-auto max-h-[calc(85vh-60px)]">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'default' | 'danger';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  isLoading = false,
  variant = 'default',
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="p-5 space-y-4">
        <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary">{message}</p>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 btn btn-secondary btn-md"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 btn btn-md ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
          >
            {isLoading ? '처리 중...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
