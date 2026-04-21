import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  onResult: (text: string) => void;
  onClose?: () => void;
  className?: string;
}

/**
 * Live camera QR scanner powered by html5-qrcode.
 * - Requests camera permission, prefers the rear camera.
 * - Stops cleanly on unmount.
 */
export const QrScanner = ({ onResult, onClose, className }: Props) => {
  const elId = useRef(`qr-${Math.random().toString(36).slice(2, 8)}`);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        const html5 = new Html5Qrcode(elId.current, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = html5;
        await html5.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (cancelled) return;
            onResult(decoded);
            html5.stop().catch(() => undefined);
          },
          () => undefined,
        );
        if (!cancelled) setStarting(false);
      } catch (e) {
        if (cancelled) return;
        setStarting(false);
        setError(
          e instanceof Error
            ? e.message
            : "Impossible d'accéder à la caméra",
        );
      }
    };
    start();
    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        s.stop().catch(() => undefined).finally(() => {
          try { s.clear(); } catch { /* noop */ }
        });
      }
    };
  }, [onResult]);

  return (
    <div className={cn('relative rounded-2xl overflow-hidden bg-black/90', className)}>
      <div id={elId.current} className="w-full aspect-square" />
      {starting && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-primary-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-xs">Démarrage de la caméra…</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-primary-foreground gap-2 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-warning" />
          <p className="text-sm font-semibold">Caméra indisponible</p>
          <p className="text-xs opacity-80">{error}</p>
        </div>
      )}
      {!error && !starting && (
        <div className="pointer-events-none absolute inset-6 border-2 border-primary/70 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
      )}
      {onClose && (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute top-2 right-2 h-8 w-8 rounded-full"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[10px] text-primary-foreground/80 bg-black/50 px-2 py-1 rounded-full">
        <Camera className="h-3 w-3" /> Visez un QR code Lipaxe
      </div>
    </div>
  );
};
