import { useEffect, useCallback } from 'react';

interface UseModalAccessibilityProps {
  isOpen: boolean;
  onClose: () => void;
  modalRef: React.RefObject<HTMLElement | null>;
}

export const useModalAccessibility = ({ isOpen, onClose, modalRef }: UseModalAccessibilityProps) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }

    if (event.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    }
  }, [onClose, modalRef]);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement;

    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = 'hidden';
      
      // Focus the modal or the first element
      if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement;
        if (firstFocusable) {
          // Small delay to ensure focus works in all browsers
          setTimeout(() => firstFocusable.focus(), 50);
        } else {
          modalRef.current.focus();
        }
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = 'unset';
      if (isOpen && prevFocus && document.body.contains(prevFocus)) {
        prevFocus.focus();
      }
    };
  }, [isOpen, handleKeyDown, modalRef, onClose]);
};
