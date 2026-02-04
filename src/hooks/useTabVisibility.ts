import { useCallback, useEffect, useRef, useState } from "react";

interface TabEvent {
  timestamp: Date;
  type: "tab_switch" | "window_blur" | "window_focus";
  duration?: number;
}

interface UseTabVisibilityOptions {
  onTabSwitch?: (event: TabEvent) => void;
}

interface TabVisibilityState {
  isVisible: boolean;
  tabSwitchCount: number;
  totalHiddenTime: number;
  tabEvents: TabEvent[];
}

export const useTabVisibility = (options: UseTabVisibilityOptions = {}) => {
  const { onTabSwitch } = options;

  const [state, setState] = useState<TabVisibilityState>({
    isVisible: true,
    tabSwitchCount: 0,
    totalHiddenTime: 0,
    tabEvents: [],
  });

  const hiddenStartRef = useRef<number | null>(null);

  const addTabEvent = useCallback((event: TabEvent) => {
    setState((prev) => ({
      ...prev,
      tabEvents: [...prev.tabEvents, event],
      tabSwitchCount:
        event.type === "tab_switch" || event.type === "window_blur"
          ? prev.tabSwitchCount + 1
          : prev.tabSwitchCount,
    }));
    onTabSwitch?.(event);
  }, [onTabSwitch]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenStartRef.current = Date.now();
        setState((prev) => ({ ...prev, isVisible: false }));
        addTabEvent({
          timestamp: new Date(),
          type: "tab_switch",
        });
      } else {
        const duration = hiddenStartRef.current
          ? Date.now() - hiddenStartRef.current
          : 0;
        hiddenStartRef.current = null;
        setState((prev) => ({
          ...prev,
          isVisible: true,
          totalHiddenTime: prev.totalHiddenTime + duration,
        }));
      }
    };

    const handleWindowBlur = () => {
      if (!document.hidden) {
        hiddenStartRef.current = Date.now();
        setState((prev) => ({ ...prev, isVisible: false }));
        addTabEvent({
          timestamp: new Date(),
          type: "window_blur",
        });
      }
    };

    const handleWindowFocus = () => {
      const duration = hiddenStartRef.current
        ? Date.now() - hiddenStartRef.current
        : 0;
      hiddenStartRef.current = null;
      setState((prev) => ({
        ...prev,
        isVisible: true,
        totalHiddenTime: prev.totalHiddenTime + duration,
      }));
      addTabEvent({
        timestamp: new Date(),
        type: "window_focus",
        duration,
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [addTabEvent]);

  const resetEvents = useCallback(() => {
    setState({
      isVisible: true,
      tabSwitchCount: 0,
      totalHiddenTime: 0,
      tabEvents: [],
    });
  }, []);

  return {
    ...state,
    resetEvents,
  };
};
