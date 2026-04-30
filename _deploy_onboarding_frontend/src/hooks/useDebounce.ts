import { useEffect, useRef, useState } from 'react';

/**
 * useDebounce — enterprise-grade debounced value hook.
 *
 * Returns a debounced copy of `value` that only updates after the caller has
 * stopped changing it for `delayMs` milliseconds.  Uses a `useRef` to hold
 * the timer so it never leaks across renders, and cleans up properly on
 * unmount.
 *
 * @example
 *   const debouncedQuery = useDebounce(searchInput, 400);
 *   // debouncedQuery only changes after 400 ms of no typing
 *
 * @param value   - The rapidly-changing value (e.g. controlled input)
 * @param delayMs - Quiet period before the debounced value updates (ms)
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  // Keep timer in a ref so we can cancel on the next call without causing a
  // re-render just for bookkeeping.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
      timerRef.current = null;
    }, delayMs);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, delayMs]);

  return debouncedValue;
}
