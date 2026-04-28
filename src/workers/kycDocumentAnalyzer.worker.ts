type DocumentKind = 'passport' | 'nationalId' | 'drivingLicense' | 'unknown';

type AnalyzerRequest = {
  type: 'analyze';
  payload: {
    width: number;
    height: number;
    pixels: ArrayBuffer;
    documentKind: DocumentKind;
  };
};

type AnalyzerResponse = {
  type: 'result';
  payload: {
    bbox: { x: number; y: number; width: number; height: number } | null;
    brightness: number;
    sharpness: number;
    areaRatio: number;
    centered: boolean;
    withinFrame: boolean;
    hasDocument: boolean;
    frameCoverage: number;
    mrzConfidence: number;
    orientationHint: 'landscape' | 'portrait' | 'unknown';
  };
};

const FRAME_RATIO = {
  x: 0.1,
  y: 0.1,
  w: 0.8,
  h: 0.8,
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

self.onmessage = (event: MessageEvent<AnalyzerRequest>) => {
  if (event.data?.type !== 'analyze') return;

  const { width, height, pixels, documentKind } = event.data.payload;
  const data = new Uint8ClampedArray(pixels);
  const frameX = Math.floor(width * FRAME_RATIO.x);
  const frameY = Math.floor(height * FRAME_RATIO.y);
  const frameW = Math.floor(width * FRAME_RATIO.w);
  const frameH = Math.floor(height * FRAME_RATIO.h);

  let luminanceSum = 0;
  let sampleCount = 0;
  let sharpnessSum = 0;
  let edgeCount = 0;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let bottomTextBands = 0;
  let bottomBandSamples = 0;

  for (let y = frameY + 1; y < frameY + frameH - 1; y += 2) {
    for (let x = frameX + 1; x < frameX + frameW - 1; x += 2) {
      const index = (y * width + x) * 4;
      const rightIndex = index + 4;
      const downIndex = index + width * 4;
      const l = (data[index] + data[index + 1] + data[index + 2]) / 3;
      const lr = (data[rightIndex] + data[rightIndex + 1] + data[rightIndex + 2]) / 3;
      const ld = (data[downIndex] + data[downIndex + 1] + data[downIndex + 2]) / 3;
      const grad = Math.abs(l - lr) + Math.abs(l - ld);

      luminanceSum += l;
      sharpnessSum += grad;
      sampleCount += 1;

      if (grad > 38) {
        edgeCount += 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }

      if (documentKind === 'passport' && y > frameY + frameH * 0.62) {
        bottomBandSamples += 1;
        if (grad > 42 && l < 170) bottomTextBands += 1;
      }
    }
  }

  const brightness = luminanceSum / Math.max(sampleCount, 1);
  const sharpness = sharpnessSum / Math.max(sampleCount, 1);
  const bboxWidth = Math.max(0, maxX - minX);
  const bboxHeight = Math.max(0, maxY - minY);
  const hasDocument = edgeCount > 130 && bboxWidth > frameW * 0.18 && bboxHeight > frameH * 0.18;
  const bbox = hasDocument ? { x: minX, y: minY, width: bboxWidth, height: bboxHeight } : null;

  const bboxArea = bboxWidth * bboxHeight;
  const frameArea = frameW * frameH;
  const areaRatio = hasDocument ? bboxArea / Math.max(frameArea, 1) : 0;
  const withinFrame = hasDocument
    ? minX >= frameX - 6 &&
      minY >= frameY - 6 &&
      maxX <= frameX + frameW + 6 &&
      maxY <= frameY + frameH + 6
    : false;
  const centerX = hasDocument ? minX + bboxWidth / 2 : 0;
  const centerY = hasDocument ? minY + bboxHeight / 2 : 0;
  const centered = hasDocument
    ? Math.abs(centerX - (frameX + frameW / 2)) <= frameW * 0.14 &&
      Math.abs(centerY - (frameY + frameH / 2)) <= frameH * 0.14
    : false;

  const mrzConfidence = documentKind === 'passport'
    ? clamp((bottomTextBands / Math.max(bottomBandSamples, 1)) * 6.5, 0, 1)
    : 0;

  let orientationHint: 'landscape' | 'portrait' | 'unknown' = 'unknown';
  if (bbox && bbox.width > bbox.height * 1.15) orientationHint = 'landscape';
  else if (bbox && bbox.height > bbox.width * 1.1) orientationHint = 'portrait';

  const response: AnalyzerResponse = {
    type: 'result',
    payload: {
      bbox,
      brightness,
      sharpness,
      areaRatio,
      centered,
      withinFrame,
      hasDocument,
      frameCoverage: clamp(areaRatio, 0, 1),
      mrzConfidence,
      orientationHint,
    },
  };

  self.postMessage(response);
};
