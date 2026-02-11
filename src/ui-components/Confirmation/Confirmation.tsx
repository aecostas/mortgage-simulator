import React, { useState, useRef } from 'react';
import { Modal } from '../../components/Modal/Modal';
import './Confirmation.scss';

interface ConfirmationProps {
  children: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * Wraps a single child (e.g. TrashButton), intercepts its click to show a confirmation popup.
 * If the user accepts, the child's original onClick is called.
 */
export function Confirmation({
  children,
  title = 'Confirmar',
  message = '¿Estás seguro?',
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
}: ConfirmationProps) {
  const [open, setOpen] = useState(false);
  const pendingOnClickRef = useRef<((e: React.MouseEvent) => void) | null>(null);

  const child = React.Children.only(children);
  const originalOnClick = child.props.onClick;

  const wrappedOnClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    pendingOnClickRef.current = originalOnClick ?? null;
    setOpen(true);
  };

  const handleConfirm = () => {
    if (pendingOnClickRef.current) {
      pendingOnClickRef.current({} as React.MouseEvent);
      pendingOnClickRef.current = null;
    }
    setOpen(false);
  };

  const handleClose = () => {
    pendingOnClickRef.current = null;
    setOpen(false);
  };

  return (
    <>
      {React.cloneElement(child, { onClick: wrappedOnClick })}
      <Modal isOpen={open} onClose={handleClose} title={title} contentClassName="modal-content--compact">
        <div className="confirmation">
          <p className="confirmation__message">{message}</p>
          <div className="confirmation__actions">
            <button
              type="button"
              className="confirmation__button confirmation__button--secondary"
              onClick={handleClose}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className="confirmation__button confirmation__button--primary"
              onClick={handleConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
