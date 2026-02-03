import { useCallback, useRef, useState } from "react";

interface UseTextToSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
}

export const useTextToSpeech = (options: UseTextToSpeechOptions = {}) => {
  const { rate = 1, pitch = 1, volume = 1, voiceName } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!isSupported) return null;
    
    const voices = window.speechSynthesis.getVoices();
    
    // Try to find specified voice
    if (voiceName) {
      const match = voices.find((v) => v.name.includes(voiceName));
      if (match) return match;
    }
    
    // Prefer high-quality English voices
    const preferredVoices = [
      "Google US English",
      "Google UK English Male",
      "Google UK English Female",
      "Microsoft David",
      "Microsoft Mark",
      "Alex",
      "Daniel",
      "Samantha",
    ];
    
    for (const name of preferredVoices) {
      const match = voices.find((v) => v.name.includes(name));
      if (match) return match;
    }
    
    // Fallback to any English voice
    const englishVoice = voices.find((v) => v.lang.startsWith("en"));
    if (englishVoice) return englishVoice;
    
    // Ultimate fallback
    return voices[0] || null;
  }, [isSupported, voiceName]);

  const speak = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!isSupported) {
          reject(new Error("Speech synthesis not supported"));
          return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        // Wait for voices to load (Chrome needs this)
        const setVoiceAndSpeak = () => {
          const voice = getVoice();
          if (voice) {
            utterance.voice = voice;
          }

          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => {
            setIsSpeaking(false);
            resolve();
          };
          utterance.onerror = (event) => {
            setIsSpeaking(false);
            // Don't reject on interrupted errors (common when canceling)
            if (event.error !== "interrupted") {
              reject(new Error(`Speech error: ${event.error}`));
            } else {
              resolve();
            }
          };

          window.speechSynthesis.speak(utterance);
        };

        // Check if voices are already loaded
        if (window.speechSynthesis.getVoices().length > 0) {
          setVoiceAndSpeak();
        } else {
          // Wait for voices to load
          window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
        }
      });
    },
    [isSupported, rate, pitch, volume, getVoice]
  );

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const pause = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.pause();
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.resume();
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported,
  };
};
