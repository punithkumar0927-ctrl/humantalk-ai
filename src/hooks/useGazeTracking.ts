import { useCallback, useEffect, useRef, useState } from "react";

interface GazeEvent {
  timestamp: Date;
  type: "gaze_deviation" | "face_not_detected" | "multiple_faces";
  duration?: number;
  details?: string;
}

interface UseGazeTrackingOptions {
  onGazeDeviation?: (event: GazeEvent) => void;
  deviationThreshold?: number; // percentage of frame size
  checkInterval?: number; // ms between checks
}

interface GazeTrackingState {
  isTracking: boolean;
  faceDetected: boolean;
  gazeDeviationCount: number;
  lastGazeEvent: GazeEvent | null;
  gazeEvents: GazeEvent[];
}

export const useGazeTracking = (options: UseGazeTrackingOptions = {}) => {
  const {
    onGazeDeviation,
    deviationThreshold = 0.3,
    checkInterval = 500,
  } = options;

  const [state, setState] = useState<GazeTrackingState>({
    isTracking: false,
    faceDetected: true,
    gazeDeviationCount: 0,
    lastGazeEvent: null,
    gazeEvents: [],
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFacePositionRef = useRef<{ x: number; y: number } | null>(null);
  const faceNotDetectedStartRef = useRef<number | null>(null);

  const addGazeEvent = useCallback((event: GazeEvent) => {
    setState((prev) => ({
      ...prev,
      gazeEvents: [...prev.gazeEvents, event],
      gazeDeviationCount:
        event.type === "gaze_deviation"
          ? prev.gazeDeviationCount + 1
          : prev.gazeDeviationCount,
      lastGazeEvent: event,
    }));
    onGazeDeviation?.(event);
  }, [onGazeDeviation]);

  // Simple face detection using canvas analysis
  // In production, you'd use face-api.js or TensorFlow.js
  const detectFace = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw current video frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple skin tone detection (basic face detection proxy)
    // This is a simplified approach - production would use ML models
    let skinPixelCount = 0;
    let skinCenterX = 0;
    let skinCenterY = 0;

    const centerRegionX = canvas.width * 0.2;
    const centerRegionWidth = canvas.width * 0.6;
    const centerRegionY = canvas.height * 0.1;
    const centerRegionHeight = canvas.height * 0.6;

    for (let y = centerRegionY; y < centerRegionY + centerRegionHeight; y += 4) {
      for (let x = centerRegionX; x < centerRegionX + centerRegionWidth; x += 4) {
        const i = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Simple skin tone detection (works for various skin tones)
        const isSkinTone =
          r > 60 &&
          g > 40 &&
          b > 20 &&
          r > g &&
          r > b &&
          Math.abs(r - g) > 15 &&
          r - b > 15;

        if (isSkinTone) {
          skinPixelCount++;
          skinCenterX += x;
          skinCenterY += y;
        }
      }
    }

    // Determine if face is detected based on skin pixel count
    const expectedPixels = (centerRegionWidth * centerRegionHeight) / 16 * 0.15; // expect 15% skin pixels
    const faceDetected = skinPixelCount > expectedPixels * 0.3;

    if (faceDetected && skinPixelCount > 0) {
      const avgX = skinCenterX / skinPixelCount;
      const avgY = skinCenterY / skinPixelCount;

      // Check for gaze deviation (face moving significantly off-center)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const deviationX = Math.abs(avgX - centerX) / canvas.width;
      const deviationY = Math.abs(avgY - centerY) / canvas.height;

      if (deviationX > deviationThreshold || deviationY > deviationThreshold) {
        // Check if position changed significantly from last check
        if (lastFacePositionRef.current) {
          const positionChange = Math.sqrt(
            Math.pow(avgX - lastFacePositionRef.current.x, 2) +
            Math.pow(avgY - lastFacePositionRef.current.y, 2)
          );
          
          if (positionChange > canvas.width * 0.1) {
            addGazeEvent({
              timestamp: new Date(),
              type: "gaze_deviation",
              details: `Face moved ${deviationX > deviationThreshold ? "horizontally" : "vertically"} off-center`,
            });
          }
        }
      }

      lastFacePositionRef.current = { x: avgX, y: avgY };
      faceNotDetectedStartRef.current = null;

      setState((prev) => ({
        ...prev,
        faceDetected: true,
      }));
    } else {
      // Face not detected
      if (!faceNotDetectedStartRef.current) {
        faceNotDetectedStartRef.current = Date.now();
      } else if (Date.now() - faceNotDetectedStartRef.current > 2000) {
        // Face not detected for more than 2 seconds
        addGazeEvent({
          timestamp: new Date(),
          type: "face_not_detected",
          duration: Date.now() - faceNotDetectedStartRef.current,
          details: "Face not visible in camera frame",
        });
        faceNotDetectedStartRef.current = Date.now(); // Reset to avoid spamming
      }

      setState((prev) => ({
        ...prev,
        faceDetected: false,
      }));
    }
  }, [addGazeEvent, deviationThreshold]);

  const startTracking = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });

      streamRef.current = stream;

      // Create video element
      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      videoRef.current = video;

      // Create canvas for processing
      const canvas = document.createElement("canvas");
      canvasRef.current = canvas;

      await video.play();

      // Start detection interval
      intervalRef.current = setInterval(detectFace, checkInterval);

      setState((prev) => ({
        ...prev,
        isTracking: true,
      }));
    } catch (error) {
      console.error("Failed to start gaze tracking:", error);
    }
  }, [checkInterval, detectFace]);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isTracking: false,
    }));
  }, []);

  const resetEvents = useCallback(() => {
    setState((prev) => ({
      ...prev,
      gazeDeviationCount: 0,
      gazeEvents: [],
      lastGazeEvent: null,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    ...state,
    startTracking,
    stopTracking,
    resetEvents,
    videoRef,
  };
};
