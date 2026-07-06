import React, { useEffect } from 'react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  details,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  isSuccess = false,
  txHash = null,
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const solscanUrl = txHash ? `https://solscan.io/tx/${txHash}` : null;

  return (
    <>
      {/* Backdrop with fade-in */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
          onClick={onClose}
          data-close-modal
        />

        {/* Modal with scale animation */}
        <div className="relative bg-[#0d0d14] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl transition-all duration-300 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">{title || 'Confirm'}</h2>
            {!isLoading && !isSuccess && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
                data-close
              >
                ✕
              </button>
            )}
          </div>

          {/* Message */}
          <div className="mb-4">
            <p className="text-gray-300 text-sm">{message}</p>
            {details && (
              <div className="mt-2 bg-black/40 p-3 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-400 font-mono break-all">{details}</p>
              </div>
            )}
          </div>

          {/* Children slot for custom content */}
          {children && <div className="mb-4">{children}</div>}

          {/* Success state with Solscan link */}
          {isSuccess && txHash && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm font-semibold mb-1">✅ Transaction Confirmed!</p>
              <a
                href={solscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#00ff88] hover:underline font-mono break-all"
              >
                View on Solscan →
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!isSuccess ? (
              <>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 py-2 bg-gray-700 rounded-lg text-white font-bold hover:bg-gray-600 transition disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 py-2 bg-[#00ff88]/20 border border-[#00ff88]/30 rounded-lg text-[#00ff88] font-bold hover:bg-[#00ff88]/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-[#00ff88]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    confirmText
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-[#00ff88]/20 border border-[#00ff88]/30 rounded-lg text-[#00ff88] font-bold hover:bg-[#00ff88]/30 transition"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add animation styles if not already present */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default ConfirmModal;