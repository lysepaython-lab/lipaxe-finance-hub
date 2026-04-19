import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const IDLE_MS = 15 * 60 * 1000; // 15 min idle → warn
const WARN_MS = 60 * 1000;       // 1 min countdown to logout

/** Logs the user out after sustained inactivity, with a polite warning. */
export const SessionTimeoutGuard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isAuthed = useAppSelector((s) => !!s.auth.accessToken);
  const [warn, setWarn] = useState(false);
  const [countdown, setCountdown] = useState(WARN_MS / 1000);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();
  const tickTimer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!isAuthed) return;

    const reset = () => {
      if (warn) return; // don't reset during the warning countdown
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setWarn(true), IDLE_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      clearTimeout(idleTimer.current);
    };
  }, [isAuthed, warn]);

  useEffect(() => {
    if (!warn) return;
    setCountdown(WARN_MS / 1000);
    tickTimer.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(tickTimer.current);
          dispatch(logout());
          toast('Session expirée pour inactivité');
          navigate('/login', { replace: true });
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tickTimer.current);
  }, [warn, dispatch, navigate]);

  if (!isAuthed) return null;

  return (
    <AlertDialog open={warn} onOpenChange={() => {}}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('common.sessionExpiringTitle', { defaultValue: 'Toujours là ?' })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('common.sessionExpiringBody', {
              defaultValue: 'Vous allez être déconnecté dans {{count}} secondes pour votre sécurité.',
              count: countdown,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              dispatch(logout());
              navigate('/login', { replace: true });
            }}
          >
            {t('nav.logout')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => setWarn(false)}>
            {t('common.stayConnected', { defaultValue: 'Rester connecté' })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
