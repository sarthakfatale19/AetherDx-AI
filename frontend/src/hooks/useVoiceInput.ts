"use client";

import { useState, useCallback, useRef, useEffect, useSyncExternalStore } from "react";

export interface VoiceLanguage {
  code: string;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: VoiceLanguage[] = [
  { code: "en-US", label: "English", flag: "🇺🇸" },
  { code: "en-IN", label: "English (India)", flag: "🇮🇳" },
  { code: "hi-IN", label: "हिंदी (Hindi)", flag: "🇮🇳" },
  { code: "ta-IN", label: "தமிழ் (Tamil)", flag: "🇮🇳" },
  { code: "te-IN", label: "తెలుగు (Telugu)", flag: "🇮🇳" },
  { code: "bn-IN", label: "বাংলা (Bengali)", flag: "🇮🇳" },
  { code: "mr-IN", label: "मराठी (Marathi)", flag: "🇮🇳" },
  { code: "kn-IN", label: "ಕನ್ನಡ (Kannada)", flag: "🇮🇳" },
  { code: "ml-IN", label: "മലയാളം (Malayalam)", flag: "🇮🇳" },
  { code: "gu-IN", label: "ગુજરાતી (Gujarati)", flag: "🇮🇳" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ (Punjabi)", flag: "🇮🇳" },
];

function speechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

const subscribeSpeechSupport = () => () => {};

export interface UseVoiceInputOptions {
  onVoiceText?: (text: string, phase: "interim" | "final") => void;
}

export function useVoiceInput(options?: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [language, setLanguage] = useState<string>("en-IN");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onVoiceTextRef = useRef(options?.onVoiceText);

  useEffect(() => {
    onVoiceTextRef.current = options?.onVoiceText;
  }, [options?.onVoiceText]);

  const isSupported = useSyncExternalStore(
    subscribeSpeechSupport,
    speechRecognitionSupported,
    () => false
  );

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
          setConfidence(Math.round(result[0].confidence * 100));
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript(final);
        setInterimTranscript("");
        onVoiceTextRef.current?.(final, "final");
      } else if (interim) {
        setInterimTranscript(interim);
        onVoiceTextRef.current?.(interim, "interim");
      } else {
        setInterimTranscript("");
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {
        /* ignore if not active */
      }
      recognitionRef.current = null;
    };
  }, [language, isSupported]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      setInterimTranscript("");
      setConfidence(0);
      recognitionRef.current.lang = language;
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening, language]);

  const changeLanguage = useCallback((langCode: string) => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    setLanguage(langCode);
  }, [isListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    confidence,
    language,
    toggleListening,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}
