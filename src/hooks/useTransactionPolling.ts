import { useEffect, useRef, useState } from 'react';
import { walletApi } from '@/store/api/walletApi';
import { useAppDispatch } from '@/store/hooks';

type Status = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Polls a transaction every `intervalMs` (default 2s) until it's completed/failed,
 * or until `maxAttempts` is reached. Designed for async deposits/withdrawals that
 * settle a few seconds after submission.
 */
export function useTransactionPolling(
  txId: string | null,
  options: { intervalMs?: number; maxAttempts?: number } = {},
) {
  const { intervalMs = 2000, maxAttempts = 45 } = options;
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<Status>('idle');
  const attempts = useRef(0);

  useEffect(() => {
    if (!txId) { setStatus('idle'); attempts.current = 0; return; }
    setStatus('pending');
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      attempts.current += 1;
      try {
        const res = await dispatch(walletApi.endpoints.transaction.initiate(txId, { forceRefetch: true })).unwrap();
        if (cancelled) return;
        const s = res.status;
        if (s === 'completed') { setStatus('completed'); return; }
        if (s === 'failed') { setStatus('failed'); return; }
        setStatus(s === 'processing' ? 'processing' : 'pending');
      } catch {
        // keep polling silently
      }
      if (attempts.current >= maxAttempts) {
        // Async providers like mobile money can settle after the local polling window.
        // Keep the UI in a non-terminal state instead of showing a false failure.
        setStatus('processing');
        return;
      }
      setTimeout(tick, intervalMs);
    };

    const t = setTimeout(tick, intervalMs);
    return () => { cancelled = true; clearTimeout(t); };
  }, [txId, dispatch, intervalMs, maxAttempts]);

  return status;
}
