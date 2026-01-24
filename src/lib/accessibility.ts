import { useEffect, useRef, useCallback, RefObject } from 'react';

/**
 * Returns an array of focusable elements within a container.
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), summary, details, [contenteditable="true"]'
    )
  );
};

/**
 * Hook to trap focus within a specific element (e.g., a modal).
 */
export const useFocusTrap = (ref: RefObject<HTMLElement | null>, isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen || !ref.current) return;

    const container = ref.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Set initial focus
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      // Small delay to ensure modal is rendered/animated
      const timeoutId = setTimeout(() => {
        if (focusableElements[0]) focusableElements[0].focus();
      }, 50);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, ref]);
};

/**
 * Hook to handle Escape key presses.
 */
export const useEscapeKey = (onEscape: () => void, isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onEscape]);
};

/**
 * Hook to handle clicks outside of a specific element.
 */
export const useClickOutside = (
  ref: RefObject<HTMLElement | null>,
  onClickOutside: () => void,
  isOpen: boolean
) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, ref, onClickOutside]);
};

/**
 * Hook to return focus to the previously active element when a component unmounts.
 */
export const useFocusReturn = (isOpen: boolean) => {
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
    } else if (previousFocus.current) {
      previousFocus.current.focus();
    }
  }, [isOpen]);
};

/**
 * Combined hook for modal accessibility.
 */
interface UseModalAccessibilityProps {
  modalRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
}

export const useModalAccessibility = ({
  modalRef,
  isOpen,
  onClose
}: UseModalAccessibilityProps) => {
  useFocusTrap(modalRef, isOpen);
  useEscapeKey(onClose, isOpen);
  useClickOutside(modalRef, onClose, isOpen);
  useFocusReturn(isOpen);

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
};
