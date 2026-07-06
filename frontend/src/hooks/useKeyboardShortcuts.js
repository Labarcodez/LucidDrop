import { useEffect } from 'react';

export const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handler = (e) => {
      // Cmd/Ctrl + K → open deposit
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('[data-deposit]')?.click();
      }
      // Space → spin/place bet
      if (e.key === ' ' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        document.querySelector('[data-action="bet"]')?.click();
      }
      // C → Cash out (in Crash)
      if (e.key === 'c' || e.key === 'C') {
        if (!e.target.matches('input, textarea')) {
          document.querySelector('[data-action="cashout"]')?.click();
        }
      }
      // Esc → Close modals
      if (e.key === 'Escape') {
        document.querySelector('[data-close-modal]')?.click();
        // Also close any open modal dialogs
        const modals = document.querySelectorAll('[role="dialog"], .modal-overlay');
        modals.forEach(modal => {
          const closeBtn = modal.querySelector('[data-close]');
          if (closeBtn) closeBtn.click();
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
};