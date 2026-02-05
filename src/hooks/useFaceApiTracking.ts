 import { useCallback, useEffect, useRef, useState } from "react";
 import * as faceapi from "face-api.js";
 
 interface FaceExpression {
   neutral: number;
   happy: number;
   sad: number;
   angry: number;
   fearful: number;
   disgusted: number;
   surprised: number;
 }
 
 interface EyePosition {
   leftEye: { x: number; y: number };
   rightEye: { x: number; y: number };
 }
 
 interface GazeEvent {
   timestamp: Date;
   type: "gaze_deviation" | "face_not_detected" | "multiple_faces" | "eyes_closed" | "looking_away" | "suspicious_expression";
   duration?: number;
   details?: string;
   expression?: string;
 }
 
 interface UseFaceApiTrackingOptions {
   onGazeDeviation?: (event: GazeEvent) => void;
   checkInterval?: number;
   modelsPath?: string;
 }
 
 interface FaceTrackingState {
   isTracking: boolean;
   isModelLoaded: boolean;
   faceDetected: boolean;
   multipleFaces: boolean;
   gazeDeviationCount: number;
   lastGazeEvent: GazeEvent | null;
   gazeEvents: GazeEvent[];
   currentExpression: FaceExpression | null;
   dominantExpression: string;
   eyePosition: EyePosition | null;
   lookingAtScreen: boolean;
   eyesOpen: boolean;
 }
 
 export const useFaceApiTracking = (options: UseFaceApiTrackingOptions = {}) => {
   const {
     onGazeDeviation,
     checkInterval = 500,
     modelsPath = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/",
   } = options;
 
   const [state, setState] = useState<FaceTrackingState>({
     isTracking: false,
     isModelLoaded: false,
     faceDetected: true,
     multipleFaces: false,
     gazeDeviationCount: 0,
     lastGazeEvent: null,
     gazeEvents: [],
     currentExpression: null,
     dominantExpression: "neutral",
     eyePosition: null,
     lookingAtScreen: true,
     eyesOpen: true,
   });
 
   const videoRef = useRef<HTMLVideoElement | null>(null);
   const canvasRef = useRef<HTMLCanvasElement | null>(null);
   const streamRef = useRef<MediaStream | null>(null);
   const intervalRef = useRef<NodeJS.Timeout | null>(null);
   const lastEyePositionRef = useRef<EyePosition | null>(null);
   const faceNotDetectedStartRef = useRef<number | null>(null);
   const eyesClosedStartRef = useRef<number | null>(null);
   const lookingAwayStartRef = useRef<number | null>(null);
 
   const addGazeEvent = useCallback((event: GazeEvent) => {
     setState((prev) => ({
       ...prev,
       gazeEvents: [...prev.gazeEvents, event],
       gazeDeviationCount:
         event.type === "gaze_deviation" || event.type === "looking_away"
           ? prev.gazeDeviationCount + 1
           : prev.gazeDeviationCount,
       lastGazeEvent: event,
     }));
     onGazeDeviation?.(event);
   }, [onGazeDeviation]);
 
   // Load face-api.js models
   const loadModels = useCallback(async () => {
     try {
       await Promise.all([
         faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath),
         faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelsPath),
         faceapi.nets.faceExpressionNet.loadFromUri(modelsPath),
       ]);
       setState((prev) => ({ ...prev, isModelLoaded: true }));
       console.log("Face-api models loaded successfully");
       return true;
     } catch (error) {
       console.error("Failed to load face-api models:", error);
       return false;
     }
   }, [modelsPath]);
 
   // Calculate eye aspect ratio to detect blinks/closed eyes
   const getEyeAspectRatio = (landmarks: faceapi.FaceLandmarks68) => {
     const leftEye = landmarks.getLeftEye();
     const rightEye = landmarks.getRightEye();
 
     const calculateEAR = (eye: faceapi.Point[]) => {
       const vertical1 = Math.sqrt(
         Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2)
       );
       const vertical2 = Math.sqrt(
         Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2)
       );
       const horizontal = Math.sqrt(
         Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2)
       );
       return (vertical1 + vertical2) / (2 * horizontal);
     };
 
     const leftEAR = calculateEAR(leftEye);
     const rightEAR = calculateEAR(rightEye);
     return (leftEAR + rightEAR) / 2;
   };
 
   // Get eye center positions
   const getEyePositions = (landmarks: faceapi.FaceLandmarks68): EyePosition => {
     const leftEye = landmarks.getLeftEye();
     const rightEye = landmarks.getRightEye();
 
     const getCenter = (points: faceapi.Point[]) => ({
       x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
       y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
     });
 
     return {
       leftEye: getCenter(leftEye),
       rightEye: getCenter(rightEye),
     };
   };
 
   // Check if user is looking at the screen (based on face position)
   const isLookingAtScreen = (detection: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>, videoWidth: number, videoHeight: number) => {
     const box = detection.detection.box;
     const faceCenterX = box.x + box.width / 2;
     const faceCenterY = box.y + box.height / 2;
 
     // Check if face is reasonably centered (within 35% of center)
     const centerToleranceX = videoWidth * 0.35;
     const centerToleranceY = videoHeight * 0.35;
 
     const isHorizontallyCentered = Math.abs(faceCenterX - videoWidth / 2) < centerToleranceX;
     const isVerticallyCentered = Math.abs(faceCenterY - videoHeight / 2) < centerToleranceY;
 
     return isHorizontallyCentered && isVerticallyCentered;
   };
 
   // Detect faces and analyze
   const detectFace = useCallback(async () => {
     if (!videoRef.current || !state.isModelLoaded) return;
 
     const video = videoRef.current;
     if (video.paused || video.ended || video.readyState < 2) return;
 
     try {
       const detections = await faceapi
         .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
         .withFaceLandmarks(true)
         .withFaceExpressions();
 
       // Handle no face detected
       if (detections.length === 0) {
         if (!faceNotDetectedStartRef.current) {
           faceNotDetectedStartRef.current = Date.now();
         } else if (Date.now() - faceNotDetectedStartRef.current > 2000) {
           addGazeEvent({
             timestamp: new Date(),
             type: "face_not_detected",
             duration: Date.now() - faceNotDetectedStartRef.current,
             details: "Face not visible in camera frame",
           });
           faceNotDetectedStartRef.current = Date.now();
         }
         setState((prev) => ({
           ...prev,
           faceDetected: false,
           multipleFaces: false,
           eyesOpen: true,
           lookingAtScreen: false,
         }));
         return;
       }
 
       faceNotDetectedStartRef.current = null;
 
       // Handle multiple faces
       if (detections.length > 1) {
         addGazeEvent({
           timestamp: new Date(),
           type: "multiple_faces",
           details: `${detections.length} faces detected - possible assistance`,
         });
         setState((prev) => ({
           ...prev,
           faceDetected: true,
           multipleFaces: true,
         }));
         return;
       }
 
       const detection = detections[0];
       const landmarks = detection.landmarks;
       const expressions = detection.expressions;
 
       // Analyze eye aspect ratio for blink/closed eyes detection
       const ear = getEyeAspectRatio(landmarks);
       const eyesOpen = ear > 0.2; // Threshold for eyes being open
 
       // Track prolonged eye closure
       if (!eyesOpen) {
         if (!eyesClosedStartRef.current) {
           eyesClosedStartRef.current = Date.now();
         } else if (Date.now() - eyesClosedStartRef.current > 3000) {
           addGazeEvent({
             timestamp: new Date(),
             type: "eyes_closed",
             duration: Date.now() - eyesClosedStartRef.current,
             details: "Eyes closed for extended period",
           });
           eyesClosedStartRef.current = Date.now();
         }
       } else {
         eyesClosedStartRef.current = null;
       }
 
       // Get eye positions
       const eyePosition = getEyePositions(landmarks);
 
       // Check if looking at screen
       const lookingAtScreen = isLookingAtScreen(detection, video.videoWidth, video.videoHeight);
 
       // Track looking away
       if (!lookingAtScreen) {
         if (!lookingAwayStartRef.current) {
           lookingAwayStartRef.current = Date.now();
         } else if (Date.now() - lookingAwayStartRef.current > 2000) {
           addGazeEvent({
             timestamp: new Date(),
             type: "looking_away",
             duration: Date.now() - lookingAwayStartRef.current,
             details: "Looking away from screen",
           });
           lookingAwayStartRef.current = Date.now();
         }
       } else {
         lookingAwayStartRef.current = null;
       }
 
       // Detect significant eye movement (possible reading)
       if (lastEyePositionRef.current) {
         const leftDiff = Math.sqrt(
           Math.pow(eyePosition.leftEye.x - lastEyePositionRef.current.leftEye.x, 2) +
           Math.pow(eyePosition.leftEye.y - lastEyePositionRef.current.leftEye.y, 2)
         );
         const rightDiff = Math.sqrt(
           Math.pow(eyePosition.rightEye.x - lastEyePositionRef.current.rightEye.x, 2) +
           Math.pow(eyePosition.rightEye.y - lastEyePositionRef.current.rightEye.y, 2)
         );
 
         // Rapid horizontal eye movement could indicate reading
         if (leftDiff > 30 || rightDiff > 30) {
           addGazeEvent({
             timestamp: new Date(),
             type: "gaze_deviation",
             details: "Significant eye movement detected",
           });
         }
       }
       lastEyePositionRef.current = eyePosition;
 
       // Get dominant expression
       const expressionData: FaceExpression = {
         neutral: expressions.neutral,
         happy: expressions.happy,
         sad: expressions.sad,
         angry: expressions.angry,
         fearful: expressions.fearful,
         disgusted: expressions.disgusted,
         surprised: expressions.surprised,
       };
 
       const dominantExpression = Object.entries(expressionData).reduce((a, b) =>
         a[1] > b[1] ? a : b
       )[0];
 
       // Flag suspicious expressions (fearful, surprised can indicate stress/cheating)
       if (expressions.fearful > 0.5 || expressions.surprised > 0.6) {
         addGazeEvent({
           timestamp: new Date(),
           type: "suspicious_expression",
           details: `High ${expressions.fearful > 0.5 ? "fear" : "surprise"} detected`,
           expression: dominantExpression,
         });
       }
 
       setState((prev) => ({
         ...prev,
         faceDetected: true,
         multipleFaces: false,
         currentExpression: expressionData,
         dominantExpression,
         eyePosition,
         lookingAtScreen,
         eyesOpen,
       }));
     } catch (error) {
       console.error("Face detection error:", error);
     }
   }, [state.isModelLoaded, addGazeEvent]);
 
   const startTracking = useCallback(async (existingStream?: MediaStream) => {
     try {
       // Load models first
       const modelsLoaded = await loadModels();
       if (!modelsLoaded) {
         console.error("Failed to load face detection models");
         return null;
       }
 
       // Use existing stream or get new one
       const stream = existingStream || await navigator.mediaDevices.getUserMedia({
         video: { facingMode: "user", width: 640, height: 480 },
       });
 
       streamRef.current = stream;
 
       // Create video element
       const video = document.createElement("video");
       video.srcObject = stream;
       video.autoplay = true;
       video.playsInline = true;
       video.muted = true;
       videoRef.current = video;
 
       await video.play();
 
       // Start detection interval
       intervalRef.current = setInterval(detectFace, checkInterval);
 
       setState((prev) => ({
         ...prev,
         isTracking: true,
       }));
 
       return stream;
     } catch (error) {
       console.error("Failed to start face tracking:", error);
       return null;
     }
   }, [checkInterval, detectFace, loadModels]);
 
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