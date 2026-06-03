import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { notificationsApi, useNotificationsQuery } from '@/store/api/notificationsApi';
import { isPushSupported, ensureServiceWorker, showLocalNotification } from '@/lib/pushNotifications';

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
  const seenIdsRef = useRef<Set<string>>(new Set());
  const bootstrappedRef = useRef(false);
  const { data: notifications } = useNotificationsQuery(undefined, {
    skip: !isAuthed,
    pollingInterval: 15_000,
  });

  useEffect(() => {
    if (!isAuthed) return;

    const refetch = () => dispatch(notificationsApi.util.invalidateTags(['Notifications']));

    if (isPushSupported()) ensureServiceWorker().catch(() => {});
    refetch();

    return () => {
      seenIdsRef.current = new Set();
      bootstrappedRef.current = false;
    };
  }, [isAuthed, dispatch]);

  useEffect(() => {
    if (!isAuthed || !notifications?.length) return;

    const unread = notifications.filter((item) => !item.read);
    if (!bootstrappedRef.current) {
      seenIdsRef.current = new Set(unread.map((item) => String(item.id)));
      bootstrappedRef.current = true;
      return;
    }

    for (const item of unread) {
      const id = String(item.id);
      if (seenIdsRef.current.has(id)) continue;
      seenIdsRef.current.add(id);
      showLocalNotification(item.title || 'Lipaxe', item.body || '', {
        tag: `lipaxe-${id}`,
        data: { url: item.link || '/app/notifications' },
      });
    }
  }, [isAuthed, notifications]);
};
