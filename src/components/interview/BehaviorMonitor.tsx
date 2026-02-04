import { useEffect } from "react";
import { Eye, AlertTriangle, MonitorOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BehaviorMonitorProps {
  isActive: boolean;
  faceDetected: boolean;
  isVisible: boolean;
  gazeDeviationCount: number;
  tabSwitchCount: number;
  className?: string;
}

const BehaviorMonitor = ({
  isActive,
  faceDetected,
  isVisible,
  gazeDeviationCount,
  tabSwitchCount,
  className,
}: BehaviorMonitorProps) => {
  // Show warnings for behavioral issues
  useEffect(() => {
    if (!isActive) return;

    if (!faceDetected) {
      toast.warning("Please ensure your face is visible in the camera", {
        id: "face-warning",
        duration: 3000,
      });
    }
  }, [faceDetected, isActive]);

  useEffect(() => {
    if (!isActive) return;

    if (!isVisible) {
      toast.warning("Please stay on this tab during the interview", {
        id: "tab-warning",
        duration: 3000,
      });
    }
  }, [isVisible, isActive]);

  if (!isActive) return null;

  const hasIssues = !faceDetected || !isVisible || gazeDeviationCount > 3 || tabSwitchCount > 2;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
        hasIssues
          ? "bg-warning/10 text-warning border border-warning/20"
          : "bg-success/10 text-success border border-success/20",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Face Detection Status */}
        <div className="flex items-center gap-1.5">
          <Eye className={cn("w-3.5 h-3.5", faceDetected ? "text-success" : "text-warning")} />
          <span className={faceDetected ? "text-success" : "text-warning"}>
            {faceDetected ? "Face visible" : "Face not detected"}
          </span>
        </div>

        {/* Tab Focus Status */}
        <div className="flex items-center gap-1.5">
          <MonitorOff className={cn("w-3.5 h-3.5", isVisible ? "text-success" : "text-warning")} />
          <span className={isVisible ? "text-success" : "text-warning"}>
            {isVisible ? "Focused" : "Tab switched"}
          </span>
        </div>

        {/* Warning Indicators */}
        {(gazeDeviationCount > 3 || tabSwitchCount > 2) && (
          <div className="flex items-center gap-1.5 text-warning">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              {gazeDeviationCount > 3 && `${gazeDeviationCount} gaze events`}
              {gazeDeviationCount > 3 && tabSwitchCount > 2 && " · "}
              {tabSwitchCount > 2 && `${tabSwitchCount} tab switches`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BehaviorMonitor;
