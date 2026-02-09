import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Portal.scss';

interface PortalProps {
  children: React.ReactNode;
  onClickOutside?: () => void;
  backdrop?: boolean;
}

const Portal: React.FC<PortalProps> = ({ children, onClickOutside, backdrop = false }) => {
  const portalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (portalRef.current && !portalRef.current.contains(event.target as Node)) {
        onClickOutside?.();
      }
    };

    if (onClickOutside) {
      // Use a small delay to avoid immediate closing when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 10);
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [onClickOutside]);

  const portalContent = (
    <>
      {backdrop && <div className="portal-backdrop" onClick={onClickOutside} />}
      <div ref={portalRef} className="portal-content">
        {children}
      </div>
    </>
  );

  return createPortal(portalContent, document.body);
};

export default Portal;
