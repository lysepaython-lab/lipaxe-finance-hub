import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

type Capture = { file: File; name: string };

type SelfieWithIdCaptureProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (capture: Capture) => void;
};

const stopStream = (stream: MediaStream | null) => stream?.getTracks().forEach((track) => track.stop());

export const SelfieWithIdCapture = ({ open, onOpenChange, onSuccess }: SelfieWithIdCaptureProps) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<Capture & { url: string } | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [starting, setStarting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);

  const releaseCamera = () => {
    stopStream(streamRef.current);
    streamRef.current = null;
    setCameraActive(false);
  };

  const reset = () => {
    releaseCamera();
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setPolicyAccepted(false);
    setCameraError('');
  };

  useEffect(() => () => releaseCamera(), []);

  useEffect(() => {
    const video = videoRef.current;
    if (!cameraActive || !video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    void video.play();
  }, [cameraActive]);

  useEffect(() => {
    if (!open) reset();
    // The modal owns its media stream so it can never survive navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const startCamera = async () => {
    setStarting(true);
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setCameraError(t('kyc.cameraSelfiePermissionError'));
      releaseCamera();
    } finally {
      setStarting(false);
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const name = `selfie-piece-identite-${Date.now()}.jpg`;
      const file = new File([blob], name, { type: 'image/jpeg' });
      const url = URL.createObjectURL(file);
      setPreview({ file, name, url });
      releaseCamera();
    }, 'image/jpeg', 0.92);
  };

  const retake = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setPolicyAccepted(false);
    void startCamera();
  };

  const close = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[94vh] max-w-xl overflow-y-auto p-0 sm:rounded-2xl">
        <DialogHeader className="px-6 pt-6 text-left">
          <DialogTitle className="font-display text-xl">{t('kyc.cameraSelfieTitle')}</DialogTitle>
          <DialogDescription>{t('kyc.cameraSelfieDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-2">
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-sm text-foreground">
            <div className="mb-2 flex items-center gap-2 font-semibold text-primary"><ShieldCheck className="h-4 w-4" />{t('kyc.cameraSelfieChecklistTitle')}</div>
            <ul className="space-y-1 text-muted-foreground">
              <li>{t('kyc.cameraSelfieChecklistFace')}</li>
              <li>{t('kyc.cameraSelfieChecklistId')}</li>
              <li>{t('kyc.cameraSelfieChecklistLight')}</li>
            </ul>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-950">
            {preview ? (
              <img src={preview.url} alt="Selfie avec pièce d'identité" className="h-full w-full object-cover" />
            ) : cameraActive ? (
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center text-white">
                <Camera className="h-10 w-10 text-primary-foreground" />
                <p className="text-sm">{cameraError || t('kyc.cameraSelfieCameraReady')}</p>
                <Button type="button" variant="secondary" onClick={() => void startCamera()} disabled={starting}>
                  <Camera className="h-4 w-4" />{starting ? t('common.loading') : t('kyc.cameraSelfieStart')}
                </Button>
              </div>
            )}
            {!preview && cameraActive ? (
              <div className="pointer-events-none absolute inset-5 rounded-[2rem] border-2 border-dashed border-white/75" />
            ) : null}
          </div>

          {preview ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm">
              <Checkbox checked={policyAccepted} onCheckedChange={(checked) => setPolicyAccepted(checked === true)} />
              <span>{t('kyc.cameraSelfiePolicy')}</span>
            </label>
          ) : null}
        </div>

        <DialogFooter className="gap-2 border-t bg-muted/20 px-6 py-4 sm:justify-between">
          {preview ? (
            <Button type="button" variant="outline" onClick={retake}><RefreshCw className="h-4 w-4" />{t('kyc.cameraSelfieRetake')}</Button>
          ) : cameraActive ? (
            <Button type="button" variant="secondary" onClick={capture}><Camera className="h-4 w-4" />{t('kyc.cameraSelfieCapture')}</Button>
          ) : <span />}
          {preview ? (
            <Button type="button" disabled={!policyAccepted} onClick={() => { onSuccess(preview); close(); }}>
              <CheckCircle2 className="h-4 w-4" />{t('kyc.cameraSelfieUse')}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
