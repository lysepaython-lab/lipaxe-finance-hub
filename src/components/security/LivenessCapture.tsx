import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, Eye, Loader2, MessageCircle, RefreshCw, Smile, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { FaceMesh, VERSION as FACE_MESH_VERSION, type NormalizedLandmarkList } from '@mediapipe/face_mesh';
import { API_URL } from '@/store/api/baseApi';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';

type Step = 'idle' | 'connecting' | 'ready' | 'processing' | 'success' | 'failed';
type LivenessAction = 'blink' | 'smile' | 'mouth' | 'left' | 'right' | 'fallback';

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
const FRAME_INTERVAL_MS = 180;
const FRAME_WIDTH = 640;
const FRAME_HEIGHT = 480;
const CHALLENGE_TIMEOUT_SECONDS = 45;

interface FaceMeshQuality {
  ok: boolean;
  messageKey: string;
  crop?: { x: number; y: number; width: number; height: number };
}

const buildWsUrl = (token?: string | null) => {
  const base = API_URL.replace(/^http/, 'ws').replace(/\/+$/, '');
  const query = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${base}/ws/liveness/${query}`;
};

const getActionFromInstruction = (instruction: string | undefined): LivenessAction => {
  const raw = (instruction || '').toLowerCase();
  if (raw.includes('blink') || raw.includes('clign')) return 'blink';
  if (raw.includes('smile') || raw.includes('souri')) return 'smile';
  if (raw.includes('mouth') || raw.includes('bouche')) return 'mouth';
  if (raw.includes('left') || raw.includes('gauche')) return 'left';
  if (raw.includes('right') || raw.includes('droite')) return 'right';
  return 'fallback';
};

const mapInstruction = (instruction: string | undefined, t: (key: string, options?: Record<string, unknown>) => string) => {
  const action = getActionFromInstruction(instruction);
  if (action === 'blink') return t('kyc.livenessActionBlink');
  if (action === 'smile') return t('kyc.livenessActionSmile');
  if (action === 'mouth') return t('kyc.livenessActionMouth');
  if (action === 'left') return t('kyc.livenessActionLeft');
  if (action === 'right') return t('kyc.livenessActionRight');
  return instruction || t('kyc.livenessActionFallback');
};

const LivenessActionIcon = ({ action, preparing }: { action: LivenessAction; preparing: boolean }) => {
  const Icon = action === 'blink'
    ? Eye
    : action === 'smile'
      ? Smile
      : action === 'mouth'
        ? MessageCircle
        : action === 'left'
          ? ArrowLeft
          : action === 'right'
            ? ArrowRight
            : Camera;

  return (
    <motion.div
      key={action}
      initial={{ opacity: 0, scale: 0.86, y: -4 }}
      animate={{ opacity: 1, scale: preparing ? 0.95 : 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/12 text-primary shadow-sm"
    >
      <Icon className={cn('h-6 w-6', !preparing && 'animate-pulse')} />
    </motion.div>
  );
};

const assessFaceMesh = (landmarks?: NormalizedLandmarkList): FaceMeshQuality => {
  if (!landmarks?.length) {
    return { ok: false, messageKey: 'kyc.livenessFaceMeshNoFace' };
  }

  const xs = landmarks.map((point) => point.x);
  const ys = landmarks.map((point) => point.y);
  const minX = Math.max(0, Math.min(...xs));
  const maxX = Math.min(1, Math.max(...xs));
  const minY = Math.max(0, Math.min(...ys));
  const maxY = Math.min(1, Math.max(...ys));
  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;

  if (width < 0.16 || height < 0.2) {
    return { ok: false, messageKey: 'kyc.livenessFaceMeshTooFar' };
  }

  if (width > 0.86 || height > 0.92) {
    return { ok: false, messageKey: 'kyc.livenessFaceMeshTooClose' };
  }

  if (Math.abs(centerX - 0.5) > 0.24 || Math.abs(centerY - 0.5) > 0.24) {
    return { ok: false, messageKey: 'kyc.livenessFaceMeshCenterFace' };
  }

  const paddingX = width * 0.45;
  const paddingY = height * 0.65;
  const cropX = Math.max(0, minX - paddingX);
  const cropY = Math.max(0, minY - paddingY);
  const cropRight = Math.min(1, maxX + paddingX);
  const cropBottom = Math.min(1, maxY + paddingY);

  return {
    ok: true,
    messageKey: 'kyc.livenessFaceMeshReady',
    crop: {
      x: cropX,
      y: cropY,
      width: cropRight - cropX,
      height: cropBottom - cropY,
    },
  };
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
  const challengeCountdownRef = useRef<number | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const faceMeshResultResolverRef = useRef<((quality: FaceMeshQuality) => void) | null>(null);
  const faceMeshInFlightRef = useRef(false);
  const latestFaceQualityRef = useRef<FaceMeshQuality>({ ok: false, messageKey: 'kyc.livenessFaceMeshLoading' });
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
  const [faceMeshMessageKey, setFaceMeshMessageKey] = useState('kyc.livenessFaceMeshLoading');
  const [currentAction, setCurrentAction] = useState<LivenessAction>('fallback');
  const [challengeSecondsRemaining, setChallengeSecondsRemaining] = useState(CHALLENGE_TIMEOUT_SECONDS);

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

  const clearChallengeCountdown = useCallback(() => {
    if (challengeCountdownRef.current) {
      window.clearInterval(challengeCountdownRef.current);
      challengeCountdownRef.current = null;
    }
  }, []);

  const startChallengeCountdown = useCallback((seconds = CHALLENGE_TIMEOUT_SECONDS) => {
    clearChallengeCountdown();
    setChallengeSecondsRemaining(seconds);
    challengeCountdownRef.current = window.setInterval(() => {
      setChallengeSecondsRemaining((current) => {
        if (current <= 1) {
          clearChallengeCountdown();
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }, [clearChallengeCountdown]);

  const closeFaceMesh = useCallback(() => {
    faceMeshResultResolverRef.current = null;
    faceMeshInFlightRef.current = false;
    latestFaceQualityRef.current = { ok: false, messageKey: 'kyc.livenessFaceMeshLoading' };
    void faceMeshRef.current?.close();
    faceMeshRef.current = null;
    setFaceMeshMessageKey('kyc.livenessFaceMeshLoading');
  }, []);

  const ensureFaceMesh = useCallback(async () => {
    if (faceMeshRef.current) return true;
    try {
      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${FACE_MESH_VERSION}/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        selfieMode: true,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.55,
      });
      faceMesh.onResults((results) => {
        const faces = results.multiFaceLandmarks || [];
        const quality = faces.length === 1
          ? assessFaceMesh(faces[0])
          : { ok: false, messageKey: faces.length > 1 ? 'kyc.livenessFaceMeshMultipleFaces' : 'kyc.livenessFaceMeshNoFace' };
        latestFaceQualityRef.current = quality;
        setFaceMeshMessageKey(quality.messageKey);
        faceMeshResultResolverRef.current?.(quality);
        faceMeshResultResolverRef.current = null;
        faceMeshInFlightRef.current = false;
      });
      await faceMesh.initialize();
      faceMeshRef.current = faceMesh;
      setFaceMeshMessageKey('kyc.livenessFaceMeshReady');
      return true;
    } catch {
      latestFaceQualityRef.current = { ok: true, messageKey: 'kyc.livenessFaceMeshUnavailable' };
      setFaceMeshMessageKey('kyc.livenessFaceMeshUnavailable');
      return false;
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
    setCurrentAction('fallback');
    setProgress(0);
    setConnected(false);
    setCameraReady(false);
    setPreparingAction(false);
  }, [setPreparingAction, t]);

  useEffect(() => {
    if (!open) {
      clearPrepareTimeout();
      clearExecutionTimeout();
      clearChallengeCountdown();
      stopFrameSending();
      stopCamera();
      closeSocket();
      closeFaceMesh();
      resetState();
    }
  }, [open, clearChallengeCountdown, clearExecutionTimeout, clearPrepareTimeout, stopFrameSending, stopCamera, closeSocket, closeFaceMesh, resetState]);

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

  const analyzeFaceMeshFrame = useCallback(async () => {
    const video = videoRef.current;
    const faceMesh = faceMeshRef.current;
    if (!video || !faceMesh || video.readyState < 2 || faceMeshInFlightRef.current) {
      return latestFaceQualityRef.current;
    }

    faceMeshInFlightRef.current = true;
    return new Promise<FaceMeshQuality>((resolve) => {
      faceMeshResultResolverRef.current = resolve;
      window.setTimeout(() => {
        if (faceMeshResultResolverRef.current === resolve) {
          faceMeshResultResolverRef.current = null;
          faceMeshInFlightRef.current = false;
          const timeoutQuality = { ok: false, messageKey: 'kyc.livenessFaceMeshLoading' };
          latestFaceQualityRef.current = timeoutQuality;
          resolve(timeoutQuality);
        }
      }, 900);
      faceMesh.send({ image: video }).catch(() => {
        faceMeshResultResolverRef.current = null;
        faceMeshInFlightRef.current = false;
        const errorQuality = { ok: false, messageKey: 'kyc.livenessFaceMeshUnavailable' };
        latestFaceQualityRef.current = errorQuality;
        setFaceMeshMessageKey(errorQuality.messageKey);
        resolve(errorQuality);
      });
    });
  }, []);

  const captureFrameBlob = useCallback((quality?: FaceMeshQuality) => (
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
      if (quality?.crop) {
        const sourceX = quality.crop.x * video.videoWidth;
        const sourceY = quality.crop.y * video.videoHeight;
        const sourceWidth = quality.crop.width * video.videoWidth;
        const sourceHeight = quality.crop.height * video.videoHeight;
        ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.75);
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
        const quality = await analyzeFaceMeshFrame();
        if (!quality.ok) {
          setChallengeText(t(quality.messageKey));
        }
        const frame = await captureFrameBlob(quality);
        if (frame && ws.readyState === WebSocket.OPEN) {
          ws.send(frame);
        }
      } finally {
        isSendingFrameRef.current = false;
      }
    }, FRAME_INTERVAL_MS);
  }, [analyzeFaceMeshFrame, captureFrameBlob, stopFrameSending, t]);

  const prepareChallenge = useCallback((instruction?: string) => {
    clearPrepareTimeout();
    clearExecutionTimeout();
    startChallengeCountdown();
    stopFrameSending();
    activeChallengeRef.current += 1;
    const challengeId = activeChallengeRef.current;
    const actionKey = getActionFromInstruction(instruction);
    const action = mapInstruction(instruction, t);
    setCurrentAction(actionKey);
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
        setChallengeText(t('kyc.livenessKeepTrying', { action }));
      }, ACTION_EXECUTION_MS);
    }, ACTION_PREPARE_MS);
  }, [clearExecutionTimeout, clearPrepareTimeout, closeSocket, setPreparingAction, startChallengeCountdown, startFrameSending, stopFrameSending, t]);

  const handleServerMessage = useCallback((data: any) => {
    if (data.type === 'liveness_started') {
      setStep('ready');
      setProgress(10);
      prepareChallenge(data.current_challenge?.instruction);
      return;
    }

    if (data.type === 'challenge_feedback') {
      setStep('ready');
      setCurrentAction(getActionFromInstruction(data.challenge?.instruction || data.message));
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
      clearChallengeCountdown();
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
      clearChallengeCountdown();
      setErrors([data.message || t('kyc.livenessFailed')]);
      setStep('failed');
      stopFrameSending();
      stopCamera();
      closeSocket();
      setAttempts((value) => value + 1);
    }
  }, [captureSnapshotFile, clearChallengeCountdown, clearExecutionTimeout, clearPrepareTimeout, closeSocket, onOpenChange, onSuccess, prepareChallenge, stopCamera, stopFrameSending, t]);

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
      await ensureFaceMesh();
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
          clearChallengeCountdown();
          setErrors([t('kyc.livenessInvalidServerResponse')]);
          setStep('failed');
        }
      };

      ws.onerror = () => {
        clearPrepareTimeout();
        clearExecutionTimeout();
        clearChallengeCountdown();
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
  }, [accessToken, clearChallengeCountdown, clearExecutionTimeout, clearPrepareTimeout, closeSocket, ensureFaceMesh, stopCamera, stopFrameSending, t]);

  const retry = () => {
    if (attempts >= MAX_ATTEMPTS) {
      toast.error(t('kyc.livenessMaxAttemptsReached'));
      onOpenChange(false);
      return;
    }
    clearPrepareTimeout();
    clearExecutionTimeout();
    clearChallengeCountdown();
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
                className="absolute left-3 right-3 top-3 flex items-center gap-3 rounded-xl border border-border bg-background/85 px-4 py-2.5 shadow-lg backdrop-blur"
              >
                <LivenessActionIcon action={currentAction} preparing={isPreparingAction} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{challengeText}</p>
                  <p className="text-xs text-muted-foreground">
                    {cameraReady
                      ? isPreparingAction
                        ? t('kyc.livenessPrepareBody')
                        : t('kyc.livenessFollowServerChallenge')
                      : t('kyc.livenessCameraInitializing')}
                  </p>
                  {cameraReady && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t(faceMeshMessageKey)}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {(step === 'ready' || step === 'processing' || step === 'success') && (
            <div className="flex items-center gap-3">
              <Progress value={progress} className="h-1.5 flex-1" />
              {step !== 'success' && (
                <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                  {challengeSecondsRemaining}s
                </span>
              )}
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
};
