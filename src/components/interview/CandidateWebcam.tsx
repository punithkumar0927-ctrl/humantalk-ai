 import { useEffect, useRef, useState } from "react";
 import { Eye, EyeOff, AlertTriangle, Smile, Frown, Meh } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface CandidateWebcamProps {
   stream: MediaStream | null;
   isListening: boolean;
   faceDetected: boolean;
   lookingAtScreen: boolean;
   eyesOpen: boolean;
   dominantExpression: string;
   className?: string;
 }
 
 const expressionIcons: Record<string, React.ReactNode> = {
   happy: <Smile className="w-3 h-3" />,
   sad: <Frown className="w-3 h-3" />,
   neutral: <Meh className="w-3 h-3" />,
   angry: <Frown className="w-3 h-3" />,
   fearful: <AlertTriangle className="w-3 h-3" />,
   disgusted: <Frown className="w-3 h-3" />,
   surprised: <AlertTriangle className="w-3 h-3" />,
 };
 
 const CandidateWebcam = ({
   stream,
   isListening,
   faceDetected,
   lookingAtScreen,
   eyesOpen,
   dominantExpression,
   className,
 }: CandidateWebcamProps) => {
   const videoRef = useRef<HTMLVideoElement>(null);
   const [isVideoReady, setIsVideoReady] = useState(false);
 
   useEffect(() => {
     if (videoRef.current && stream) {
       videoRef.current.srcObject = stream;
       videoRef.current.onloadedmetadata = () => {
         setIsVideoReady(true);
       };
     }
   }, [stream]);
 
   const hasIssue = !faceDetected || !lookingAtScreen || !eyesOpen;
 
   return (
     <div
       className={cn(
         "relative rounded-lg overflow-hidden border-2 transition-colors",
         hasIssue ? "border-warning" : "border-success/50",
         className
       )}
     >
       {/* Live video feed */}
       {stream ? (
         <video
           ref={videoRef}
           autoPlay
           playsInline
           muted
           className={cn(
             "w-full h-full object-cover transform scale-x-[-1]",
             !isVideoReady && "opacity-0"
           )}
         />
       ) : (
         <div className="w-full h-full bg-muted flex items-center justify-center">
           <div className="text-center">
             <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto">
               <span className="text-xs font-semibold">You</span>
             </div>
           </div>
         </div>
       )}
 
       {/* Overlay indicators */}
       <div className="absolute inset-0 pointer-events-none">
         {/* Top status bar */}
         <div className="absolute top-1 left-1 right-1 flex items-center justify-between">
           {/* Expression indicator */}
           <div
             className={cn(
               "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium",
               dominantExpression === "happy" 
                 ? "bg-success/80 text-success-foreground"
                 : dominantExpression === "neutral"
                 ? "bg-muted/80 text-foreground"
                 : "bg-warning/80 text-warning-foreground"
             )}
           >
             {expressionIcons[dominantExpression] || <Meh className="w-3 h-3" />}
             <span className="capitalize">{dominantExpression}</span>
           </div>
 
           {/* Eye tracking indicator */}
           <div
             className={cn(
               "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium",
               lookingAtScreen && eyesOpen
                 ? "bg-success/80 text-success-foreground"
                 : "bg-warning/80 text-warning-foreground"
             )}
           >
             {lookingAtScreen && eyesOpen ? (
               <Eye className="w-3 h-3" />
             ) : (
               <EyeOff className="w-3 h-3" />
             )}
           </div>
         </div>
 
         {/* Bottom listening indicator */}
         {isListening && (
           <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
             <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/90 text-success-foreground text-[9px] font-medium">
               <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
               Listening
             </div>
           </div>
         )}
 
         {/* Warning overlay for issues */}
         {hasIssue && (
           <div className="absolute inset-0 bg-warning/10 flex items-center justify-center">
             {!faceDetected && (
               <div className="bg-warning/90 text-warning-foreground text-[10px] font-medium px-2 py-1 rounded">
                 Face not detected
               </div>
             )}
           </div>
         )}
       </div>
     </div>
   );
 };
 
 export default CandidateWebcam;