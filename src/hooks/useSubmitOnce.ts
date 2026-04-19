import { useCallback, useRef, useState } from 'react';

/**
 * Prevents double-submit on a form/action.
 * Wraps the async handler and disables it while in flight.
 */
export function useSubmitOnce<T extends (...args: never[]) => Promise<unknown>>(handler: T) {
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);

  const wrapped = useCallback(
    async (...args: Parameters<T>) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setBusy(true);
      try {
        return await handler(...args);
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [handler],
  );

  return [wrapped as T, busy] as const;
}
