import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { API_URL } from '@/store/api/baseApi';
import { useAppSelector } from '@/store/hooks';

type Step = 'idle' | 'connecting' | 'ready' | 'processing' | 'success' | 'failed';

export interface LivenessResult {
  is_live: boolean;
  blink_valid: boolean;
  blinks_detected: boolean;
  head_movement: boolean;
  smile_detected: boolean;
  error: string | null;
  snapshotFile?: File | null;
}

interface LivenessCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (result: LivenessResult) => void;
}

const MAX_ATTEMPTS = 5;
const ACTION_PREPARE_MS = 1500; // se preparer
const ACTION_EXECUTION_MS = 7000; // faire l'action pour le liveness
const FRAME_INTERVAL_MS = 250;
const FRAME_WIDTH = 320;
const FRAME_HEIGHT = 240;

const buildWsUrl = (token?: string | null) => {
  const base = API_URL.replace(/^http/, 'ws').replace(/\/+$/, '');
  const query = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${base}/ws/liveness/${query}`;
};

const mapInstruction = (instruction: string | undefined, t: (key: string, options?: Record<string, unknown>) => string) => {
  const raw = (instruction || '').toLowerCase();
  if (raw.includes('blink')) return t('kyc.livenessActionBlink');
  if (raw.includes('smile')) return t('kyc.livenessActionSmile');
  if (raw.includes('mouth')) return t('kyc.livenessActionMouth');
  if (raw.includes('left')) return t('kyc.livenessActionLeft');
  if (raw.includes('right')) return t('kyc.livenessActionRight');
  return instruction || t('kyc.livenessActionFallback');
};

export const LivenessCapture = ({ open, onOpenChange, onSuccess }: LivenessCaptureProps) => {
  const { t } = useTranslation();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sendIntervalRef = useRef<number | null>(null);
  const prepareTimeoutRef = useRef<number | null>(null);
  const executionTimeoutRef = useRef<number | null>(null);
  const isPreparingActionRef = useRef(false);
  const isSendingFrameRef = useRef(false);
  const activeChallengeRef = useRef(0);
  const handleServerMessageRef = useRef<(data: any) => void>(() => {});

  const [step, setStep] = useState<Step>('idle');
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [challengeText, setChallengeText] = useState('');
  const [progress, setProgress] = useState(0);
  const [connected, setConnected] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [isPreparingAction, setIsPreparingAction] = useState(false);

  const setPreparingAction = useCallback((value: boolean) => {
    isPreparingActionRef.current = value;
    setIsPreparingAction(value);
  }, []);

  const stopFrameSending = useCallback(() => {
    if (sendIntervalRef.current) {
      window.clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }
    isSendingFrameRef.current = false;
  }, []);

  const clearPrepareTimeout = useCallback(() => {
    if (prepareTimeoutRef.current) {
      window.clearTimeout(prepareTimeoutRef.current);
      prepareTimeoutRef.current = null;
    }
    setPreparingAction(false);
  }, [setPreparingAction]);

  const clearExecutionTimeout = useCallback(() => {
    if (executionTimeoutRef.current) {
      window.clearTimeout(executionTimeoutRef.current);
      executionTimeoutRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  const closeSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  const resetState = useCallback(() => {
    activeChallengeRef.current += 1;
    setStep('idle');
    setErrors([]);
    setChallengeText(t('kyc.livenessCenterFace'));
    setProgress(0);
    setConnected(false);
    setCameraReady(false);
    setPreparingAction(false);
  }, [setPreparingAction, t]);

  useEffect(() => {
    if (!open) {
      clearPrepareTimeout();
      clearExecutionTimeout();
      stopFrameSending();
      stopCamera();
      closeSocket();
      resetState();
    }
  }, [open, clearExecutionTimeout, clearPrepareTimeout, stopFrameSending, stopCamera, closeSocket, resetState]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.75);
  }, []);

  const captureFrameBlob = useCallback(() => (
    new Promise<Blob | null>((resolve) => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
        resolve(null);
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = FRAME_WIDTH;
      canvas.height = FRAME_HEIGHT;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.62);
    })
  ), []);

  const captureSnapshotFile = useCallback(() => {
    const frame = captureFrame();
    if (!frame) return null;
    const [meta, base64] = frame.split(',');
    if (!meta || !base64) return null;
    const mime = /data:(.*?);base64/.exec(meta)?.[1] || 'image/jpeg';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new File([bytes], `liveness-${Date.now()}.jpg`, { type: mime });
  }, [captureFrame]);

  const startFrameSending = useCallback(() => {
    stopFrameSending();
    sendIntervalRef.current = window.setInterval(async () => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      if (isSendingFrameRef.current) return;
      isSendingFrameRef.current = true;
      try {
        const frame = await captureFrameBlob();
        if (frame && ws.readyState === WebSocket.OPEN) {
          ws.send(frame);
        }
      } finally {
        isSendingFrameRef.current = false;
      }
    }, FRAME_INTERVAL_MS);
  }, [captureFrameBlob, stopFrameSending]);

  const prepareChallenge = useCallback((instruction?: string) => {
    clearPrepareTimeout();
    clearExecutionTimeout();
    stopFrameSending();
    activeChallengeRef.current += 1;
    const challengeId = activeChallengeRef.current;
    const action = mapInstruction(instruction, t);
    setStep('ready');
    setPreparingAction(true);
    setChallengeText(t('kyc.livenessPrepareAction', { action }));
    prepareTimeoutRef.current = window.setTimeout(() => {
      if (activeChallengeRef.current !== challengeId) return;
      setPreparingAction(false);
      setChallengeText(t('kyc.livenessNowAction', { action }));
      startFrameSending();
      executionTimeoutRef.current = window.setTimeout(() => {
        if (activeChallengeRef.current !== challengeId) return;
        stopFrameSending();
        closeSocket();
        setErrors([t('kyc.livenessActionTimeout')]);
        setStep('failed');
        setAttempts((value) => value + 1);
      }, ACTION_EXECUTION_MS);
    }, ACTION_PREPARE_MS);
  }, [clearExecutionTimeout, clearPrepareTimeout, closeSocket, setPreparingAction, startFrameSending, stopFrameSending, t]);

  const handleServerMessage = useCallback((data: any) => {
    if (data.type === 'liveness_started') {
      setStep('ready');
      setProgress(10);
      prepareChallenge(data.current_challenge?.instruction);
      return;
    }

    if (data.type === 'challenge_feedback') {
      setStep('ready');
      if (!isPreparingActionRef.current) {
        setChallengeText(mapInstruction(data.message, t));
      }
      return;
    }

    if (data.type === 'challenge_completed') {
      const completed = Number(data.progress?.completed_challenges || 0);
      const total = Number(data.progress?.total_challenges || 1);
      setProgress(Math.max(15, Math.min(95, Math.round((completed / total) * 100))));
      prepareChallenge(data.next_challenge?.instruction || data.message);
      return;
    }

    if (data.type === 'liveness_completed') {
      clearPrepareTimeout();
      clearExecutionTimeout();
      setProgress(100);
      setStep('success');
      const snapshotFile = captureSnapshotFile();
      stopFrameSending();
      stopCamera();
      closeSocket();
      const result: LivenessResult = {
        is_live: Boolean(data.is_live ?? data.result?.is_live ?? true),
        blink_valid: Boolean(data.blink_valid ?? data.result?.blink_valid ?? true),
        blinks_detected: Boolean(data.blinks_detected ?? data.result?.blinks_detected ?? true),
        head_movement: Boolean(data.head_movement ?? data.result?.head_movement ?? true),
        smile_detected: Boolean(data.smile_detected ?? data.result?.smile_detected ?? true),
        error: null,
        snapshotFile,
      };
      setTimeout(() => {
        onSuccess(result);
        onOpenChange(false);
      }, 900);
      return;
    }

    if (data.type === 'challenge_failed' || data.type === 'liveness_failed' || data.type === 'liveness_error' || data.status === 'error') {
      clearPrepareTimeout();
      clearExecutionTimeout();
      setErrors([data.message || t('kyc.livenessFailed')]);
      setStep('failed');
      stopFrameSending();
      stopCamera();
      closeSocket();
      setAttempts((value) => value + 1);
    }
  }, [captureSnapshotFile, clearExecutionTimeout, clearPrepareTimeout, closeSocket, onOpenChange, onSuccess, prepareChallenge, stopCamera, stopFrameSending, t]);

  useEffect(() => {
    handleServerMessageRef.current = handleServerMessage;
  }, [handleServerMessage]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play();
      }
      setCameraReady(true);
      setStep('connecting');
      setErrors([]);

      const ws = new WebSocket(buildWsUrl(accessToken));
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        ws.send(JSON.stringify({ type: 'start_liveness' }));
      };

      ws.onmessage = (event) => {
        try {
          handleServerMessageRef.current(JSON.parse(event.data));
        } catch {
          clearPrepareTimeout();
          clearExecutionTimeout();
          setErrors([t('kyc.livenessInvalidServerResponse')]);
          setStep('failed');
        }
      };

      ws.onerror = () => {
        clearPrepareTimeout();
        clearExecutionTimeout();
        setErrors([t('kyc.livenessConnectionUnavailable')]);
        setStep('failed');
        stopFrameSending();
        stopCamera();
        closeSocket();
      };

      ws.onclose = () => {
        setConnected(false);
      };
    } catch (error) {
      const message = (error as Error)?.message || t('kyc.livenessCameraDenied');
      toast.error(`Camera: ${message}`);
      setErrors([t('kyc.livenessCameraHelp')]);
      setStep('failed');
    }
  }, [accessToken, clearExecutionTimeout, clearPrepareTimeout, closeSocket, stopCamera, stopFrameSending, t]);

  const retry = () => {
    if (attempts >= MAX_ATTEMPTS) {
      toast.error(t('kyc.livenessMaxAttemptsReached'));
      onOpenChange(false);
      return;
    }
    clearPrepareTimeout();
    clearExecutionTimeout();
    stopFrameSending();
    stopCamera();
    closeSocket();
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-display text-xl">{t('kyc.liveness')}</DialogTitle>
          <DialogDescription>
            {t('kyc.livenessDialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6">
          <div className="relative aspect-video overflow-hidden rounded-xl border-2 border-border bg-muted">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full scale-x-[-1] object-cover"
              aria-label="Camera preview"
            />

            <AnimatePresence>
              {step === 'idle' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
                >
                  <Camera className="mb-3 h-12 w-12 text-primary" />
                  <p className="font-display font-semibold">{t('kyc.livenessReadyTitle')}</p>
                  <p className="mb-4 max-w-xs px-4 text-center text-sm text-muted-foreground">
                    {t('kyc.livenessReadyBody')}
                  </p>
                  <Button onClick={startCamera} className="bg-gradient-brand shadow-brand">
                    <Camera className="mr-2 h-4 w-4" /> {t('kyc.livenessStart')}
                  </Button>
                </motion.div>
              )}

              {(step === 'connecting' || step === 'processing') && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
                >
                  <Loader2 className="mb-3 h-10 w-10 animate-spin text-primary" />
                  <p className="font-medium">
                    {connected ? t('kyc.livenessPreparingChallenges') : t('kyc.livenessConnecting')}
                  </p>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-success/15 backdrop-blur-sm"
                >
                  <CheckCircle2 className="mb-2 h-16 w-16 text-success" />
                  <p className="font-display text-lg font-bold text-success">{t('kyc.livenessSuccess')}</p>
                </motion.div>
              )}

              {step === 'failed' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 p-4 backdrop-blur-sm"
                >
                  <XCircle className="mb-2 h-12 w-12 text-destructive" />
                  <p className="mb-2 font-semibold text-destructive">{t('kyc.livenessFailed')}</p>
                  <ul className="mb-3 space-y-0.5 text-center text-sm">
                    {errors.map((error, index) => (
                      <li key={index} className="text-muted-foreground">- {error}</li>
                    ))}
                  </ul>
                  {attempts < MAX_ATTEMPTS ? (
                    <Button onClick={retry} variant="outline" size="sm">
                      <RefreshCw className="mr-2 h-3.5 w-3.5" /> {t('kyc.livenessRetryRemaining', { count: MAX_ATTEMPTS - attempts })}
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">{t('kyc.livenessAttemptsExhausted')}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {(step === 'ready' || step === 'processing') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-3 right-3 top-3 rounded-xl border border-border bg-background/85 px-4 py-2.5 shadow-lg backdrop-blur"
              >
                <p className="text-sm font-semibold">{challengeText}</p>
                <p className="text-xs text-muted-foreground">
                  {cameraReady
                    ? isPreparingAction
                      ? t('kyc.livenessPrepareBody')
                      : t('kyc.livenessFollowServerChallenge')
                    : t('kyc.livenessCameraInitializing')}
                </p>
              </motion.div>
            )}
          </div>

          {(step === 'ready' || step === 'processing' || step === 'success') && (
            <Progress value={progress} className="h-1.5" />
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
};
