import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { notificationsApi } from '@/store/api/notificationsApi';
import { isPushSupported, ensureServiceWorker } from '@/lib/pushNotifications';

/**
 * Backend currently exposes only the REST notifications API.
 * We therefore keep polling via RTK Query and avoid opening missing
 * websocket/SSE endpoints that generate 404 noise in production.
 *
 * On any incoming push, we invalidate the Notifications tag so the inbox
 * refetches immediately, and we surface a toast for high-priority items.
 */
export const useNotificationsStream = () => {
  const dispatch = useAppDispatch();
  const isAuthed = useAppSelector((s) => !!s.auth.accessToken);
  const lastUnreadRef = useRef(0);

  useEffect(() => {
    if (!isAuthed) return;

    const refetch = () => dispatch(notificationsApi.util.invalidateTags(['Notifications']));

    if (isPushSupported()) ensureServiceWorker().catch(() => {});
    refetch();

    return () => {
      lastUnreadRef.current = 0;
    };
  }, [isAuthed, dispatch]);
};
