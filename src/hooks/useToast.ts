import { useState, useCallback, useEffect, useRef } from 'react';

const TOAST_DURATION_MS = 4000;

interface UseToastReturn {
  toast: string | null;
  triggerNotification: (message: string) => void;
}

/**
 * Custom hook untuk mengelola sistem toast notification global.
 * Menggantikan state & logic yang sebelumnya tersebar di App.tsx.
 *
 * @example
 * const { toast, triggerNotification } = useToast();
 * triggerNotification('Data berhasil disimpan!');
 */
export function useToast(): UseToastReturn {
  const [toast, setToast] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout saat komponen unmount — mencegah memory leak
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const triggerNotification = useCallback((message: string) => {
    setToast(message);

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  return { toast, triggerNotification };
}
