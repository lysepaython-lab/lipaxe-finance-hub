const DEVICES_KEY = 'lipaxe-local-devices';
const TWO_FA_KEY = 'lipaxe-local-2fa';

type TrustedDevice = {
  id: string;
  device_id: string;
  label: string;
  ip: string;
  last_seen: string;
  current: boolean;
  trusted: boolean;
};

const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local security hints are optional when browser storage is unavailable.
  }
};

export const localDevices = {
  list(): TrustedDevice[] {
    return read<TrustedDevice[]>(DEVICES_KEY, []);
  },
  register(device: { device_id: string; label: string }) {
    const current = this.list();
    const existing = current.find((item) => item.device_id === device.device_id);
    if (existing) return existing;

    const created: TrustedDevice = {
      id: crypto.randomUUID(),
      device_id: device.device_id,
      label: device.label,
      ip: 'Current session',
      last_seen: new Date().toISOString(),
      current: true,
      trusted: true,
    };
    write(DEVICES_KEY, [created, ...current]);
    return created;
  },
  revoke(id: string) {
    write(
      DEVICES_KEY,
      this.list().filter((item) => item.id !== id),
    );
  },
  trust(id: string, trusted: boolean) {
    write(
      DEVICES_KEY,
      this.list().map((item) => (item.id === id ? { ...item, trusted } : item)),
    );
  },
};

export const localTwoFa = {
  status(): { enabled: boolean } {
    return read(TWO_FA_KEY, { enabled: false });
  },
  enable() {
    write(TWO_FA_KEY, { enabled: true });
  },
  disable() {
    write(TWO_FA_KEY, { enabled: false });
  },
};
