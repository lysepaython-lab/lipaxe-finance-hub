import { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { getDeviceId, getDeviceLabel } from '@/lib/deviceFingerprint';
import { useRegisterDeviceMutation } from '@/store/api/securityApi';

/**
 * Registers the current browser as a known device on every authenticated
 * session. Runs once per mount and is a no-op if the backend already knows it.
 */
export function useDeviceRegistration() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const [registerDevice] = useRegisterDeviceMutation();

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const device_id = await getDeviceId();
        if (cancelled) return;
        registerDevice({ device_id, label: getDeviceLabel() }).catch(() => {});
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [token, registerDevice]);
}
