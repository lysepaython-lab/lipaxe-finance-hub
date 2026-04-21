import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { notificationsApi } from '@/store/api/notificationsApi';
import { toast } from 'sonner';
import { API_URL } from '@/store/api/baseApi';

/**
 * Subscribes to a realtime channel for high-priority notifications.
 * - WebSocket first (wss://host/ws/notifications/?token=…)
 * - SSE fallback (host/api/notifications/stream/)
 * - Polling already handled by RTK Query as a baseline.
 *
 * On any incoming push, we invalidate the Notifications tag so the inbox
 * refetches immediately, and we surface a toast for high-priority items.
 */
export const useNotificationsStream = () => {
  const dispatch = useAppDispatch();
  const isAuthed = useAppSelector((s) => !!s.auth.accessToken);
  const token = useAppSelector((s) => s.auth.accessToken);
  const wsRef = useRef<WebSocket | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);

  useEffect(() => {
    if (!isAuthed) return;

    let stopped = false;

    const refetch = () =>
      dispatch(notificationsApi.util.invalidateTags(['Notifications']));

    const handlePush = (raw: string) => {
      try {
        const n = JSON.parse(raw);
        refetch();
        if (n?.priority === 'high') {
          toast(n.title || 'Nouvelle notification', {
            description: n.body,
            duration: 8000,
          });
        }
      } catch {
        refetch();
      }
    };

    const connectSSE = () => {
      if (!API_URL || stopped) return;
      try {
        const url = `${API_URL}/api/notifications/stream/`;
        const es = new EventSource(url, { withCredentials: true });
        esRef.current = es;
        es.onmessage = (ev) => handlePush(ev.data);
        es.onerror = () => {
          es.close();
          esRef.current = null;
          if (!stopped) setTimeout(connectSSE, Math.min(30000, 2000 * ++retryRef.current));
        };
      } catch {
        /* SSE unavailable — polling fallback already in place */
      }
    };

    const connectWS = () => {
      if (!API_URL || stopped) return connectSSE();
      try {
        const wsUrl =
          API_URL.replace(/^http/, 'ws').replace(/\/$/, '') +
          `/ws/notifications/${token ? `?token=${encodeURIComponent(token)}` : ''}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onmessage = (ev) => handlePush(typeof ev.data === 'string' ? ev.data : '');
        ws.onopen = () => { retryRef.current = 0; };
        ws.onerror = () => { /* fall through to onclose */ };
        ws.onclose = () => {
          wsRef.current = null;
          if (stopped) return;
          retryRef.current += 1;
          // After 3 failures, fall back to SSE.
          if (retryRef.current >= 3) connectSSE();
          else setTimeout(connectWS, Math.min(15000, 1500 * retryRef.current));
        };
      } catch {
        connectSSE();
      }
    };

    connectWS();

    return () => {
      stopped = true;
      wsRef.current?.close();
      esRef.current?.close();
      wsRef.current = null;
      esRef.current = null;
    };
  }, [isAuthed, token, dispatch]);
};
