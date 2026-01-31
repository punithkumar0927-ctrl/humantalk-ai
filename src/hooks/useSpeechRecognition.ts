import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  error: string | null;
}

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldRestartRef = useRef(false);

  const isSupported = typeof window !== "undefined" && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const initRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + " " + finalTranscript);
      } else if (interimTranscript) {
        // Show interim results for real-time feedback
        setTranscript((prev) => {
          const lastSpace = prev.lastIndexOf(" ");
          const base = lastSpace > 0 ? prev.substring(0, lastSpace) : prev;
          return base + " " + interimTranscript;
        });
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone permissions.");
        toast.error("Microphone access denied. Please check your browser permissions.");
        shouldRestartRef.current = false;
      } else if (event.error === "no-speech") {
        // Don't show error for no-speech, just restart
        if (shouldRestartRef.current) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              // Ignore if already started
            }
          }, 100);
        }
      } else if (event.error === "aborted") {
        // User stopped, don't restart
      } else {
        setError(`Speech recognition error: ${event.error}`);
        toast.error("Voice recognition error. Try again or use text input.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if we should keep listening
      if (shouldRestartRef.current) {
        setTimeout(() => {
          try {
            recognition.start();
            setIsListening(true);
          } catch (e) {
            console.log("Could not restart recognition");
          }
        }, 100);
      }
    };

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    return recognition;
  }, [isSupported]);

  useEffect(() => {
    if (isSupported && !recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    return () => {
      if (recognitionRef.current) {
        shouldRestartRef.current = false;
        recognitionRef.current.abort();
      }
    };
  }, [isSupported, initRecognition]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast.error("Speech recognition is not supported in your browser.");
      return;
    }

    setError(null);
    shouldRestartRef.current = true;

    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    try {
      recognitionRef.current?.start();
      toast.success("Listening... Speak now!");
    } catch (e) {
      // Recognition might already be running
      console.log("Recognition start error:", e);
    }
  }, [isSupported, initRecognition]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error,
  };
};
