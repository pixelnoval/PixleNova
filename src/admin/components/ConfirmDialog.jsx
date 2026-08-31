import { useEffect, useRef } from 'react';

/**
 * Accessible confirmation dialog for destructive actions (delete).
 * Traps focus, closes on ESC, and requires explicit confirmation.
 *
 * Props:
 *   open       {boolean}
 *   title      {string}
 *   message    {string}
 *   onConfirm  {() => void}
 *   onCancel   {() => void}
 *   loading    {boolean}  — disables buttons while delete is in flight
 */
export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }) {
  const cancelRef = useRef(null);

  // Auto-focus cancel button when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="a-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="a-dialog">
        <h3 id="dialog-title" className="a-dialog__title">{title}</h3>
        <p className="a-dialog__message">{message}</p>
        <div className="a-dialog__actions">
          <button
            ref={cancelRef}
            className="a-btn a-btn--ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="a-btn a-btn--danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
